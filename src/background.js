chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== "ANEF_TRACKER_STATUS_CHANGED") return;
  const previousCode = message.previous?.code || "statut precedent";
  const currentCode = message.current?.code || "nouveau statut";
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: "Statut ANEF modifie",
    message: `${previousCode} -> ${currentCode}`,
  });
});
