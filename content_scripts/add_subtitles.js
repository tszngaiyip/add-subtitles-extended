(function(){

if(window.has_run){
    const shadow_root = document.getElementById("shadow_host").shadowRoot;
    const menu = shadow_root.getElementById("addsubtitle_menu");
    menu.style.display = menu.style.display == "none" ? "inline-block" : "none";
    return;
}
else{
    if(document.getElementById("addsubtitle_menu") != null){
        document.getElementById("addsubtitle_menu").outerHTML = "";
        document.getElementById("subtitle_element").outerHTML = "";
    }
}
window.has_run = true;

// 全域變數定義 - 移除重複宣告，這些變數將在後面正確定義

// 新增：性能優化相關變數
// subtitleCache 將在後面以類別的形式定義
let isLargeFile = false;
const LARGE_FILE_THRESHOLD = 1024 * 1024; // 1MB
let loadingProgress = 0;

// 新增：錯誤處理類
class SubtitleError extends Error {
    constructor(message, type = 'GENERAL', details = null) {
        super(message);
        this.name = 'SubtitleError';
        this.type = type;
        this.details = details;
    }
}

// 新增：檔案驗證類
class FileValidator {
    static SUPPORTED_FORMATS = ['srt', 'vtt', 'ass', 'ssa'];
    static MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    static validateFile(file) {
        const errors = [];
        
        if (!file) {
            throw new SubtitleError('未選擇檔案', 'FILE_NOT_SELECTED');
        }
        
        // 檔案大小檢查
        if (file.size > this.MAX_FILE_SIZE) {
            throw new SubtitleError(
                `檔案過大 (${Math.round(file.size / 1024 / 1024)}MB)，最大支援 ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
                'FILE_TOO_LARGE'
            );
        }
        
        // 檔案格式檢查
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.SUPPORTED_FORMATS.includes(extension)) {
            throw new SubtitleError(
                `不支援的檔案格式: .${extension}。支援格式: ${this.SUPPORTED_FORMATS.join(', ')}`,
                'UNSUPPORTED_FORMAT'
            );
        }
        
        return {
            isLarge: file.size > LARGE_FILE_THRESHOLD,
            format: extension,
            size: file.size
        };
    }
    
    static validateContent(content, format) {
        if (!content || content.trim().length === 0) {
            throw new SubtitleError('字幕檔案內容為空', 'EMPTY_CONTENT');
        }
        
        // 格式特定驗證
        switch(format) {
            case 'srt':
                if (!this.validateSRTFormat(content)) {
                    throw new SubtitleError('SRT 格式驗證失敗', 'INVALID_SRT_FORMAT');
                }
                break;
            case 'vtt':
                if (!content.includes('WEBVTT')) {
                    throw new SubtitleError('VTT 格式驗證失敗：缺少 WEBVTT 標識', 'INVALID_VTT_FORMAT');
                }
                break;
            case 'ass':
            case 'ssa':
                if (!content.includes('[Events]') || !content.includes('[Script Info]')) {
                    throw new SubtitleError('ASS/SSA 格式驗證失敗：缺少必要區段', 'INVALID_ASS_FORMAT');
                }
                break;
        }
        
        return true;
    }
    
    static validateSRTFormat(content) {
        const blocks = content.trim().split(/\n\s*\n/);
        if (blocks.length === 0) return false;
        
        // 檢查至少一個字幕塊的格式
        const firstBlock = blocks[0].trim().split('\n');
        if (firstBlock.length < 3) return false;
        
        // 檢查序號
        const sequenceNumber = parseInt(firstBlock[0]);
        if (isNaN(sequenceNumber)) return false;
        
        // 檢查時間格式
        const timePattern = /^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}$/;
        return timePattern.test(firstBlock[1]);
    }
}

// 新增：進度顯示類
class ProgressIndicator {
    constructor(container) {
        this.container = container;
        this.progressElement = null;
    }
    
    show(message = '載入中...') {
        if (this.progressElement) {
            this.hide();
        }
        
        this.progressElement = document.createElement('div');
        this.progressElement.className = 'loading-progress';
        this.progressElement.innerHTML = `
            <div class="loading-message">${message}</div>
            <div class="loading-bar">
                <div class="loading-fill" style="width: 0%"></div>
            </div>
        `;
        
        this.container.appendChild(this.progressElement);
    }
    
    updateProgress(percent, message) {
        if (!this.progressElement) return;
        
        const fill = this.progressElement.querySelector('.loading-fill');
        const messageEl = this.progressElement.querySelector('.loading-message');
        
        if (fill) fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (message && messageEl) messageEl.textContent = message;
    }
    
    hide() {
        if (this.progressElement) {
            this.progressElement.remove();
            this.progressElement = null;
        }
    }
}

const subtitle_element = document.createElement("div");
subtitle_element.id = "subtitle_element";
document.body.append(subtitle_element);

const shadow_host = document.createElement("div");
shadow_host.id = "shadow_host";
document.body.appendChild(shadow_host);
const shadow = shadow_host.attachShadow({mode: "open"});
const shadow_root = shadow_host.shadowRoot;

const menu = document.createElement("div");
menu.id = "addsubtitle_menu";

// 使用DOM方法而非innerHTML
const closeButton = document.createElement("button");
closeButton.id = "close_button";
closeButton.textContent = "Close";
menu.appendChild(closeButton);

const line = document.createElement("div");
line.className = "line";

const textNode = document.createTextNode("List of video elements: ");
line.appendChild(textNode);

const refreshButton = document.createElement("button");
refreshButton.id = "refresh_video_list";
refreshButton.textContent = "Refresh List";
line.appendChild(refreshButton);

menu.appendChild(line);

const video_elements_list = document.createElement("div");
video_elements_list.id = "video_elements_list";
menu.appendChild(video_elements_list);

const make_video_fullscreen = document.createElement("div");
make_video_fullscreen.className = "line";

const make_video_fullscreen_button = document.createElement("button");
make_video_fullscreen_button.id = "make_video_fullscreen";
make_video_fullscreen_button.textContent = "Make video fullscreen";
make_video_fullscreen.appendChild(make_video_fullscreen_button);

menu.appendChild(make_video_fullscreen);

const subtitle_file_fieldset = document.createElement("fieldset");
subtitle_file_fieldset.innerHTML = `
    <legend>Subtitles file:</legend>
    <div class="line">
        Upload file: <input type="file" accept=".srt,.vtt,.ass,.ssa" id="subtitle_file_input" autocomplete="off">
    </div>
    <div class="line">
        Or from URL (zip supported): <input type="text" id="subtitle_url_input" autocomplete="off">
    </div>
    <div class="line">
        <button id="subtitle_upload_button">Upload</button> 
        <button id="retry_button" style="display:none;">重試</button>
        <span id="upload_error_message"></span>
    </div>
    <div id="upload_progress_container"></div>
`;
menu.appendChild(subtitle_file_fieldset);

var subtitle_offset_line = document.createElement("div");
subtitle_offset_line.className = "line";
subtitle_offset_line.appendChild(document.createTextNode("Time offset: "));

var subtitle_offset_input = document.createElement("input");
subtitle_offset_input.type = "number";
subtitle_offset_input.step = "0.01";
subtitle_offset_input.id = "subtitle_offset_input";
subtitle_offset_input.value = "0";
subtitle_offset_line.appendChild(subtitle_offset_input);
subtitle_offset_line.appendChild(document.createTextNode(" seconds"));

var position_offset_line = document.createElement("div");
position_offset_line.className = "line";
position_offset_line.appendChild(document.createTextNode("Position offset: "));

var subtitle_offset_top_input = document.createElement("input");
subtitle_offset_top_input.type = "number";
subtitle_offset_top_input.id = "subtitle_offset_top_input";
subtitle_offset_top_input.value = "-100";
position_offset_line.appendChild(subtitle_offset_top_input);
position_offset_line.appendChild(document.createTextNode(" px"));

var subtitle_font_size_line = document.createElement("div");
subtitle_font_size_line.className = "line";
subtitle_font_size_line.appendChild(document.createTextNode("Font size: "));

var subtitle_font_size_input = document.createElement("input");
subtitle_font_size_input.type = "number";
subtitle_font_size_input.id = "subtitle_font_size";
subtitle_font_size_input.value = "26";
subtitle_font_size_line.appendChild(subtitle_font_size_input);
subtitle_font_size_line.appendChild(document.createTextNode(" px"));

var subtitle_font_line = document.createElement("div");
subtitle_font_line.className = "line";
subtitle_font_line.appendChild(document.createTextNode("Font: "));

var subtitle_font_input = document.createElement("input");
subtitle_font_input.type = "text";
subtitle_font_input.id = "subtitle_font";
subtitle_font_input.value = "Arial";
subtitle_font_line.appendChild(subtitle_font_input);

var subtitle_font_color_line = document.createElement("div");
subtitle_font_color_line.className = "line";
subtitle_font_color_line.appendChild(document.createTextNode("Font color: "));

var subtitle_font_color_input = document.createElement("input");
subtitle_font_color_input.type = "text";
subtitle_font_color_input.id = "subtitle_font_color";
subtitle_font_color_input.value = "rgba(255, 255, 255, 1)";
subtitle_font_color_line.appendChild(subtitle_font_color_input);

var subtitle_background_color_line = document.createElement("div");
subtitle_background_color_line.className = "line";
subtitle_background_color_line.appendChild(document.createTextNode("Background color: "));

var subtitle_background_color_input = document.createElement("input");
subtitle_background_color_input.type = "text";
subtitle_background_color_input.id = "subtitle_background_color";
subtitle_background_color_input.value = "rgba(0, 0, 0, 0.7)";
subtitle_background_color_line.appendChild(subtitle_background_color_input);

menu.appendChild(subtitle_offset_line);
menu.appendChild(position_offset_line);
menu.appendChild(subtitle_font_size_line);
menu.appendChild(subtitle_font_line);
menu.appendChild(subtitle_font_color_line);
menu.appendChild(subtitle_background_color_line);

// 添加簡繁轉換狀態顯示
var converter_status_line = document.createElement("div");
converter_status_line.className = "line";
converter_status_line.id = "converter_status_line";
converter_status_line.appendChild(document.createTextNode("轉換器狀態: "));

var converter_status_span = document.createElement("span");
converter_status_span.id = "converter_status";
converter_status_span.textContent = "初始化中...";
converter_status_span.style.color = "orange";
converter_status_line.appendChild(converter_status_span);

// 添加手動重新載入按鈕
var reload_converter_button = document.createElement("button");
reload_converter_button.id = "reload_converter";
reload_converter_button.textContent = "重新載入轉換器";
reload_converter_button.style.marginLeft = "10px";
converter_status_line.appendChild(reload_converter_button);

menu.appendChild(converter_status_line);

shadow.appendChild(menu);

var style = document.createElement("style");
style.textContent = `
#addsubtitle_menu *{
    font-family: monospace;
    font-size: 12px;
    line-height: normal !important;
    box-sizing: border-box !important;
}

/* 新增：進度條樣式 */
.loading-progress {
    margin-top: 10px;
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 5px;
    border: 1px solid #ccc;
}

.loading-message {
    font-size: 12px;
    color: #333;
    margin-bottom: 8px;
}

.loading-bar {
    width: 100%;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.loading-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #45a049);
    border-radius: 10px;
    transition: width 0.3s ease;
    position: relative;
}

.loading-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
button{
    cursor: pointer;
}
.line{
    margin-top: 9px;
}
#addsubtitle_menu{
    z-index: 1000000;
    position: fixed;
    right: 14px;
    bottom: 14px;
    width: 430px;
    border: 1px solid black;
    padding-left: 14px;
    padding-right: 16px;
    padding-top: 6px;
    padding-bottom: 12px;
    background-color: white;
    color: black;
}
button{
    background-color: white;
    border: 1px solid black;
    color: black;
    padding: 2px;
}
button:hover{
    background-color: #f0f0f0;
}
button:active{
    background-color: #ddd;
}
input[type="file"]{
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}
input:not([type="file"]){
    border: 1px solid black;
    height: 18px;
    width: 200px;
}
#video_elements_list{
    margin-top: 8px;
    padding-top: 8px;
}
.video_list_item{
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border: 1px solid black;
    margin-top: -1px;
    padding: 3px;
    cursor: pointer;
}
#video_elements_list .selected_video_list, #video_elements_list .hover_video_list{
    border: 2px solid red;
}
#close_button{
    position: absolute;
    top: 12px;
    right: 15px;
}
#no_videos{
    border: 1px solid black;
    padding: 5px;
}
#upload_error_message{
    color: red;
}
`;
shadow.appendChild(style);

var globalStyle = document.createElement("style");
globalStyle.textContent = `
.hover_video_element{
    border: 4px solid red;
}
#subtitle_element{
    text-align: center;
    pointer-events: none;
}
.subtitle_line{
    display: inline-block;
    text-align: center;
    z-index: 99999;
}`;
document.getElementsByTagName("head")[0].appendChild(globalStyle);

function update_video_elements_list(){
    var video_elements = document.getElementsByTagName("video");
    var video_elements_list = shadow_root.getElementById("video_elements_list");
    video_elements_list.innerHTML = "";
    if(video_elements.length == 0){
        // 使用更安全的DOM方法替代innerHTML
        const noVideosDiv = document.createElement("div");
        noVideosDiv.id = "no_videos";
        noVideosDiv.textContent = "No video elements found.";
        
        const lineBreak = document.createElement("br");
        noVideosDiv.appendChild(lineBreak);
        
        const frameText = document.createTextNode("If your video is inside and iframe, press shift+right click on it then \"This Frame\" > \"Open Frame in New Tab\"");
        noVideosDiv.appendChild(frameText);
        
        video_elements_list.appendChild(noVideosDiv);
        return;
    }
    for(var i = 0; i < video_elements.length; i++){
        var video_list_item = document.createElement("div");
        video_list_item.className = "video_list_item";
        video_list_item.textContent = video_elements[i].currentSrc;
        (function(){
            var current_video_element = video_elements[i];
            video_list_item.addEventListener("mouseenter", function(){
                this.classList.add("hover_video_list");
                current_video_element.classList.add("hover_video_element");
            });
            video_list_item.addEventListener("mouseleave", function(){
                this.classList.remove("hover_video_list");
                current_video_element.classList.remove("hover_video_element");
            });
            video_list_item.addEventListener("click", function(){
                var list = shadow_root.querySelectorAll(".video_list_item");
                for(var i = 0; i < list.length; i++){
                    list[i].classList.remove("selected_video_list");
                }
                if(the_video_element == current_video_element){
                    the_video_element = null;
                    subtitle_element.innerHTML = "";
                }
                else{
                    the_video_element = current_video_element;
                    this.classList.add("selected_video_list");
                }
            });
        }());
        video_elements_list.append(video_list_item);
    }
}

// 改善：使用現代化變數宣告和初始化
let subtitle_offset = parseFloat(shadow_root.getElementById("subtitle_offset_input").value);
let subtitle_offset_top = parseFloat(shadow_root.getElementById("subtitle_offset_top_input").value);

let subtitles = [];
let the_video_element = null;

let subtitle_font = shadow_root.getElementById("subtitle_font").value;
let subtitle_font_size = shadow_root.getElementById("subtitle_font_size").value;
let subtitle_font_color = shadow_root.getElementById("subtitle_font_color").value;
let subtitle_background_color = shadow_root.getElementById("subtitle_background_color").value;

// 新增：性能優化 - 字幕緩存管理
class SubtitleCache {
    constructor(maxSize = 10) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.accessOrder = [];
    }
    
    set(key, value) {
        if (this.cache.has(key)) {
            // 更新訪問順序
            this.accessOrder = this.accessOrder.filter(k => k !== key);
        } else if (this.cache.size >= this.maxSize) {
            // 移除最舊的項目
            const oldest = this.accessOrder.shift();
            this.cache.delete(oldest);
        }
        
        this.cache.set(key, value);
        this.accessOrder.push(key);
    }
    
    get(key) {
        if (this.cache.has(key)) {
            // 更新訪問順序
            this.accessOrder = this.accessOrder.filter(k => k !== key);
            this.accessOrder.push(key);
            return this.cache.get(key);
        }
        return null;
    }
    
    has(key) {
        return this.cache.has(key);
    }
    
    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }
}

const subtitleCache = new SubtitleCache();

// 新增：網路請求重試機制
class NetworkRetry {
    static async fetchWithRetry(url, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    return response;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            } catch (error) {
                lastError = error;
                console.warn(`請求失敗 (嘗試 ${attempt}/${maxRetries}):`, error.message);
                
                if (attempt < maxRetries) {
                    // 指數退避策略
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new SubtitleError(
            `網路請求失敗，已重試 ${maxRetries} 次: ${lastError.message}`,
            'NETWORK_ERROR',
            { url, attempts: maxRetries, lastError }
        );
    }
}

// 簡繁轉換系統 - 純 OpenCC-JS 方案
class ChineseConverter {
    constructor() {
        this.initialized = false;
        this.openccLoaded = false;
        this.converter = null;
        this.initOpenCC();
    }
    
    async initOpenCC() {
        try {
            // 檢查是否已經載入 OpenCC
            if (typeof window.OpenCC !== 'undefined') {
                this.setupOpenCC();
                return;
            }
            
            // 動態載入 OpenCC-JS
            await this.loadOpenCCScript();
            this.setupOpenCC();
        } catch (error) {
            console.warn('OpenCC 載入失敗，字幕將保持原文:', error);
            this.initialized = true;
        }
    }
    
    loadOpenCCScript() {
        return new Promise((resolve, reject) => {
            // 檢查是否已經有載入中的腳本
            if (document.querySelector('script[src*="opencc-js"]')) {
                // 等待載入完成
                const checkInterval = setInterval(() => {
                    if (typeof window.OpenCC !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                // 10秒後超時
                setTimeout(() => {
                    clearInterval(checkInterval);
                    reject(new Error('OpenCC 載入超時'));
                }, 10000);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.js';
            script.onload = () => {
                console.log('OpenCC-JS 載入成功');
                resolve();
            };
            script.onerror = () => {
                console.warn('OpenCC-JS CDN 載入失敗，嘗試備用 CDN');
                // 嘗試備用 CDN
                const fallbackScript = document.createElement('script');
                fallbackScript.src = 'https://unpkg.com/opencc-js@1.0.5/dist/umd/cn2t.js';
                fallbackScript.onload = resolve;
                fallbackScript.onerror = reject;
                document.head.appendChild(fallbackScript);
            };
            document.head.appendChild(script);
        });
    }
    
    setupOpenCC() {
        try {
            // 創建簡體轉繁體的轉換器
            this.converter = window.OpenCC.Converter({ from: 'cn', to: 'tw' });
            this.openccLoaded = true;
            this.initialized = true;
            console.log('OpenCC 轉換器初始化成功');
        } catch (error) {
            console.error('OpenCC 轉換器初始化失敗:', error);
            this.initialized = true;
        }
    }
    
    convert(text) {
        if (!text) return text;
        
        // 只有 OpenCC 可用時才進行轉換，否則保持原文
        if (this.openccLoaded && this.converter) {
            try {
                return this.converter(text);
            } catch (error) {
                console.warn('OpenCC 轉換失敗，保持原文:', error);
                return text;
            }
        }
        
        // OpenCC 不可用時直接返回原文
        return text;
    }
    
    // 檢查轉換器狀態
    getStatus() {
        return {
            initialized: this.initialized,
            openccLoaded: this.openccLoaded,
            hasConverter: !!this.converter
        };
    }
}

// 創建全局轉換器實例
const chineseConverter = new ChineseConverter();



function xss(input){
    input = input.replace(/\&/g, "&amp;");
    input = input.replace(/\</g, "&lt;");
    input = input.replace(/\>/g, "&gt;");
    input = input.replace(/\"/g, "&quot;");
    input = input.replace(/\'/g, "&#x27;");
    input = input.replace(/\//g, "&#x2F;");
    return input;
}

function allow_tags(input, tags){
    // 先進行簡繁轉換，直接轉換，無需條件判斷
    input = chineseConverter.convert(input);
    
    // 只處理允許的標籤，更安全的方式
    for(var i = 0; i < tags.length; i++){
        // 簡單標籤，如<b>
        var regex = new RegExp("&lt;"+tags[i]+"&gt;", "g");
        input = input.replace(regex, "<"+tags[i]+">");
        
        // 結束標籤，如</b>
        regex = new RegExp("&lt;&#x2F;"+tags[i]+"&gt;", "g");
        input = input.replace(regex, "</"+tags[i]+">");
        
        // 帶屬性的標籤處理 - 但我們將忽略所有屬性，只保留純標籤
        // 例如 <b style="..."> 會變成 <b>
        regex = new RegExp("&lt;"+tags[i]+"\\s+[^&]*&gt;", "g");
        input = input.replace(regex, "<"+tags[i]+">");
    }
    return input;
}

// 明確定義允許的安全HTML標籤
var allowed_html_tags = ["b", "i", "u", "br"];

setInterval(function(){
    if(subtitles.length == 0) return;
    var t = the_video_element.currentTime;
    var found = -1;
    for(var i = 0; i < subtitles.length; i++){
        if(subtitles[i].begin+subtitle_offset <= t && subtitles[i].end+subtitle_offset >= t){
            found = i;
            break;
        }
    }
    if(found == -1){
        subtitle_element.textContent = "";
    }
    else{
        subtitle_element.innerHTML = "";
        for(var i = 0; i < subtitles[found].text.length; i++){
            var subtitle_line = document.createElement("div");
            var sanitizedText = allow_tags(xss(subtitles[found].text[i]), allowed_html_tags);
            var tempDiv = document.createElement("div");
            tempDiv.textContent = "";
            const parser = new DOMParser();
            const doc = parser.parseFromString("<div>" + sanitizedText + "</div>", "text/html");
            Array.from(doc.body.firstChild.childNodes).forEach(node => {
                tempDiv.appendChild(node.cloneNode(true));
            });
            while (tempDiv.firstChild) {
                subtitle_line.appendChild(tempDiv.firstChild);
            }
            subtitle_line.className = "subtitle_line";
            subtitle_line.style.cssText = "font-family: "+subtitle_font+
                ";font-size: "+subtitle_font_size+
                "px;color:"+subtitle_font_color+
                ";background-color:"+subtitle_background_color+";";
            subtitle_element.appendChild(subtitle_line);
            subtitle_element.appendChild(document.createElement("br"));
        }
    }
    subtitle_pos();
}, 100);

function get_offset(e){
    var top = 0;
    var left = 0;
    do {
        top += e.offsetTop || 0;
        left += e.offsetLeft || 0;
        e = e.offsetParent;
    } while(e);
    return [top, left];
}

function subtitle_pos(){
    var subtitle_height = subtitle_element.getBoundingClientRect().height;
    if(video_fullscreen){
        var sub_pos_top = the_video_element.getBoundingClientRect().top+
                        the_video_element.offsetHeight+
                        subtitle_offset_top-subtitle_height;
        var sub_pos_left = get_offset(the_video_element)[1];
        subtitle_element.style.position = "fixed";
        subtitle_element.style.width = the_video_element.offsetWidth+"px";
        subtitle_element.style.top = sub_pos_top+"px";
        subtitle_element.style.left = sub_pos_left+"px";
    }
    else{
        var the_video_element_height = the_video_element.offsetHeight;
        var the_video_element_top = get_offset(the_video_element)[0];

        var sub_pos_top = the_video_element_height+the_video_element_top+subtitle_offset_top-subtitle_height;
        var sub_pos_left = get_offset(the_video_element)[1];

        subtitle_element.style.position = "absolute";
        subtitle_element.style.width = the_video_element.offsetWidth+"px";
        subtitle_element.style.top = sub_pos_top+"px";
        subtitle_element.style.left = sub_pos_left+"px";
    }
    subtitle_element.style.zIndex = "99999";
}

function time_parse(t){
    var split = t.split(":");
    var hours = split[0]*60*60;
    var minutes = split[1]*60;
    var seconds = parseFloat(t.split(":")[2].replace(",", "."));
    return hours+minutes+seconds;
}

function parse_ass_subtitles(subs) {
    subtitles.length = 0;
    
    // 按行分割
    var lines = subs.split(/\r?\n/);
    var inEvents = false;
    var dialogueFormat = [];
    
    // 遍歷每一行
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        
        // 跳過空行
        if (line === '') continue;
        
        // 檢查是否進入 [Events] 部分
        if (line === '[Events]') {
            inEvents = true;
            continue;
        }
        
        // 如果在 [Events] 部分
        if (inEvents) {
            // 獲取格式行
            if (line.startsWith('Format:')) {
                // 解析格式定義
                var formatParts = line.substring(7).split(',').map(part => part.trim());
                dialogueFormat = formatParts;
                continue;
            }
            
            // 解析對話行
            if (line.startsWith('Dialogue:')) {
                var dialogueParts = [];
                var currentPart = '';
                var inQuotes = false;
                var braceLevel = 0;
                
                // 分割對話行，處理可能包含逗號的文本內容
                for (var j = 10; j < line.length; j++) {
                    var char = line[j];
                    
                    // 處理花括號嵌套
                    if (char === '{') {
                        braceLevel++;
                        inQuotes = true;
                    } else if (char === '}' && braceLevel > 0) {
                        braceLevel--;
                        if (braceLevel === 0) {
                            inQuotes = false;
                        }
                    }
                    
                    // 只有當不在引號中且字符為逗號時才分割
                    if (char === ',' && !inQuotes) {
                        dialogueParts.push(currentPart);
                        currentPart = '';
                    } else {
                        currentPart += char;
                    }
                }
                // 添加最後一部分
                if (currentPart) {
                    dialogueParts.push(currentPart);
                }
                
                // 查找格式中 Start、End 和 Text 的索引
                var startIdx = dialogueFormat.indexOf('Start');
                var endIdx = dialogueFormat.indexOf('End');
                var textIdx = dialogueFormat.indexOf('Text');
                
                if (startIdx !== -1 && endIdx !== -1 && textIdx !== -1 && dialogueParts.length > Math.max(startIdx, endIdx, textIdx)) {
                    // 獲取開始時間、結束時間和文本
                    var startTime = dialogueParts[startIdx].trim();
                    var endTime = dialogueParts[endIdx].trim();
                    var text = dialogueParts[textIdx].trim();
                    
                    // 清理 ASS 特定的格式代碼
                    text = cleanAssFormatting(text);
                    
                    // 處理 ASS 中的換行符號 \N，將其轉換為數組項
                    var textLines = processAssLineBreaks(text);
                    
                    // 轉換為秒數
                    var startSec = ass_time_parse(startTime);
                    var endSec = ass_time_parse(endTime);
                    
                    // 添加到字幕數組
                    subtitles.push({
                        begin: startSec,
                        end: endSec,
                        text: textLines
                    });
                }
            }
        }
    }
    
    // 按時間順序排序字幕
    subtitles.sort(function(a, b) {
        return a.begin - b.begin;
    });
}

// 清理 ASS 格式標記
function cleanAssFormatting(text) {
    // 處理嵌套樣式標記
    // 為了處理可能的複雜情況，先用臨時標記替換
    
    // 處理粗體
    text = text.replace(/{[^}]*\\b1[^}]*}/g, function(match) {
        return match.includes('\\b0') ? '' : '<b>';
    });
    text = text.replace(/{[^}]*\\b0[^}]*}/g, '</b>');
    
    // 處理斜體
    text = text.replace(/{[^}]*\\i1[^}]*}/g, function(match) {
        return match.includes('\\i0') ? '' : '<i>';
    });
    text = text.replace(/{[^}]*\\i0[^}]*}/g, '</i>');
    
    // 處理下劃線
    text = text.replace(/{[^}]*\\u1[^}]*}/g, function(match) {
        return match.includes('\\u0') ? '' : '<u>';
    });
    text = text.replace(/{[^}]*\\u0[^}]*}/g, '</u>');
    
    // 處理一些特殊的 ASS 轉義序列
    text = text.replace(/\\h/g, ' '); // 硬空格
    text = text.replace(/\\N|\\n/g, '\\N'); // 標準化換行符
    
    // 處理 ASS 中的特殊符號
    text = text.replace(/\\s/g, ' '); // 空格
    text = text.replace(/\\N/g, '\\N'); // 保持換行符
    
    // 處理其他可能的轉義字符和控制序列
    text = text.replace(/\\t\([^)]*\)/g, ''); // 移除變換效果
    text = text.replace(/\\[a-zA-Z]+\d*\([^)]*\)/g, ''); // 移除函數樣式
    text = text.replace(/\\[A-Za-z]\d+/g, ''); // 移除其他控制字符
    
    // 移除所有剩餘的格式標記
    text = text.replace(/{[^}]*}/g, '');
    
    // 對清理後的文本進行簡繁轉換，直接轉換，無需條件判斷
    text = chineseConverter.convert(text);
    
    return text;
}

// 處理 ASS 換行符
function processAssLineBreaks(text) {
    var textLines = [];
    
    // 標準化並分割換行
    if (text.includes('\\N')) {
        var parts = text.split('\\N');
        for (var i = 0; i < parts.length; i++) {
            var line = parts[i].trim();
            if (line !== '') {
                textLines.push(line);
            }
        }
    } else {
        textLines.push(text);
    }
    
    // 確保沒有空行
    textLines = textLines.filter(function(line) {
        return line.trim() !== '';
    });
    
    // 如果沒有有效行，添加一個空白行
    if (textLines.length === 0) {
        textLines.push('');
    }
    
    return textLines;
}

// 解析 ASS 時間格式（h:mm:ss.cc）為秒
function ass_time_parse(t) {
    var parts = t.split(':');
    if (parts.length < 3) {
        // 處理可能的格式問題，確保至少有三個部分
        console.error("無效的 ASS 時間格式:", t);
        return 0;
    }
    
    var hours = parseFloat(parts[0]) * 3600;
    var minutes = parseFloat(parts[1]) * 60;
    var seconds = 0;
    
    // 處理秒和毫秒部分
    var secParts = parts[2].split('.');
    seconds = parseFloat(secParts[0]);
    if (secParts.length > 1) {
        // 將小數部分轉換為秒的小數
        seconds += parseFloat('0.' + secParts[1]);
    }
    
    return hours + minutes + seconds;
}

// 改善：現代化的字幕解析函數，增加錯誤處理和驗證
async function parse_subtitles(subs, format = 'auto') {
    try {
        // 清空現有字幕
        subtitles.length = 0;
        
        // 檢查緩存
        const cacheKey = btoa(subs.substring(0, 1000)); // 使用前1000字符作為緩存鍵
        if (subtitleCache.has(cacheKey)) {
            const cached = subtitleCache.get(cacheKey);
            subtitles.push(...cached);
            console.log('使用緩存的字幕數據');
            return;
        }
        
        // 自動檢測格式
        if (format === 'auto') {
            format = detectSubtitleFormat(subs);
        }
        
        // 驗證內容
        FileValidator.validateContent(subs, format);
        
        let parsedSubtitles = [];
        
        // 根據格式選擇解析器
        switch(format) {
            case 'ass':
            case 'ssa':
                parsedSubtitles = await parseAssSubtitles(subs);
                break;
            case 'vtt':
                parsedSubtitles = await parseVttSubtitles(subs);
                break;
            case 'srt':
            default:
                parsedSubtitles = await parseSrtSubtitles(subs);
                break;
        }
        
        // 驗證解析結果
        validateParsedSubtitles(parsedSubtitles);
        
        // 排序字幕
        parsedSubtitles.sort((a, b) => a.begin - b.begin);
        
        // 儲存到全域變數和緩存
        subtitles.push(...parsedSubtitles);
        subtitleCache.set(cacheKey, parsedSubtitles);
        
        console.log(`成功解析 ${subtitles.length} 條字幕 (${format.toUpperCase()} 格式)`);
        
    } catch (error) {
        if (error instanceof SubtitleError) {
            throw error;
        }
        throw new SubtitleError(
            `字幕解析失敗: ${error.message}`,
            'PARSE_ERROR',
            { originalError: error }
        );
    }
}

// 新增：格式檢測函數
function detectSubtitleFormat(content) {
    const trimmed = content.trim();
    
    if (trimmed.includes('[Script Info]') && trimmed.includes('[Events]')) {
        return trimmed.includes('Format: Layer') ? 'ass' : 'ssa';
    }
    
    if (trimmed.startsWith('WEBVTT')) {
        return 'vtt';
    }
    
    // 檢查是否為SRT格式（包含時間戳格式）
    if (/^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/m.test(trimmed)) {
        return 'srt';
    }
    
    // 預設為SRT
    return 'srt';
}

// 改善的SRT解析器
async function parseSrtSubtitles(subs) {
    const parsedSubtitles = [];
    subs = subs.replace(/\r/g, "");
    const blocks = subs.split("\n\n");

    for(let i = 0; i < blocks.length; i++){
        const lines = blocks[i].trim().split("\n");
        if(lines.length < 3) continue;
        
        // 找時間軸行
        let timeLineIndex = -1;
        for(let j = 0; j < Math.min(2, lines.length); j++) {
            if(lines[j].includes(" --> ")) {
                timeLineIndex = j;
                break;
            }
        }
        
        if(timeLineIndex === -1) continue;
        
        try {
            const timeParts = lines[timeLineIndex].split(" --> ");
            if(timeParts.length !== 2) continue;
            
            const beginTime = time_parse(timeParts[0].trim());
            const endTime = time_parse(timeParts[1].trim());
            
            // 驗證時間軸
            if(isNaN(beginTime) || isNaN(endTime) || beginTime >= endTime) {
                console.warn(`跳過無效時間軸: ${lines[timeLineIndex]}`);
                continue;
            }
            
            // 收集文字內容
            const textLines = [];
            for(let j = timeLineIndex + 1; j < lines.length; j++){
                if(lines[j].trim()) {
                    textLines.push(lines[j].trim());
                }
            }
            
            if(textLines.length > 0) {
                parsedSubtitles.push({
                    begin: beginTime,
                    end: endTime,
                    text: textLines
                });
            }
        } catch (error) {
            console.warn(`解析字幕塊失敗 (第${i+1}塊):`, error.message);
        }
    }
    
    return parsedSubtitles;
}

// 新增：VTT解析器
async function parseVttSubtitles(subs) {
    const parsedSubtitles = [];
    const lines = subs.replace(/\r/g, "").split("\n");
    
    let i = 0;
    // 跳過WEBVTT標頭
    while(i < lines.length && !lines[i].includes("-->")) {
        i++;
    }
    
    while(i < lines.length) {
        // 尋找時間軸行
        while(i < lines.length && !lines[i].includes("-->")) {
            i++;
        }
        
        if(i >= lines.length) break;
        
        try {
            const timeLine = lines[i];
            const timeParts = timeLine.split(" --> ");
            if(timeParts.length !== 2) {
                i++;
                continue;
            }
            
            const beginTime = time_parse(timeParts[0].trim());
            const endTime = time_parse(timeParts[1].split(' ')[0].trim()); // 移除VTT樣式標記
            
            if(isNaN(beginTime) || isNaN(endTime) || beginTime >= endTime) {
                i++;
                continue;
            }
            
            // 收集文字
            i++;
            const textLines = [];
            while(i < lines.length && lines[i].trim() !== "") {
                if(lines[i].trim()) {
                    textLines.push(lines[i].trim());
                }
                i++;
            }
            
            if(textLines.length > 0) {
                parsedSubtitles.push({
                    begin: beginTime,
                    end: endTime,
                    text: textLines
                });
            }
            
        } catch (error) {
            console.warn(`VTT解析錯誤:`, error.message);
            i++;
        }
    }
    
    return parsedSubtitles;
}

// 重命名原有函數
async function parseAssSubtitles(subs) {
    return new Promise((resolve) => {
        parse_ass_subtitles(subs);
        resolve([...subtitles]);  // 返回副本
    });
}

// 新增：字幕驗證函數
function validateParsedSubtitles(parsedSubtitles) {
    if (!Array.isArray(parsedSubtitles)) {
        throw new SubtitleError('解析結果不是陣列', 'INVALID_PARSE_RESULT');
    }
    
    if (parsedSubtitles.length === 0) {
        throw new SubtitleError('未找到有效的字幕條目', 'NO_SUBTITLES_FOUND');
    }
    
    // 檢查重疊和無效時間
    let overlapCount = 0;
    let invalidTimeCount = 0;
    
    for (let i = 0; i < parsedSubtitles.length; i++) {
        const subtitle = parsedSubtitles[i];
        
        // 檢查時間有效性
        if (typeof subtitle.begin !== 'number' || typeof subtitle.end !== 'number' ||
            isNaN(subtitle.begin) || isNaN(subtitle.end) ||
            subtitle.begin < 0 || subtitle.end <= subtitle.begin) {
            invalidTimeCount++;
            continue;
        }
        
        // 檢查與下一個字幕的重疊
        if (i < parsedSubtitles.length - 1) {
            const nextSubtitle = parsedSubtitles[i + 1];
            if (subtitle.end > nextSubtitle.begin) {
                overlapCount++;
            }
        }
    }
    
    if (invalidTimeCount > 0) {
        console.warn(`發現 ${invalidTimeCount} 個無效時間軸的字幕`);
    }
    
    if (overlapCount > 0) {
        console.warn(`發現 ${overlapCount} 個重疊的字幕`);
    }
    
    // 如果大部分字幕都有問題，拋出錯誤
    if (invalidTimeCount > parsedSubtitles.length * 0.5) {
        throw new SubtitleError(
            `字幕品質過低：${invalidTimeCount}/${parsedSubtitles.length} 條字幕有時間軸問題`,
            'POOR_QUALITY_SUBTITLES'
        );
    }
}

function switch_fullscreen_video(){
    if(the_video_element == null) return;

    video_fullscreen = true;
    
    // 保存視頻的原始父元素和位置信息，以便之後恢復
    if (!the_video_element._originalParent) {
        the_video_element._originalParent = the_video_element.parentNode;
        the_video_element._originalStyles = {
            position: the_video_element.style.position,
            top: the_video_element.style.top,
            left: the_video_element.style.left,
            width: the_video_element.style.width,
            height: the_video_element.style.height,
            zIndex: the_video_element.style.zIndex,
            display: the_video_element.style.display || "block"
        };
    }

    // 先設置視頻元素樣式
    the_video_element.style.position = "fixed";
    the_video_element.style.top = "0px";
    the_video_element.style.left = "0px";
    the_video_element.style.zIndex = "99998";
    the_video_element.style.width = "100%";
    the_video_element.style.height = "100%";
    the_video_element.style.display = "block";
    the_video_element.style.visibility = "visible";
    the_video_element.style.opacity = "1";
    
    // 設置字幕元素樣式
    document.getElementById("subtitle_element").style.zIndex = "99999";
    document.documentElement.style.overflow = "hidden";
    
    // 創建或更新黑色背景
    var blackBackground;
    if(!document.getElementById("fullscreen_video_black_background")){
        blackBackground = document.createElement("div");
        blackBackground.id = "fullscreen_video_black_background";
        document.body.append(blackBackground);
    } else {
        blackBackground = document.getElementById("fullscreen_video_black_background");
    }
    
    // 設置黑色背景樣式，確保z-index低於視頻
    blackBackground.style.backgroundColor = "black";
    blackBackground.style.margin = "0px";
    blackBackground.style.padding = "0px";
    blackBackground.style.position = "fixed";
    blackBackground.style.top = "0px";
    blackBackground.style.left = "0px";
    blackBackground.style.zIndex = "99997";
    blackBackground.style.width = "100%";
    blackBackground.style.height = "100%";
    
    // 暫存原始父元素的引用
    var originalParent = the_video_element.parentNode;
    
    // 將視頻元素移至黑色背景之上
    document.body.appendChild(the_video_element);
    
    // 創建控制界面
    createFullscreenControls();
    
    // 請求全屏並處理錯誤
    document.documentElement.requestFullscreen().catch(err => {
        console.error("全屏請求失敗:", err);
        
        // 創建錯誤提示元素
        var errorMessage = document.createElement("div");
        errorMessage.id = "fullscreen_error_message";
        errorMessage.style.position = "fixed";
        errorMessage.style.bottom = "10px";
        errorMessage.style.left = "50%";
        errorMessage.style.transform = "translateX(-50%)";
        errorMessage.style.backgroundColor = "rgba(255, 0, 0, 0.8)";
        errorMessage.style.color = "white";
        errorMessage.style.padding = "10px";
        errorMessage.style.borderRadius = "5px";
        errorMessage.style.zIndex = "100000";
        errorMessage.style.fontFamily = "Arial, sans-serif";
        errorMessage.style.fontSize = "14px";
        errorMessage.style.textAlign = "center";
        errorMessage.textContent = "全屏請求失敗，請嘗試手動按F11或使用瀏覽器的全屏功能";
        
        document.body.appendChild(errorMessage);
        
        // 5秒後移除錯誤提示
        setTimeout(() => {
            if (document.getElementById("fullscreen_error_message")) {
                document.getElementById("fullscreen_error_message").remove();
            }
        }, 5000);
        
        // 即使全屏失敗，仍然嘗試以固定定位方式顯示視頻
        adjustVideoPosition();
    });
    
    // 啟用鍵盤控制
    enableKeyboardControls();
    
    // 安全機制：如果15秒內沒有退出全屏事件，自動恢復原始狀態
    // 這可以防止在某些瀏覽器中全屏事件無法正確觸發的情況
    window._fullscreenTimeout = setTimeout(function() {
        if (video_fullscreen) {
            // 如果仍在全屏模式，強制退出
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.error("退出全屏失敗:", err);
                });
            }
            
            // 手動恢復元素狀態
            restoreVideoState();
        }
    }, 15000);
}

// 創建全屏控制界面
function createFullscreenControls() {
    // 檢查是否已經存在控制界面
    if (document.getElementById("fullscreen_controls")) {
        return;
    }
    
    // 創建控制界面容器
    var controls = document.createElement("div");
    controls.id = "fullscreen_controls";
    controls.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px;
        z-index: 999999;
        color: white;
        font-family: Arial, sans-serif;
        transition: opacity 0.3s;
        opacity: 0;
    `;
    
    // 創建控制界面內容
    // 使用DOM方法替代innerHTML
    // 創建時間信息區域
    const timeInfoDiv = document.createElement("div");
    timeInfoDiv.id = "controls_time_info";
    timeInfoDiv.style.marginRight = "15px";
    timeInfoDiv.textContent = "00:00 / 00:00";
    
    // 創建播放/暫停按鈕
    const playPauseDiv = document.createElement("div");
    playPauseDiv.id = "controls_playpause";
    playPauseDiv.style.cursor = "pointer";
    playPauseDiv.style.margin = "0 10px";
    playPauseDiv.textContent = "⏸️";
    
    // 創建音量降低按鈕
    const volumeDownDiv = document.createElement("div");
    volumeDownDiv.id = "controls_volume_down";
    volumeDownDiv.style.cursor = "pointer";
    volumeDownDiv.style.margin = "0 5px";
    volumeDownDiv.textContent = "🔉";
    
    // 創建音量增加按鈕
    const volumeUpDiv = document.createElement("div");
    volumeUpDiv.id = "controls_volume_up";
    volumeUpDiv.style.cursor = "pointer";
    volumeUpDiv.style.margin = "0 5px";
    volumeUpDiv.textContent = "🔊";
    
    // 創建後退按鈕
    const backwardDiv = document.createElement("div");
    backwardDiv.id = "controls_backward";
    backwardDiv.style.cursor = "pointer";
    backwardDiv.style.margin = "0 5px";
    backwardDiv.textContent = "⏪";
    
    // 創建前進按鈕
    const forwardDiv = document.createElement("div");
    forwardDiv.id = "controls_forward";
    forwardDiv.style.cursor = "pointer";
    forwardDiv.style.margin = "0 5px";
    forwardDiv.textContent = "⏩";
    
    // 創建包裝容器
    const flexContainer = document.createElement("div");
    flexContainer.style.display = "flex";
    flexContainer.style.justifyContent = "center";
    flexContainer.style.alignItems = "center";
    flexContainer.style.padding = "5px";
    
    // 添加所有控制元素
    flexContainer.appendChild(timeInfoDiv);
    flexContainer.appendChild(playPauseDiv);
    flexContainer.appendChild(volumeDownDiv);
    flexContainer.appendChild(volumeUpDiv);
    flexContainer.appendChild(backwardDiv);
    flexContainer.appendChild(forwardDiv);
    
    // 將容器添加到控制界面
    controls.appendChild(flexContainer);
    
    // 添加進度條容器
    const progressContainer = document.createElement("div");
    progressContainer.style.marginTop = "5px";
    progressContainer.style.position = "relative";
    progressContainer.style.height = "5px";
    progressContainer.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
    
    // 添加進度條
    const progressBar = document.createElement("div");
    progressBar.id = "controls_progress";
    progressBar.style.position = "absolute";
    progressBar.style.height = "100%";
    progressBar.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    progressBar.style.width = "0%";
    
    progressContainer.appendChild(progressBar);
    controls.appendChild(progressContainer);
    
    // 添加鍵盤提示
    const keyboardHints = document.createElement("div");
    keyboardHints.style.textAlign = "center";
    keyboardHints.style.marginTop = "8px";
    keyboardHints.style.fontSize = "12px";
    keyboardHints.textContent = "按鍵控制：空格=播放/暫停，←→=快退/快進，↑↓=音量+/-，Esc=退出全屏";
    
    controls.appendChild(keyboardHints);
    
    // 添加到頁面
    document.body.appendChild(controls);
    
    // 添加控制事件
    document.getElementById("controls_playpause").addEventListener("click", function() {
        togglePlayPause();
    });
    
    document.getElementById("controls_volume_down").addEventListener("click", function() {
        adjustVolume(-0.1);
    });
    
    document.getElementById("controls_volume_up").addEventListener("click", function() {
        adjustVolume(0.1);
    });
    
    document.getElementById("controls_backward").addEventListener("click", function() {
        skipTime(-10);
    });
    
    document.getElementById("controls_forward").addEventListener("click", function() {
        skipTime(10);
    });
    
    // 自動隱藏/顯示控制界面
    var timeout;
    document.addEventListener("mousemove", function() {
        var controls = document.getElementById("fullscreen_controls");
        if (controls && video_fullscreen) {
            controls.style.opacity = "1";
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                controls.style.opacity = "0";
            }, 3000);
        }
    });
    
    // 初始更新控制欄
    updateControlsUI();
    
    // 定期更新控制欄
    setInterval(function() {
        if (video_fullscreen && the_video_element) {
            updateControlsUI();
        }
    }, 1000);
}

// 更新控制界面UI
function updateControlsUI() {
    if (!the_video_element || !video_fullscreen) return;
    
    var timeInfo = document.getElementById("controls_time_info");
    var progress = document.getElementById("controls_progress");
    var playPauseBtn = document.getElementById("controls_playpause");
    
    if (timeInfo && progress && playPauseBtn) {
        // 更新時間信息
        var currentTime = formatTime(the_video_element.currentTime);
        var duration = formatTime(the_video_element.duration);
        timeInfo.textContent = currentTime + " / " + duration;
        
        // 更新進度條
        var progressPercent = (the_video_element.currentTime / the_video_element.duration) * 100;
        progress.style.width = progressPercent + "%";
        
        // 更新播放/暫停按鈕
        playPauseBtn.textContent = the_video_element.paused ? "▶️" : "⏸️";
    }
}

// 格式化時間（秒 -> MM:SS）
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    
    seconds = Math.floor(seconds);
    var minutes = Math.floor(seconds / 60);
    var remainingSeconds = seconds % 60;
    
    return (minutes < 10 ? "0" : "") + minutes + ":" + 
           (remainingSeconds < 10 ? "0" : "") + remainingSeconds;
}

// 播放/暫停切換
function togglePlayPause() {
    if (!the_video_element) return;
    
    if (the_video_element.paused) {
        the_video_element.play();
    } else {
        the_video_element.pause();
    }
    
    updateControlsUI();
}

// 調整音量
function adjustVolume(delta) {
    if (!the_video_element) return;
    
    var newVolume = Math.max(0, Math.min(1, the_video_element.volume + delta));
    the_video_element.volume = newVolume;
}

// 快進/快退
function skipTime(seconds) {
    if (!the_video_element) return;
    
    the_video_element.currentTime = Math.max(0, 
        Math.min(the_video_element.duration, the_video_element.currentTime + seconds));
    
    updateControlsUI();
}

// 啟用鍵盤控制
function enableKeyboardControls() {
    // 創建並存儲原始的鍵盤事件處理器
    if (!window._originalKeydownHandler) {
        window._originalKeydownHandler = document.onkeydown;
    }
    
    // 設置新的鍵盤事件處理器
    document.onkeydown = function(e) {
        if (video_fullscreen && the_video_element) {
            // 根據按鍵執行相應的操作
            switch (e.key) {
                case " ": // 空格鍵
                    togglePlayPause();
                    e.preventDefault();
                    break;
                case "ArrowLeft": // 左箭頭
                    skipTime(-5);
                    e.preventDefault();
                    break;
                case "ArrowRight": // 右箭頭
                    skipTime(5);
                    e.preventDefault();
                    break;
                case "ArrowUp": // 上箭頭
                    adjustVolume(0.05);
                    e.preventDefault();
                    break;
                case "ArrowDown": // 下箭頭
                    adjustVolume(-0.05);
                    e.preventDefault();
                    break;
                case "Escape": // ESC鍵
                    if (document.fullscreenElement) {
                        document.exitFullscreen().catch(err => {
                            console.error("退出全屏失敗:", err);
                        });
                    }
                    e.preventDefault();
                    break;
            }
        } else if (window._originalKeydownHandler) {
            // 如果不在全屏模式，使用原始的事件處理器
            return window._originalKeydownHandler.call(document, e);
        }
    };
}

// 恢復原始鍵盤控制
function disableKeyboardControls() {
    // 恢復原始的鍵盤事件處理器
    if (window._originalKeydownHandler) {
        document.onkeydown = window._originalKeydownHandler;
    } else {
        document.onkeydown = null;
    }
}

// 新增函數用於恢復視頻元素狀態
function restoreVideoState() {
    // 先移除黑色背景，避免黑屏
    var blackBackground = document.getElementById("fullscreen_video_black_background");
    if (blackBackground) {
        blackBackground.remove();
    }
    
    // 移除控制界面
    var controls = document.getElementById("fullscreen_controls");
    if (controls) {
        controls.remove();
    }
    
    // 重置錯誤提示（如果存在）
    var errorMessage = document.getElementById("fullscreen_error_message");
    if (errorMessage) {
        errorMessage.remove();
    }
    
    // 禁用鍵盤控制
    disableKeyboardControls();
    
    // 恢復視頻元素
    if (the_video_element) {
        // 如果有保存原始樣式信息，則使用它來恢復
        if (the_video_element._originalStyles) {
            // 如果有原始父元素，將視頻元素移回原位
            if (the_video_element._originalParent && the_video_element.parentNode !== the_video_element._originalParent) {
                the_video_element._originalParent.appendChild(the_video_element);
            }
            
            // 先確保視頻元素可見
            the_video_element.style.display = the_video_element._originalStyles.display || "block";
            the_video_element.style.visibility = "visible";
            the_video_element.style.opacity = "1";
            
            // 然後恢復原始樣式
            the_video_element.style.position = the_video_element._originalStyles.position;
            the_video_element.style.top = the_video_element._originalStyles.top;
            the_video_element.style.left = the_video_element._originalStyles.left;
            the_video_element.style.width = the_video_element._originalStyles.width;
            the_video_element.style.height = the_video_element._originalStyles.height;
            the_video_element.style.zIndex = the_video_element._originalStyles.zIndex;
            
            // 清除保存的原始信息
            delete the_video_element._originalStyles;
            delete the_video_element._originalParent;
        } else {
            // 使用空字符串重置樣式（如果沒有保存原始樣式）
            the_video_element.style.position = "";
            the_video_element.style.top = "";
            the_video_element.style.left = "";
            the_video_element.style.width = "";
            the_video_element.style.height = "";
            the_video_element.style.zIndex = "";
            the_video_element.style.display = "block";
        }
    }
    
    // 重置其他樣式
    document.documentElement.style.overflow = "";
    document.getElementById("subtitle_element").style.zIndex = "";
    
    video_fullscreen = false;
    
    // 清除可能存在的超時
    if (window._fullscreenTimeout) {
        clearTimeout(window._fullscreenTimeout);
        window._fullscreenTimeout = null;
    }
}

// 輔助函數，當全屏失敗時調整視頻位置
function adjustVideoPosition() {
    if (the_video_element == null) return;
    
    // 確保即使在全屏失敗的情況下，視頻也能以固定定位方式顯示
    the_video_element.style.position = "fixed";
    the_video_element.style.top = "0px";
    the_video_element.style.left = "0px";
    the_video_element.style.width = "100%";
    the_video_element.style.height = "100%";
    the_video_element.style.zIndex = "99998";
    the_video_element.style.display = "block";
    the_video_element.style.visibility = "visible";
    the_video_element.style.opacity = "1";
}

update_video_elements_list();
shadow_root.getElementById("refresh_video_list").addEventListener("click", function(){
    update_video_elements_list();
});

// 改善：現代化的上傳處理，包含錯誤處理、重試機制和進度顯示
shadow_root.getElementById("subtitle_upload_button").addEventListener("click", async function(){
    const subtitle_file_input = shadow_root.getElementById("subtitle_file_input");
    const subtitle_url_input = shadow_root.getElementById("subtitle_url_input");
    const error_message_element = shadow_root.getElementById("upload_error_message");
    const retry_button = shadow_root.getElementById("retry_button");
    const progress_container = shadow_root.getElementById("upload_progress_container");
    
    // 重置錯誤訊息和重試按鈕
    error_message_element.textContent = "";
    retry_button.style.display = "none";
    
    // 建立進度指示器
    const progressIndicator = new ProgressIndicator(progress_container);
    
    try {
        if(subtitle_url_input.value.length > 0){
            await handleUrlUpload(subtitle_url_input.value, progressIndicator);
        } else {
            await handleFileUpload(subtitle_file_input.files[0], progressIndicator);
        }
        
        // 成功後清理
        progressIndicator.hide();
        subtitle_file_input.value = "";
        subtitle_url_input.value = "";
        
    } catch (error) {
        progressIndicator.hide();
        handleUploadError(error, error_message_element, retry_button);
    }
});

// 新增：處理URL上傳
async function handleUrlUpload(url, progressIndicator) {
    try {
        progressIndicator.show('從 URL 載入字幕...');
        progressIndicator.updateProgress(10, '正在下載...');
        
        const response = await NetworkRetry.fetchWithRetry(url);
        const blob = await response.blob();
        
        progressIndicator.updateProgress(50, '解析檔案類型...');
        
        if(blob.type === "application/zip" || url.toLowerCase().endsWith('.zip')){
            await handleZipFile(blob, progressIndicator);
        } else {
            progressIndicator.updateProgress(70, '讀取字幕內容...');
            const text = await blob.text();
            
            progressIndicator.updateProgress(90, '解析字幕...');
            await parse_subtitles(text);
        }
        
        progressIndicator.updateProgress(100, '載入完成！');
        
    } catch (error) {
        throw new SubtitleError(
            `URL 載入失敗: ${error.message}`,
            'URL_LOAD_ERROR',
            { url, originalError: error }
        );
    }
}

// 新增：處理檔案上傳
async function handleFileUpload(file, progressIndicator) {
    try {
        // 驗證檔案
        const fileInfo = FileValidator.validateFile(file);
        
        progressIndicator.show(`載入 ${file.name}...`);
        progressIndicator.updateProgress(20, '驗證檔案...');
        
        // 處理大檔案
        if (fileInfo.isLarge) {
            progressIndicator.updateProgress(30, '處理大檔案，請稍候...');
            isLargeFile = true;
        }
        
        progressIndicator.updateProgress(50, '讀取檔案內容...');
        
        const text = await readFileAsText(file, (percent) => {
            progressIndicator.updateProgress(50 + percent * 0.3, '讀取中...');
        });
        
        progressIndicator.updateProgress(80, '解析字幕...');
        await parse_subtitles(text, fileInfo.format);
        
        progressIndicator.updateProgress(100, '載入完成！');
        
    } catch (error) {
        throw error; // 重新拋出，讓上級處理
    }
}

// 新增：處理ZIP檔案
async function handleZipFile(blob, progressIndicator) {
    try {
        progressIndicator.updateProgress(30, '解壓縮檔案...');
        
        const buffer = await blob.arrayBuffer();
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(buffer);
        
        progressIndicator.updateProgress(50, '搜尋字幕檔案...');
        
        const files = Object.entries(zipContent.files);
        let subtitle_file = null;
        
        // 支援更多格式
        const supportedExts = ['srt', 'vtt', 'ass', 'ssa'];
        
        for(const [filename, file] of files){
            if(file.dir) continue; // 跳過資料夾
            
            const extension = filename.split(".").pop().toLowerCase();
            if(supportedExts.includes(extension)){
                subtitle_file = file;
                break;
            }
        }
        
        if(!subtitle_file){
            throw new SubtitleError(
                `ZIP 檔案中未找到支援的字幕格式 (${supportedExts.join(', ')})`,
                'NO_SUBTITLE_IN_ZIP'
            );
        }
        
        progressIndicator.updateProgress(70, `解壓縮 ${subtitle_file.name}...`);
        const text = await subtitle_file.async("string");
        
        progressIndicator.updateProgress(90, '解析字幕...');
        await parse_subtitles(text);
        
    } catch (error) {
        throw new SubtitleError(
            `ZIP 檔案處理失敗: ${error.message}`,
            'ZIP_PROCESSING_ERROR',
            { originalError: error }
        );
    }
}

// 新增：改善的檔案讀取功能
function readFileAsText(file, progressCallback) {
    return new Promise((resolve, reject) => {
        const file_reader = new FileReader();
        
        file_reader.onload = function(event){
            resolve(event.target.result);
        };
        
        file_reader.onerror = function(event){
            reject(new SubtitleError(
                `檔案讀取失敗: ${event.target.error}`,
                'FILE_READ_ERROR'
            ));
        };
        
        // 進度追蹤（對大檔案有效）
        file_reader.onprogress = function(event) {
            if (event.lengthComputable && progressCallback) {
                const percent = (event.loaded / event.total) * 100;
                progressCallback(percent);
            }
        };
        
        file_reader.readAsText(file);
    });
}

// 新增：錯誤處理函數
function handleUploadError(error, errorElement, retryButton) {
    console.error('字幕上傳錯誤:', error);
    
    let errorMessage = '未知錯誤';
    let showRetry = false;
    
    if (error instanceof SubtitleError) {
        errorMessage = error.message;
        
        // 某些錯誤類型可以重試
        if (['NETWORK_ERROR', 'ZIP_PROCESSING_ERROR', 'FILE_READ_ERROR'].includes(error.type)) {
            showRetry = true;
        }
    } else {
        errorMessage = `載入失敗: ${error.message}`;
        showRetry = true;
    }
    
    errorElement.textContent = errorMessage;
    errorElement.style.color = "red";
    
    if (showRetry) {
        retryButton.style.display = "inline-block";
    }
}

// 新增：重試按鈕事件處理
shadow_root.getElementById("retry_button").addEventListener("click", function(){
    // 觸發上傳按鈕的點擊事件
    shadow_root.getElementById("subtitle_upload_button").click();
});

shadow_root.getElementById("subtitle_offset_input").addEventListener("input", function(){
    subtitle_offset = parseFloat(shadow_root.getElementById("subtitle_offset_input").value);
});

shadow_root.getElementById("subtitle_offset_top_input").addEventListener("input", function(){
    subtitle_offset_top = parseFloat(shadow_root.getElementById("subtitle_offset_top_input").value);
});

shadow_root.getElementById("subtitle_font_size").addEventListener("input", function(){
    subtitle_font_size = this.value;
});

shadow_root.getElementById("subtitle_font_color").addEventListener("input", function(){
    subtitle_font_color = this.value;
});

shadow_root.getElementById("subtitle_background_color").addEventListener("input", function(){
    subtitle_background_color = this.value;
});

shadow_root.getElementById("subtitle_font").addEventListener("input", function(){
    subtitle_font = this.value;
});

shadow_root.getElementById("make_video_fullscreen").addEventListener("click", function(){
    switch_fullscreen_video();
});

shadow_root.getElementById("close_button").addEventListener("click", function(){
    menu.style.display = "none";
});

// 添加轉換器狀態更新功能
function updateConverterStatus() {
    const statusElement = shadow_root.getElementById("converter_status");
    if (!statusElement) return;
    
    const status = chineseConverter.getStatus();
    
    if (status.openccLoaded && status.hasConverter) {
        statusElement.textContent = "OpenCC 已載入";
        statusElement.style.color = "green";
    } else if (status.initialized) {
        statusElement.textContent = "載入失敗 (保持原文)";
        statusElement.style.color = "red";
    } else {
        statusElement.textContent = "載入中...";
        statusElement.style.color = "orange";
    }
}

// 手動重新載入轉換器
shadow_root.getElementById("reload_converter").addEventListener("click", function(){
    const statusElement = shadow_root.getElementById("converter_status");
    statusElement.textContent = "重新載入中...";
    statusElement.style.color = "orange";
    
    // 創建新的轉換器實例
    window.chineseConverter = new ChineseConverter();
    
    // 等待一秒後更新狀態
    setTimeout(updateConverterStatus, 1000);
});

// 定期更新轉換器狀態
setInterval(updateConverterStatus, 2000);

// 初始更新
setTimeout(updateConverterStatus, 500);

// 添加全屏退出事件監聽器
document.addEventListener("fullscreenchange", function() {
    if (!document.fullscreenElement && video_fullscreen) {
        // 清除可能存在的超時
        if (window._fullscreenTimeout) {
            clearTimeout(window._fullscreenTimeout);
            window._fullscreenTimeout = null;
        }
        
        // 使用恢復函數處理退出全屏
        restoreVideoState();
    }
});

})();