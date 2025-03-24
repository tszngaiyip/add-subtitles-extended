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

// 簡繁轉換表 (基本常用字符)
const simplifiedToTraditional = {
  // 基本常用字符轉換表
  '简': '簡', '体': '體', '繁': '繁', '中': '中', '文': '文',
  '国': '國', '长': '長', '东': '東', '西': '西', '南': '南', 
  '北': '北', '开': '開', '关': '關', '后': '後', '前': '前',
  '见': '見', '书': '書', '车': '車', '马': '馬', '鸟': '鳥',
  '鱼': '魚', '龙': '龍', '门': '門', '间': '間', '问': '問',
  '闻': '聞', '语': '語', '说': '說', '话': '話', '种': '種',
  '难': '難', '风': '風', '云': '雲', '飞': '飛', '强': '強',
  '头': '頭', '脚': '腳', '真': '真', '实': '實', '无': '無',
  '电': '電', '灯': '燈', '时': '時', '实': '實', '义': '義',
  '发': '發', '点': '點', '网': '網', '计': '計', '算': '算',
  '机': '機', '软': '軟', '硬': '硬', '件': '件', '胜': '勝',
  '乐': '樂', '军': '軍', '转': '轉', '报': '報', '动': '動',
  '传': '傳', '图': '圖', '运': '運', '这': '這', '样': '樣',
  '务': '務', '为': '為', '么': '麼', '图': '圖', '只': '只',
  '没': '沒', '还': '還', '从': '從', '对': '對', '业': '業',
  '现': '現', '带': '帶', '远': '遠', '记': '記', '办': '辦',
  '让': '讓', '认': '認', '情': '情', '请': '請', '应': '應',
  '觉': '覺', '学': '學', '识': '識', '论': '論', '产': '產',
  '处': '處', '队': '隊', '颜': '顏', '亚': '亞', '欧': '歐',
  '约': '約', '美': '美', '单': '單', '击': '擊', '双': '雙',
  '鼠': '鼠', '标': '標', '护': '護', '卫': '衛', '贝': '貝',
  '内': '內', '务': '務', '治': '治', '理': '理', '区': '區',
  '局': '局', '系': '系', '统': '統', '线': '線', '级': '級',
  '丽': '麗', '华': '華', '划': '劃', '画': '畫', '质': '質',
  '检': '檢', '验': '驗', '页': '頁', '码': '碼', '项': '項',
  '盘': '盤', '创': '創', '建': '建', '写': '寫', '号': '號',
  '密': '密', '码': '碼', '录': '錄', '像': '像', '功': '功',
  '能': '能', '规': '規', '范': '範', '当': '當', '世': '世',
  '台': '臺', '湾': '灣', '宝': '寶', '岛': '島', '鲁': '魯',
  '训': '訓', '练': '練', '赛': '賽', '边': '邊', '缘': '緣',
  '缓': '緩', '归': '歸', '继': '繼', '续': '續', '载': '載',
  '构': '構', '干': '幹', '于': '於', '气': '氣', '温': '溫',
  '灵': '靈', '儿': '兒', '药': '藥', '历': '歷', '极': '極',
  '广': '廣', '连': '連', '满': '滿', '烟': '煙', '铁': '鐵',
  '补': '補', '术': '術', '乡': '鄉', '邮': '郵', '丑': '醜',
  '专': '專', '业': '業', '丰': '豐', '串': '串', '临': '臨',
  '举': '舉', '么': '麼', '义': '義', '乌': '烏', '乐': '樂',
  '书': '書', '习': '習', '乱': '亂', '云': '雲', '亘': '亙',
  '亚': '亞', '人': '人', '什': '什', '仅': '僅', '介': '介',
  '从': '從', '仑': '崙', '仓': '倉', '价': '價', '众': '眾',
  '优': '優', '伙': '夥', '会': '會', '伟': '偉', '层': '層',
  '励': '勵', '协': '協', '单': '單', '卖': '賣', '占': '佔',
  '卫': '衛', '压': '壓', '厅': '廳', '厕': '廁', '厘': '厘',
  '又': '又', '发': '髮', '发': '發', '变': '變', '叠': '疊',
  '口': '口', '号': '號', '吓': '嚇', '吗': '嗎', '听': '聽',
  '启': '啟', '团': '團', '团': '糰', '国': '國', '图': '圖',
  '地': '地', '场': '場', '块': '塊', '坏': '壞', '壮': '壯',
  '声': '聲', '处': '處', '备': '備', '复': '複', '复': '復',
  '够': '夠', '头': '頭', '夹': '夾', '奥': '奧', '奖': '獎',
  '妆': '妝', '妇': '婦', '姐': '姐', '姜': '薑', '姿': '姿',
  '娱': '娛', '娲': '媧', '婶': '嬸', '嫔': '嬪', '孙': '孫',
  '学': '學', '宁': '寧', '宝': '寶', '实': '實', '审': '審',
  '宴': '宴', '宽': '寬', '对': '對', '导': '導', '专': '專',
  '将': '將', '尔': '爾', '尘': '塵', '尝': '嚐', '尝': '嘗',
  '尧': '堯', '尴': '尷', '尽': '盡', '层': '層', '屉': '屜',
  '岁': '歲', '岂': '豈', '岩': '岩', '岭': '嶺', '峰': '峰',
  '崃': '崍', '崭': '嶄', '川': '川', '争': '爭', '挤': '擠',
  '挽': '挽', '捞': '撈', '据': '據', '掴': '摑', '链': '鏈',
  '别': '別', '刹': '剎', '剥': '剝', '制': '製', '坛': '壇',
  '担': '擔', '据': '據', '借': '借', '倾': '傾', '侧': '側',
  '候': '候', '拣': '揀', '拨': '撥', '择': '擇', '据': '據',
  '摆': '擺', '摇': '搖', '摄': '攝', '斋': '齋', '斗': '鬥',
  '料': '料', '断': '斷', '旧': '舊', '时': '時', '旷': '曠',
  '昂': '昂', '显': '顯', '吴': '吳', '历': '曆', '历': '歷',
  '晒': '曬', '晓': '曉', '晕': '暈', '晖': '暉', '暂': '暫',
  '术': '術', '机': '機', '杀': '殺', '权': '權', '条': '條',
  '来': '來', '杨': '楊', '板': '板', '构': '構', '构': '構',
  '枣': '棗', '栋': '棟', '栏': '欄', '树': '樹', '样': '樣',
  '桥': '橋', '机': '機', '横': '橫', '档': '檔', '欢': '歡',
  '毁': '毀', '毕': '畢', '毡': '氈', '毯': '毯', '气': '氣',
  '氛': '氛', '汇': '匯', '决': '決', '沈': '瀋', '沟': '溝',
  '没': '沒', '温': '溫', '渔': '漁', '游': '遊', '湾': '灣',
  '汤': '湯', '满': '滿', '源': '源', '准': '準', '灭': '滅',
  '灯': '燈', '炮': '炮', '点': '點', '为': '為', '无': '無',
  '烧': '燒', '烫': '燙', '热': '熱', '焖': '燜', '狮': '獅',
  '独': '獨', '猎': '獵', '猪': '豬', '献': '獻', '率': '率',
  '玛': '瑪', '现': '現', '玮': '瑋', '环': '環', '产': '產',
  '产': '產', '画': '畫', '异': '異', '疗': '療', '疯': '瘋',
  '发': '發', '皑': '皚', '皱': '皺', '盘': '盤', '盖': '蓋',
  '监': '監', '盖': '蓋', '盘': '盤', '眼': '眼', '众': '衆',
  '着': '著', '矿': '礦', '确': '確', '碍': '礙', '种': '種',
  '称': '稱', '穷': '窮', '稳': '穩', '窃': '竊', '窥': '窺',
  '竖': '豎', '纤': '纖', '约': '約', '级': '級', '纪': '紀',
  '纪': '紀', '纬': '緯', '纯': '純', '纱': '紗', '纳': '納',
  '纽': '紐', '线': '線', '练': '練', '组': '組', '细': '細',
  '织': '織', '终': '終', '绍': '紹', '经': '經', '结': '結',
  '绕': '繞', '绘': '繪', '给': '給', '络': '絡', '绝': '絕',
  '统': '統', '继': '繼', '绩': '績', '绪': '緒', '续': '續',
  '维': '維', '缔': '締', '缘': '緣', '缚': '縛', '编': '編',
  '缩': '縮', '总': '總', '缴': '繳', '罚': '罰', '罗': '羅',
  '罢': '罷', '美': '美', '耻': '恥', '习': '習', '翻': '翻',
  '考': '考', '者': '者', '耸': '聳', '联': '聯', '肤': '膚',
  '肿': '腫', '胁': '脅', '胆': '膽', '胜': '勝', '胜': '勝',
  '脉': '脈', '脏': '臟', '脑': '腦', '脱': '脫', '脸': '臉',
  '腊': '臘', '腰': '腰', '舍': '舍', '舰': '艦', '舱': '艙',
  '色': '色', '艳': '艷', '节': '節', '芦': '蘆', '花': '花',
  '苏': '蘇', '苹': '蘋', '荐': '薦', '药': '藥', '莽': '莽',
  '营': '營', '获': '獲', '虽': '雖', '虾': '蝦', '虿': '蠆',
  '蚀': '蝕', '蛮': '蠻', '蜕': '蛻', '蝇': '蠅', '蝈': '蟈',
  '血': '血', '行': '行', '补': '補', '表': '表', '被': '被',
  '袭': '襲', '裆': '襠', '裤': '褲', '见': '見', '观': '觀',
  '规': '規', '视': '視', '览': '覽', '觉': '覺', '触': '觸',
  '誉': '譽', '计': '計', '订': '訂', '讨': '討', '让': '讓',
  '议': '議', '讯': '訊', '记': '記', '讲': '講', '许': '許',
  '论': '論', '设': '設', '访': '訪', '证': '證', '评': '評',
  '识': '識', '诉': '訴', '词': '詞', '试': '試', '译': '譯',
  '话': '話', '询': '詢', '语': '語', '说': '說', '请': '請',
  '调': '調', '谁': '誰', '谈': '談', '谋': '謀', '象': '象',
  '贝': '貝', '费': '費', '贡': '貢', '买': '買', '贵': '貴',
  '贷': '貸', '贺': '賀', '赏': '賞', '赖': '賴', '赛': '賽',
  '赢': '贏', '车': '車', '轻': '輕', '轮': '輪', '较': '較',
  '输': '輸', '边': '邊', '达': '達', '迁': '遷', '还': '還',
  '进': '進', '连': '連', '迹': '跡', '迹': '蹟', '运': '運',
  '这': '這', '进': '進', '远': '遠', '适': '適', '选': '選',
  '递': '遞', '逻': '邏', '遗': '遺', '邓': '鄧', '那': '那',
  '邮': '郵', '邻': '鄰', '郁': '鬱', '酿': '釀', '释': '釋',
  '里': '裏', '里': '裡', '野': '野', '镑': '鎊', '镜': '鏡',
  '长': '長', '门': '門', '问': '問', '间': '間', '闲': '閒',
  '闹': '鬧', '闻': '聞', '阳': '陽', '阴': '陰', '阶': '階',
  '际': '際', '陆': '陸', '陈': '陳', '难': '難', '雇': '僱',
  '双': '雙', '云': '雲', '电': '電', '霉': '黴', '静': '靜',
  '面': '面', '韵': '韻', '页': '頁', '项': '項', '顺': '順',
  '须': '須', '预': '預', '领': '領', '频': '頻', '颁': '頒',
  '颂': '頌', '风': '風', '飞': '飛', '饥': '飢', '饭': '飯',
  '饮': '飲', '饰': '飾', '饱': '飽', '饼': '餅', '饿': '餓',
  '馆': '館', '首': '首', '马': '馬', '驰': '馳', '驱': '驅',
  '驶': '駛', '驻': '駐', '发': '髮', '鲁': '魯', '鲜': '鮮',
  '鸟': '鳥', '鸡': '雞', '鸣': '鳴', '鸿': '鴻', '鹊': '鵲',
  '鹰': '鷹', '黄': '黃', '黑': '黑', '默': '默', '鼠': '鼠',
  '齐': '齊', '龙': '龍', '龟': '龜'
};

// 簡體轉繁體函數
function convertSimplifiedToTraditional(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        result += simplifiedToTraditional[char] || char;
    }
    return result;
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