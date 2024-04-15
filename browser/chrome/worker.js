chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension", { request });

    chrome.notifications.getPermissionLevel(function (level) {
      console.log('permission level:', level);
    })

    if (request.type === "restart") {
      console.log('creating notification');
      try {
      chrome.notifications.create(
        `name-for-notification-${request.name}-${Date.now()}`,
        {
          type: "basic",
          iconUrl: "hello_extensions.png",
          title: "Server Restart",
          message: `${request.name} has restarted!`,
        },
        () => { console.log(chrome.runtime.lastError); }
      );
      } catch(e) {
        console.error(e);
      }
    }
    sendResponse({});
  }
);
