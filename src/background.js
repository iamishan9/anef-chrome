chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== "ANEF_TRACKER_STATUS_CHANGED") return;
  const previousCode = message.previous?.code || "previous status";
  const currentCode = message.current?.code || "new status";
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: "ANEF status changed",
    message: `${previousCode} -> ${currentCode}`,
  });
});
