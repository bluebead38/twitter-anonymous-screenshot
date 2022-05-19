chrome.runtime.connect({ name: "popup" });

let g_tabId = '';

// 트위터에서만 프로필 숨기기 허용
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  if (tabs[0].url.indexOf("twitter.com") > -1) {
    profile_options = document.querySelectorAll("[name$='_option']");
    for (let i = 0; i < profile_options.length; i++) {
      profile_options[i].disabled = false;
    }
    document.querySelector("#crop_checkbox").disabled = false;
    document.querySelector("#my_checkbox").disabled = false;
  }

  g_tabId = tabs[0].id;

  setHideProfile();
  setHideMedia();
  chrome.tabs.sendMessage(g_tabId, { type: "hideMy", b_show: true });
});

/* 숨기기 처리 */
function setHideBlur(sel, px) {
  let profile = document.querySelectorAll(sel);
  for (let i = 0; i < profile.length; i++) {
    profile[i].style.filter = "blur(" + px + "px)";
  }
}

function setHideColor(sel, color, b_tp, b_av) {
  function getAverageRGB(imgEl) {
    var blockSize = 5, // only visit every 5 pixels
        defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
        canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d'),
        data, width, height,
        i = -4,
        length,
        rgb = {r:0,g:0,b:0},
        count = 0;
        
    if (!context) {
        return defaultRGB;
    }
    
    height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
    width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
    
    context.drawImage(imgEl, 0, 0);

    try {
        data = context.getImageData(0, 0, width, height);
    } catch(e) {
        return defaultRGB;
    }
    
    length = data.data.length;
    
    while ( (i += blockSize * 4) < length ) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
    }
    
    // ~~ used to floor values
    rgb.r = ~~(rgb.r/count);
    rgb.g = ~~(rgb.g/count);
    rgb.b = ~~(rgb.b/count);
    
    return rgb;
  }
  
  let profile = document.querySelectorAll(sel);
  for (let i = 0; i < profile.length; i++) {
    let imgs = profile[i].querySelectorAll("img, svg");
    let b_pImg = false; // 프로필 사진 여부
    if (imgs.length != 0) {
      if (imgs[0].previousSibling != null && imgs[0].previousSibling.classList.contains("r-4gszlv")) {
        b_pImg = true;
        let p_color = color;
        imgs[0].crossOrigin = "Anonymous";
        if (b_av) {
          let avColor = getAverageRGB(imgs[0]);
          p_color = "rgb(" + avColor.r + "," + avColor.g + "," + avColor.b + ")";
        }
        if (!b_tp) {
          imgs[0].previousSibling.style.background = p_color;
        } else {
          if (b_av) {
            imgs[0].previousSibling.style.background = p_color;
          } else {
            imgs[0].previousSibling.style.removeProperty("background");
          }
        }
      } else {
        for (let j = 0; j < imgs.length; j++) {
          imgs[j].style.opacity = 0;
          if (!b_tp) {
            imgs[j].parentElement.style.background = color;
          } else {
            imgs[j].parentElement.style.removeProperty("background");
          }
        }
      }
    }
    let text = profile[i].querySelector(".css-bfa6kz");
    if (text != null) {
      if (!b_tp) {
        text.style.background = color;
      } else {
        text.style.removeProperty("background");
      }
      let spans = text.querySelectorAll("span, img");
      for (let i = 0; i < spans.length; i++) {
        if (spans[i] != null) spans[i].style.opacity = 0;
      }
    } else if (!b_pImg) {
      profile[i].style.opacity = 0;
      if (!b_tp) {
        profile[i].parentElement.style.background = color;
      } else {
        profile[i].parentElement.style.removeProperty("background");
      }
    }
  }
}

const g_profile_selector =
  "article div.r-dnmrzs" + "," +					                                    // 프로필 전체
  "article span.r-14j79pv[data-testid='socialContext'] > span > span" + "," +	// 리트윗, 마음 문구
  "article span.r-14j79pv > span > img" + "," +	                              // 리트윗, 마음 이모지
  "article .r-xoduu5 a span" + "," +                                          // 타래 멘션(@)
  "article .r-xoduu5 a[dir='ltr']";                                           // 멘션(@)
function setHideProfile(op, b_mod) {
  let func = null;
  let args = [g_profile_selector];

  let blur_range = document.querySelector("#profile_blur_range");
  let blur_px = document.querySelector("#profile_blur_px");

  let color_picker = document.querySelector("#profile_color_picker");
  let color_tp_chk = document.querySelector("#profile_color_tp_checkbox");
  let color_av_chk = document.querySelector("#profile_color_av_checkbox");

  if (!b_mod) { // 수정만 할 땐 초기화 안하기
    chrome.tabs.sendMessage(g_tabId, { type: "hideReset", profile: g_profile_selector });

    blur_range.disabled = true;
    blur_px.style.removeProperty("font-weight");
    color_picker.disabled = true;
    color_tp_chk.disabled = true;
    color_av_chk.disabled = true;
  }

  if (op === "blur") {
    
    blur_range.disabled = false;
    blur_px.style.fontWeight = "bold";

    func = setHideBlur;
    let px = blur_range.value;
    args.push(px);

  } else if (op === "color") {

    color_picker.disabled = false;
    color_tp_chk.disabled = false;
    color_av_chk.disabled = false;
    func = setHideColor;
    args.push(color_picker.value);
    args.push(color_tp_chk.checked);
    args.push(color_av_chk.checked);

  } else {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: g_tabId },
    function: func,
    args: args
  });
}

const g_media_selector = 
  "article [data-testid='tweetPhoto']" + ","
+ "article [data-testid='videoPlayer']" + ","
+ "article [data-testid='previewInterstitial']" + ","
+ "article [data-testid='card.layoutSmall.media']" + ","
+ "article [data-testid='card.layoutLarge.media']";
function setHideMedia(op, b_mod) {
  let func = null;
  let args = [g_media_selector];

  let blur_range = document.querySelector("#media_blur_range");
  let blur_px = document.querySelector("#media_blur_px");

  let color_picker = document.querySelector("#media_color_picker");
  let color_tp_chk = document.querySelector("#media_color_tp_checkbox");
  let color_av_chk = document.querySelector("#media_color_av_checkbox");

  if (!b_mod) { // 수정만 할 땐 초기화 안하기
    chrome.tabs.sendMessage(g_tabId, { type: "hideReset", media: g_media_selector });

    blur_range.disabled = true;
    blur_px.style.removeProperty("font-weight");
    color_picker.disabled = true;
    color_tp_chk.disabled = true;
    color_av_chk.disabled = true;
  }

  if (op === "blur") {
    
    blur_range.disabled = false;
    blur_px.style.fontWeight = "bold";

    func = setHideBlur;
    let px = blur_range.value;
    args.push(px);

  } else if (op === "color") {

    color_picker.disabled = false;
    color_tp_chk.disabled = false;
    color_av_chk.disabled = false;
    func = setHideColor;
    args.push(color_picker.value);
    args.push(color_tp_chk.checked);
    args.push(color_av_chk.checked);

  } else {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: g_tabId },
    function: func,
    args: args
  });
}
/* 숨기기 처리 END */

/* UI 이벤트 */
let profile_options = document.querySelectorAll("[name='profile_option']");
for (let i = 0; i < profile_options.length; i++) {
  profile_options[i].addEventListener("click", function () {
    let op = profile_options[i].id.split("_")[1];
    setHideProfile(op);

    if (this.id.indexOf("none") < 0 && this.checked) {
      chrome.tabs.sendMessage(g_tabId, { type: "scrollMsg" });
    } else {
      chrome.tabs.sendMessage(g_tabId, { type: "scrollMsgReset" });
    }
  });
}

document.querySelector("#profile_blur_range").addEventListener("input", function () {
  document.querySelector("#profile_blur_px").innerText = this.value;
  setHideProfile("blur", true);
});

document.querySelector("#profile_color_picker").addEventListener("input", function () {
  setHideProfile("color", true);
});

document.querySelector("#profile_color_tp_checkbox").addEventListener("change", function () {
  setHideProfile("color", true);
  document.querySelector("#profile_color_picker").disabled = this.checked;
});

document.querySelector("#profile_color_av_checkbox").addEventListener("change", function () {
  setHideProfile("color", true);
});
// 프로필 숨기기 END

let media_options = document.querySelectorAll("[name='media_option']");
for (let i = 0; i < profile_options.length; i++) {
  media_options[i].addEventListener("click", function () {
    let op = profile_options[i].id.split("_")[1];
    setHideMedia(op);

    if (this.id.indexOf("none") < 0 && this.checked) {
      chrome.tabs.sendMessage(g_tabId, { type: "scrollMsg" });
    } else {
      chrome.tabs.sendMessage(g_tabId, { type: "scrollMsgReset" });
    }
  });
}

document.querySelector("#media_blur_range").addEventListener("input", function () {
  document.querySelector("#media_blur_px").innerText = this.value;
  setHideMedia("blur", true);
});

document.querySelector("#media_color_picker").addEventListener("input", function() {
  setHideMedia("color", true);
});

document.querySelector("#media_color_tp_checkbox").addEventListener("change", function () {
  setHideMedia("color", true);
  document.querySelector("#media_color_picker").disabled = this.checked;
  document.querySelector("#media_color_av_checkbox").disabled = this.checked;
});

document.querySelector("#media_color_av_checkbox").addEventListener("change", function () {
  setHideMedia("color", true);
  document.querySelector("#media_color_picker").disabled = this.checked;
  document.querySelector("#media_color_tp_checkbox").disabled = this.checked;
});
// 미디어 숨기기 END

document.querySelector("#my_checkbox").addEventListener("change", function () {
  chrome.tabs.sendMessage(g_tabId, { type: "hideMy", b_show: !this.checked });
});

/* 캡쳐 처리 */
document.querySelector("#capture_button").addEventListener("click", function () {
  let crop_checkbox = document.querySelector("#crop_checkbox");
  if (!crop_checkbox.disabled && crop_checkbox.checked) {
    chrome.runtime.sendMessage({ type: "toastMsg", msg: "시작, 마지막 트윗을 순서대로 클릭하세요.\n(화면에 보이지 않는 영역은 제대로 캡쳐되지 않습니다.)\n* 전체화면 - [F11]\n* 취소 - [마우스 오른쪽 클릭]" });
    chrome.tabs.sendMessage(g_tabId, { type: "drawArea" });
  } else {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (imageUri) {
      chrome.runtime.sendMessage({ type: "newTab", url: imageUri }, function () {
        chrome.tabs.sendMessage(g_tabId, { type: "hideReset", profile: g_profile_selector, media: g_media_selector });
        chrome.tabs.sendMessage(g_tabId, { type: "hideMy", b_show: true });
      });
    });
  }
});
/* UI 이벤트 END */