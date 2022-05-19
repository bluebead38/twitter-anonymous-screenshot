chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "drawArea") {
        drawArea();
    } else if (request.type === "cropArea") {
        cropArea(request.area, request.imageUri);
    } else if (request.type === "hideReset") {
        if (request.profile != null) {
            g_profile_sel = request.profile;
            setHideReset(g_profile_sel);
        }
        if (request.media != null) {
            g_media_sel = request.media;
            setHideReset(g_media_sel);
        }
    } else if (request.type === "resetElems") {
        resetElems();
    } else if (request.type === "hideMy") {
        setHideMy(request.b_show);
    } else if (request.type === "scrollMsg") {
        scrollMsg();
    } else if (request.type === "scrollMsgReset") {
        scrollMsgReset();
    }
    sendResponse();
});

let g_profile_sel = null;
let g_media_sel = null;
function setHideReset(sel) {
    let profile = document.querySelectorAll(sel);
    for (let i = 0; i < profile.length; i++) {
        profile[i].style.removeProperty("filter");

        let imgs = profile[i].querySelectorAll("img, svg");
        let b_pImg = false; // 프로필 사진 여부
        if (imgs.length != 0) {
            if (imgs[0].previousSibling != null && imgs[0].previousSibling.classList.contains("r-4gszlv")) {
                b_pImg = true;
                imgs[0].previousSibling.style.removeProperty("background");
                imgs[0].previousSibling.style.backgroundImage = "url('" + imgs[0].src + "')";
            } else {
                for (let j = 0; j < imgs.length; j++) {
                    imgs[j].style.removeProperty("opacity");
                    imgs[j].parentElement.style.removeProperty("background");
                }
            }
        }
        let text = profile[i].querySelector(".css-bfa6kz");
        if (text != null) {
            text.style.removeProperty("background");
            let spans = text.querySelectorAll("span, img");
            for (let i = 0; i < spans.length; i++) {
                if (spans[i] != null) spans[i].style.removeProperty("opacity");
            }
        } else if (!b_pImg) {
            profile[i].style.removeProperty("opacity");
            profile[i].parentElement.style.removeProperty("background");
        }
    }
}

function setHideMy(b_show) {
    const display = b_show ? "" : "none";
    // 본인 특정 정보 가리기
    const reply = document.querySelector("main .r-notknq");
    if (reply != null && reply.nextElementSibling != null) reply.nextElementSibling.style.display = display;
    const add_ano = document.querySelector("main a[href='/compose/tweet']");
    if (add_ano != null) add_ano.style.display = display;
    const acc_swit = document.querySelector("[data-testid='SideNav_AccountSwitcher_Button']");
    if (acc_swit != null) acc_swit.style.display = display;
    const compl = document.querySelector("[role='complementary'] .css-1dbjc4n:nth-child(2)");
    if (compl != null) compl.style.visibility = b_show ? "visible" : "hidden";
}

let g_bDraw = false;        // 영역 설정 시작
let g_bDrawStart = false;   // 첫 클릭 후
let g_draw_elem = null;
let g_end_elem = null;

let scrollY = 0;
function drawArea() {
    g_bDraw = true;
    g_draw_elem = document.querySelector("#draw_area");

    const BORDER = 4;
    let articles = document.querySelectorAll("article");
    for (let i = 0; i < articles.length; i++) {
        articles[i].addEventListener("mousemove", mousemove);
        articles[i].addEventListener("click", click);
    }

    let elem_area = articles[0].getBoundingClientRect();
    if (g_draw_elem == null) {
        g_draw_elem = document.createElement("div");
        g_draw_elem.id = "draw_area";
        g_draw_elem.style.position = "fixed";
        g_draw_elem.style.pointerEvents = "none";
        g_draw_elem.style.border = BORDER + "px dashed rgba(255,0,0,0.5)";
        document.body.appendChild(g_draw_elem);

        g_draw_elem.style.top = elem_area.top + "px";
        g_draw_elem.style.left = elem_area.left + "px";
        g_draw_elem.style.width = elem_area.width - BORDER + "px";
        g_draw_elem.style.height = elem_area.height - BORDER + "px";
    }

    function mousemove(e) {
        elem_area = this.getBoundingClientRect();

        if (g_bDrawStart) {
            g_draw_elem.style.width = elem_area.width - BORDER + "px";
            g_draw_elem.style.height = elem_area.top + elem_area.height - g_draw_elem.style.top.replace("px", "") - BORDER + "px"
        } else {
            g_draw_elem.style.top = elem_area.top + "px";
            g_draw_elem.style.left = elem_area.left + "px";
            g_draw_elem.style.width = elem_area.width - BORDER + "px";
            g_draw_elem.style.height = elem_area.height - BORDER + "px";
        }

    }

    function click(e) {
        e.preventDefault();
        if (g_bDrawStart) {
            drawEnd();
            g_end_elem = this;
            g_end_elem.style.pointerEvents = "none";
            setTimeout(() =>
                chrome.runtime.sendMessage({ type: "end", area: g_draw_elem.getBoundingClientRect() }, function() {
                    g_end_elem.style.removeProperty("pointer-events");
                    resetElems();
                })
            , 160);
        } else {
            g_bDrawStart = true;
            g_draw_elem.style.border = BORDER + "px dashed rgba(0,255,0,0.5)";

            let html = document.querySelector("html");
            let width = html.clientWidth;
            html.style.overflow = "hidden";
            html.style.width = width + "px";
        }
    }

    function drawEnd() {
        g_bDrawStart = false;
        g_draw_elem.style.border = "0px";
        let articles = document.querySelectorAll("article");
        for (let i = 0; i < articles.length; i++) {
            articles[i].removeEventListener("mousemove", mousemove, false);
            articles[i].removeEventListener("click", click, false);
        }
        document.querySelector("html").style.removeProperty("overflow");
        document.querySelector("html").style.removeProperty("width");
    }

    window.addEventListener("contextmenu", function(e){
        if (g_bDraw) {
            e.preventDefault();
            g_bDraw = false;
        }
    });
    window.addEventListener("mousedown", function(e) {
        if (g_bDraw && e.which == 3) {
            drawEnd();
            resetElems();
        }
    });
}
function resetElems() {
    if (g_draw_elem != null) document.body.removeChild(g_draw_elem);
    if (g_profile_sel != null) setHideReset(g_profile_sel);
    if (g_media_sel != null) setHideReset(g_media_sel);
    setHideMy(true);
}

function cropArea(area, imageUri) {
    let g_canvas = document.createElement("canvas");
    var image = new Image();
    image.onload = function () {
        g_canvas.width = area.width;
        g_canvas.height = area.height;
        var context = g_canvas.getContext("2d");
        context.drawImage(image,
            area.left, area.top,
            area.width, area.height,
            0, 0,
            area.width, area.height
        );
        var croppedDataUrl = g_canvas.toDataURL("image/png");

        chrome.runtime.sendMessage({type: "newTab", url: croppedDataUrl});
    }
    image.src = imageUri;
}

let g_scrollY = null;
function scrollCheck() {
    let offset = window.pageYOffset - g_scrollY;
    // console.log(offset);
    if (offset >= 2500) {
        chrome.runtime.sendMessage({ type: "toastMsg", msg: "일부 스크롤 범위에만 적용됩니다." });
        window.removeEventListener("scroll", scrollCheck);
    }
}
function scrollMsg() {
    g_scrollY = window.pageYOffset;
    window.addEventListener("scroll", scrollCheck);
}
function scrollMsgReset() {
    window.removeEventListener("scroll", scrollCheck);
}