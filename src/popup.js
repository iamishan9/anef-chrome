(function () {
  "use strict";

  const STORE_KEY = "anefTrackerState";
  const DATA = window.ANEF_TRACKER_DATA || { statuses: {} };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function ce(tag, attrs, text) {
    const element = document.createElement(tag);
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (value == null) continue;
        if (key === "className") element.className = value;
        else element.setAttribute(key, value);
      }
    }
    if (text != null) element.textContent = text;
    return element;
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function statusInfo(code) {
    return DATA.statuses[code] || { label: code || "Unknown" };
  }

  async function loadState() {
    const saved = await chrome.storage.local.get(STORE_KEY);
    return saved[STORE_KEY] || null;
  }

  function renderCurrent(state) {
    const container = qs("#current");
    container.textContent = "";
    if (!state?.current?.code) {
      container.appendChild(ce("span", { className: "muted" }, "Open ANEF and log in to load status data."));
      return;
    }
    const info = statusInfo(state.current.code);
    container.appendChild(ce("span", { className: "code" }, state.current.code));
    container.appendChild(ce("strong", {}, info.label));
    container.appendChild(ce("span", { className: "date" }, `Changed: ${formatDate(state.current.date || state.current.observedAt)}`));
    if (state.dossierNumber) container.appendChild(ce("span", { className: "muted" }, `Dossier: ${state.dossierNumber}`));
  }

  function renderList(selector, entries, emptyText) {
    const list = qs(selector);
    list.textContent = "";
    if (!entries?.length) {
      const empty = ce("li");
      empty.appendChild(ce("span", { className: "muted" }, emptyText));
      list.appendChild(empty);
      return;
    }
    for (const entry of entries) {
      const item = ce("li");
      item.appendChild(ce("code", {}, entry.code));
      item.appendChild(ce("span", { className: "date" }, formatDate(entry.date || entry.observedAt)));
      const info = statusInfo(entry.code);
      item.appendChild(ce("span", { className: "muted" }, `${info.label}${entry.source ? ` - ${entry.source}` : ""}`));
      list.appendChild(item);
    }
  }

  function exportJson(state) {
    const blob = new Blob([JSON.stringify(state || {}, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anef-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function boot() {
    const state = await loadState();
    qs("#subtitle").textContent = state?.lastUpdatedAt ? `Updated ${formatDate(state.lastUpdatedAt)}` : "No local data yet";
    renderCurrent(state);
    renderList("#history", (state?.observations || []).slice().reverse(), "No observed status changes yet.");
    renderList("#timeline", state?.timeline || [], "No dated ANEF steps yet.");
    qs("#export").addEventListener("click", () => exportJson(state));
  }

  boot().catch(() => {
    renderCurrent(null);
  });
})();
