chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "end") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, function (imageUri) {
            chrome.tabs.sendMessage(sender.tab.id, {type: "cropArea", area: request.area, imageUri: imageUri});
        });
    } else if (request.type === "toastMsg") {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: toastMsg,
                args: [request.msg]
            });
        });
    } else if (request.type === "newTab") {
        chrome.tabs.create({ url: request.url });
    }
    sendResponse();
});

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "popup") {
        port.onDisconnect.addListener(function() {
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: toastMsg,
                });
            });
        });
    }
});

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.url) {
            chrome.tabs.sendMessage(tabId, {type: "resetElems"});
            chrome.tabs.sendMessage(tabId, {type: "scrollMsgReset"});
        }
    }
);

function toastMsg(msg) {
    let toast_id = "toast_msg";
    let toast_elem = document.querySelector("#" + toast_id);
    if (toast_elem == null) {
        toast_elem = document.createElement("div");
        toast_elem.id = "toast_msg";
        toast_elem.style.position = "fixed";
        toast_elem.style.pointerEvents = "none";
        toast_elem.style.background = "rgba(0,0,0,0.5)";
        toast_elem.style.borderRadius = "10px";
        toast_elem.style.color = "white";
        toast_elem.style.fontWeight = "bold";
        toast_elem.style.fontSize = "16px";
        toast_elem.style.padding = "10px 10px 10px";
        toast_elem.style.top = "0px";
        toast_elem.style.display = "none";
        document.body.appendChild(toast_elem);
    }

    if (msg != undefined) {
        toast_elem.innerText = msg;
        toast_elem.style.display = "block";
        setTimeout(() => {
            toast_elem.style.display = "none";
        }, 5000);
    } else {
        document.body.removeChild(document.querySelector("#" + toast_id));
    }
}