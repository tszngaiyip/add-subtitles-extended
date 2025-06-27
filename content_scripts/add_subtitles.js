(function(){

if(window.has_run){
    var shadow_root = document.getElementById("shadow_host").shadowRoot;
    var menu = shadow_root.getElementById("addsubtitle_menu");
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

var subtitle_element = document.createElement("div");
subtitle_element.id = "subtitle_element";
document.body.append(subtitle_element);

var video_fullscreen = false;

var shadow_host = document.createElement("div");
shadow_host.id = "shadow_host";
document.body.appendChild(shadow_host);
var shadow = shadow_host.attachShadow({mode: "open"});
var shadow_root = shadow_host.shadowRoot;

var menu = document.createElement("div");
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

var video_elements_list = document.createElement("div");
video_elements_list.id = "video_elements_list";
menu.appendChild(video_elements_list);

var make_video_fullscreen = document.createElement("div");
make_video_fullscreen.className = "line";

var make_video_fullscreen_button = document.createElement("button");
make_video_fullscreen_button.id = "make_video_fullscreen";
make_video_fullscreen_button.textContent = "Make video fullscreen";
make_video_fullscreen.appendChild(make_video_fullscreen_button);

menu.appendChild(make_video_fullscreen);

var subtitle_file_fieldset = document.createElement("fieldset");
subtitle_file_fieldset.innerHTML = `
    <legend>Subtitles file:</legend>
    <div class="line">
        Upload file: <input type="file" accept=".srt,.vtt,.ass" id="subtitle_file_input" autocomplete="off">
    </div>
    <div class="line">
        Or from URL (zip supported): <input type="text" id="subtitle_url_input" autocomplete="off">
    </div>
    <div class="line">
        <button id="subtitle_upload_button">Upload</button> <span id="upload_error_message"></span>
    </div>
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

style = document.createElement("style");
style.textContent = `
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
document.getElementsByTagName("head")[0].appendChild(style);

var the_video_element = null;

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

var subtitle_element = document.getElementById("subtitle_element");
var subtitle_offset = parseFloat(shadow_root.getElementById("subtitle_offset_input").value);
var subtitle_offset_top = parseFloat(shadow_root.getElementById("subtitle_offset_top_input").value);

var subtitles = [];

var subtitle_font = shadow_root.getElementById("subtitle_font").value;
var subtitle_font_size = shadow_root.getElementById("subtitle_font_size").value;
var subtitle_font_color = shadow_root.getElementById("subtitle_font_color").value;
var subtitle_background_color = shadow_root.getElementById("subtitle_background_color").value;

// 簡體轉繁體功能
var enableS2T = true; // 永遠啟用簡繁轉換

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

// 簡體轉繁體函數 - 純 OpenCC 方案
function convertSimplifiedToTraditional(text) {
    return chineseConverter.convert(text);
}

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
    input = convertSimplifiedToTraditional(input);
    
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
    text = convertSimplifiedToTraditional(text);
    
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

// 修改原始 parse_subtitles 函數，增加對 ASS 格式的檢測
function parse_subtitles(subs) {
    // 檢查是否為 ASS 格式
    if (subs.includes('[Script Info]') && subs.includes('[Events]')) {
        parse_ass_subtitles(subs);
        return;
    }
    
    // 原始 SRT/VTT 解析邏輯
    subtitles.length = 0;
    subs = subs.replace(/\r/g, "");
    subs = subs.split("\n\n");

    for(var i = 0; i < subs.length; i++){
        s = subs[i].split("\n");
        if(s.length <= 1) continue;
        var pos = s[0].indexOf(" --> ") > 0 ? 0 : (s[1].indexOf(" --> ") > 0 ? 1 : -1);
        if(pos <= -1) continue;
        time = s[pos].split(" --> ");
        text = [];
        for(var j = pos + 1; j < s.length; j++){
            // 簡繁轉換將在 allow_tags 中處理，這裡不需要額外處理
            text.push(s[j]);
        }
        subtitles.push({begin: time_parse(time[0]), end: time_parse(time[1]), text: text});
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

shadow_root.getElementById("subtitle_upload_button").addEventListener("click", function(){
    var subtitle_file_input = shadow_root.getElementById("subtitle_file_input");
    var subtitle_url_input = shadow_root.getElementById("subtitle_url_input");
    shadow_root.getElementById("upload_error_message").textContent = "";
    if(subtitle_url_input.value.length > 0){
        fetch(subtitle_url_input.value, {
            method: "GET"
        }).then(response => {
            if(response.status == 200){
                return response.blob();
            }
            else{
                throw new Error("Request failed");
            }
        }).then((blob) => {
            if(blob.type == "application/zip"){
                blob.arrayBuffer().then(buffer => {
                    var zip = new JSZip();
                    zip.loadAsync(buffer).then(function(zip){
                        var files = Object.entries(zip.files);
                        var subtitle_file = null;
                        for(var i = 0; i < files.length; i++){
                            var file = files[i][1];
                            var filename = file.name;
                            var extension = filename.split(".");
                            extension = extension[extension.length-1];
                            if(extension == "srt" || extension == "vtt" || extension == "ass"){
                                subtitle_file = file;
                                break;
                            }
                        }
                        zip.file(subtitle_file.name).async("string").then(text => {
                            parse_subtitles(text);
                        });
                    });
                });
            }
            else{
                blob.text().then(text => {
                    parse_subtitles(text);
                });
            }
        }).catch((error) => {
            shadow_root.getElementById("upload_error_message").textContent = error;
        });
    }
    else{
        var subtitle_file = subtitle_file_input.files[0];
        if(subtitle_file == undefined){
            shadow_root.getElementById("upload_error_message").textContent = "No file selected";
        }
        var file_reader = new FileReader();
        file_reader.onload = function(event){
            parse_subtitles(event.target.result);
        }
        file_reader.onerror = function(event){
            shadow_root.getElementById("upload_error_message").textContent = event;
        }
        file_reader.readAsText(subtitle_file);
    }
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