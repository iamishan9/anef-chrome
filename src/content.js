(function () {
  "use strict";

  const STORE_KEY = "anefTrackerState";
  const DATA = window.ANEF_TRACKER_DATA || { statuses: {}, phases: {}, statusOrder: [], negativeOrder: [], sources: [] };

  const STEP_SETS = {
    completeScec: [
      ["Demande envoyee", ["DRAFT", "DOSSIER_DEPOSE"]],
      ["Examen des pieces en cours", ["VERIFICATION_FORMELLE_A_TRAITER", "VERIFICATION_FORMELLE_EN_COURS", "VERIFICATION_FORMELLE_MISE_EN_DEMEURE"]],
      ["Demande deposee", ["INSTRUCTION_A_AFFECTER"]],
      ["Traitement en cours (Plateforme)", ["INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER", "INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER_RETOUR_COMPLEMENT_A_TRAITER"]],
      ["Reception du recepisse de completude", ["INSTRUCTION_DATE_EA_A_FIXER"]],
      ["Traitement en cours (Plateforme)", ["INSTRUCTION_DATE_EA_A_FIXER"]],
      ["Entretien d'assimilation", ["EA_EN_ATTENTE_EA", "EA_DEMANDE_REPORT_EA", "EA_CREA_A_VALIDER"]],
      ["Traitement en cours (Plateforme)", ["PROP_DECISION_PREF_A_EFFECTUER", "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE", "PROP_DECISION_PREF_PROP_A_EDITER", "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE"]],
      ["Traitement en cours (SDANF)", ["CONTROLE_A_AFFECTER", "CONTROLE_A_EFFECTUER"]],
      ["Traitement en cours (SCEC)", ["CONTROLE_EN_ATTENTE_PEC", "CONTROLE_PEC_A_FAIRE"]],
      ["Traitement en cours (SDANF)", ["CONTROLE_TRANSMISE_POUR_DECRET", "CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE", "CONTROLE_DECISION_A_EDITER", "CONTROLE_EN_ATTENTE_SIGNATURE", "TRANSMIS_A_AC", "A_VERIFIER_AVANT_INSERTION_DECRET", "PRETE_POUR_INSERTION_DECRET", "DECRET_EN_PREPARATION", "DECRET_A_QUALIFIER", "DECRET_EN_VALIDATION", "INSEREE_DANS_DECRET"]],
      ["Decision", ["DECRET_NATURALISATION_PUBLIE", "DECRET_NATURALISATION_PUBLIE_JO", "DECRET_PUBLIE", "DECISION_NEGATIVE_EN_DELAIS_RECOURS", "DECISION_NOTIFIEE", "CONTROLE_DEMANDE_NOTIFIEE", "IRRECEVABILITE_MANIFESTE", "IRRECEVABILITE_MANIFESTE_EN_DELAIS_RECOURS", "CSS_NOTIFIE"]],
      ["Ceremonie / livret", ["DEMANDE_TRAITEE"]],
    ],
    completeNoScec: [
      ["Demande envoyee", ["DRAFT", "DOSSIER_DEPOSE"]],
      ["Examen des pieces en cours", ["VERIFICATION_FORMELLE_A_TRAITER", "VERIFICATION_FORMELLE_EN_COURS", "VERIFICATION_FORMELLE_MISE_EN_DEMEURE"]],
      ["Demande deposee", ["INSTRUCTION_A_AFFECTER"]],
      ["Traitement en cours (Plateforme)", ["INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER", "INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER_RETOUR_COMPLEMENT_A_TRAITER"]],
      ["Reception du recepisse de completude", ["INSTRUCTION_DATE_EA_A_FIXER"]],
      ["Traitement en cours (Plateforme)", ["INSTRUCTION_DATE_EA_A_FIXER", "EA_CREA_A_VALIDER"]],
      ["Entretien d'assimilation", ["EA_EN_ATTENTE_EA", "EA_DEMANDE_REPORT_EA"]],
      ["Traitement en cours (Plateforme)", ["PROP_DECISION_PREF_A_EFFECTUER", "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE", "PROP_DECISION_PREF_PROP_A_EDITER", "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE"]],
      ["Traitement en cours (SDANF)", ["CONTROLE_A_AFFECTER", "CONTROLE_A_EFFECTUER", "CONTROLE_TRANSMISE_POUR_DECRET", "CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE", "CONTROLE_DECISION_A_EDITER", "CONTROLE_EN_ATTENTE_SIGNATURE", "TRANSMIS_A_AC", "A_VERIFIER_AVANT_INSERTION_DECRET", "PRETE_POUR_INSERTION_DECRET", "DECRET_EN_PREPARATION", "DECRET_A_QUALIFIER", "DECRET_EN_VALIDATION", "INSEREE_DANS_DECRET"]],
      ["Decision", ["DECRET_NATURALISATION_PUBLIE", "DECRET_NATURALISATION_PUBLIE_JO", "DECRET_PUBLIE", "DECISION_NEGATIVE_EN_DELAIS_RECOURS", "DECISION_NOTIFIEE", "CONTROLE_DEMANDE_NOTIFIEE", "IRRECEVABILITE_MANIFESTE", "IRRECEVABILITE_MANIFESTE_EN_DELAIS_RECOURS", "CSS_NOTIFIE"]],
      ["Ceremonie / livret", ["DEMANDE_TRAITEE"]],
    ],
  };

  let state = {
    current: null,
    timeline: [],
    observations: [],
    keyDates: [],
    decretIds: [],
    dossierId: null,
    dossierNumber: null,
    friseInfo: null,
    runtimeStatus: "Starting",
    lastUpdatedAt: null,
  };
  let root = null;
  let renderTimer = null;
  let quietUntil = 0;

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

  function injectPageScript() {
    if (document.getElementById("anef-tracker-injected-script")) return;
    const script = document.createElement("script");
    script.id = "anef-tracker-injected-script";
    script.src = chrome.runtime.getURL("src/injected.js");
    script.dataset.forgeUrl = chrome.runtime.getURL("lib/forge.min.js");
    script.async = false;
    (document.head || document.documentElement).appendChild(script);
  }

  async function loadInitialState() {
    try {
      const saved = await chrome.storage.local.get(STORE_KEY);
      if (saved[STORE_KEY]) state = { ...state, ...saved[STORE_KEY] };
    } catch (error) {
      // Keep defaults.
    }
  }

  function scheduleRender() {
    if (Date.now() < quietUntil) return;
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(render, 120);
  }

  function normalizeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function formatDate(value, withTime = false) {
    const iso = normalizeDate(value);
    if (!iso) return "";
    const date = new Date(iso);
    const options = withTime
      ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Intl.DateTimeFormat("fr-FR", options).format(date);
  }

  function daysSince(value) {
    const iso = normalizeDate(value);
    if (!iso) return null;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  }

  function relativeAge(value) {
    const days = daysSince(value);
    if (days == null) return "";
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    if (days < 31) return `${days} days ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    const years = Math.floor(days / 365);
    const remMonths = Math.floor((days % 365) / 30);
    return remMonths
      ? `${years} year${years > 1 ? "s" : ""} ${remMonths} month${remMonths > 1 ? "s" : ""} ago`
      : `${years} year${years > 1 ? "s" : ""} ago`;
  }

  function statusInfo(code) {
    return {
      code,
      label: code || "Unknown status",
      detail: "This status was found in ANEF data but is not in the local dictionary yet.",
      phase: "unknown",
      next: [],
      ...(DATA.statuses[code] || {}),
    };
  }

  function phaseInfo(phaseKey) {
    return DATA.phases[phaseKey] || { label: "Unknown phase", estimate: "unknown" };
  }

  function timelineKey(entry) {
    return [entry.code || "", entry.date || "", entry.source || ""].join("|");
  }

  function statusIndex(code) {
    const main = DATA.statusOrder.indexOf(code);
    if (main >= 0) return main;
    const neg = DATA.negativeOrder.indexOf(code);
    return neg >= 0 ? DATA.statusOrder.length + neg : Number.MAX_SAFE_INTEGER;
  }

  function mergeTimeline(events) {
    const map = new Map(state.timeline.map((entry) => [timelineKey(entry), entry]));
    for (const event of events || []) {
      if (!event || !event.code) continue;
      const normalized = {
        code: event.code,
        date: normalizeDate(event.date),
        source: event.source || "ANEF",
        path: event.path || null,
        observedAt: event.observedAt || new Date().toISOString(),
      };
      map.set(timelineKey(normalized), normalized);
    }
    state.timeline = Array.from(map.values())
      .sort((a, b) => {
        const byIndex = statusIndex(a.code) - statusIndex(b.code);
        return byIndex || String(a.date || a.observedAt).localeCompare(String(b.date || b.observedAt));
      })
      .slice(-140);
  }

  function mergeObservations(current) {
    if (!current || !current.code) return;
    const observation = {
      code: current.code,
      date: normalizeDate(current.date),
      source: current.source || "ANEF",
      observedAt: new Date().toISOString(),
    };
    const previous = state.observations[state.observations.length - 1] || null;
    const duplicate = previous
      && previous.code === observation.code
      && previous.date === observation.date
      && previous.source === observation.source;
    if (!duplicate) state.observations.push(observation);
    state.observations = state.observations.slice(-100);
  }

  function mergeKeyDates(keyDates) {
    const map = new Map(state.keyDates.map((item) => [`${item.label}|${item.date || ""}|${item.source || ""}`, item]));
    for (const item of keyDates || []) {
      if (!item || !item.label) continue;
      const normalized = {
        label: item.label,
        date: normalizeDate(item.date),
        source: item.source || "ANEF",
        meta: item.meta || null,
      };
      map.set(`${normalized.label}|${normalized.date || ""}|${normalized.source}`, normalized);
    }
    state.keyDates = Array.from(map.values())
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
      .slice(-120);
  }

  function mergeDecretIds(ids) {
    const set = new Set(state.decretIds || []);
    for (const id of ids || []) {
      if (id != null && id !== "") set.add(String(id));
    }
    state.decretIds = Array.from(set).sort();
  }

  async function persist(previousCurrent) {
    state.lastUpdatedAt = new Date().toISOString();
    await chrome.storage.local.set({ [STORE_KEY]: state });
    if (previousCurrent?.code && state.current?.code && previousCurrent.code !== state.current.code) {
      chrome.runtime.sendMessage({
        type: "ANEF_TRACKER_STATUS_CHANGED",
        previous: previousCurrent,
        current: state.current,
      }).catch(() => {});
    }
  }

  function handleIncoming(event) {
    const detail = event.detail || {};
    const previousCurrent = state.current ? { ...state.current } : null;

    if (detail.type === "status") {
      state.runtimeStatus = detail.data?.message || detail.data?.state || "Waiting";
      scheduleRender();
      persist(previousCurrent).catch(() => {});
      return;
    }

    if (detail.type !== "payload") return;
    const payload = detail.data || {};
    state.runtimeStatus = "Loaded from ANEF";
    state.dossierId = payload.dossierId || state.dossierId;
    state.dossierNumber = payload.dossierNumber || state.dossierNumber;
    state.friseInfo = payload.friseInfo || state.friseInfo;

    mergeTimeline((payload.events || []).map((entry) => ({ ...entry, observedAt: detail.observedAt })));
    mergeKeyDates(payload.keyDates || []);
    mergeDecretIds(payload.decretIds || []);

    if (payload.current?.code) {
      const incomingDate = normalizeDate(payload.current.date);
      state.current = {
        code: payload.current.code,
        date: incomingDate || (state.current?.code === payload.current.code ? state.current.date : null),
        source: payload.current.source || payload.source || "ANEF",
        observedAt: detail.observedAt || new Date().toISOString(),
      };
      mergeObservations(state.current);
      mergeTimeline([{ ...state.current, path: "current" }]);
    }

    scheduleRender();
    persist(previousCurrent).catch(() => {});
  }

  function requestRefresh() {
    window.dispatchEvent(new CustomEvent("ANEF_TRACKER_REFRESH"));
    state.runtimeStatus = "Refreshing ANEF APIs";
    scheduleRender();
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `anef-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function activeStepSet() {
    const hasScec = state.friseInfo?.hasStepScec !== false;
    const rows = hasScec ? STEP_SETS.completeScec : STEP_SETS.completeNoScec;
    return rows.map((row, index) => ({
      id: index + 1,
      label: row[0],
      codes: row[1],
    }));
  }

  function stepIdForCode(code) {
    if (!code) return null;
    const steps = activeStepSet();
    const found = steps.find((step) => step.codes.includes(code));
    return found?.id || null;
  }

  function currentStepId() {
    return state.friseInfo?.idActive || stepIdForCode(state.current?.code) || null;
  }

  function dateForCode(code) {
    const matches = state.timeline
      .filter((entry) => entry.code === code && (entry.date || entry.observedAt))
      .sort((a, b) => String(a.date || a.observedAt).localeCompare(String(b.date || b.observedAt)));
    return matches[0]?.date || matches[0]?.observedAt || null;
  }

  function stepDate(step) {
    const currentId = currentStepId();
    if (currentId === step.id && (state.current?.date || state.current?.observedAt)) {
      return state.current.date || state.current.observedAt;
    }
    const dates = [];
    for (const code of step.codes) {
      const date = dateForCode(code);
      if (date) dates.push(date);
    }
    for (const item of state.keyDates || []) {
      const label = normalizeText(item.label || "");
      if (!item.date) continue;
      if (step.label.toLowerCase().includes("assimilation") && label.includes("assimilation")) dates.push(item.date);
      if (step.label.toLowerCase().includes("recepisse") && label.includes("recepisse")) dates.push(item.date);
      if (step.id === currentId && label === "status date") dates.push(item.date);
    }
    return dates.sort()[0] || null;
  }

  function normalizeText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 8 && rect.height > 8;
  }

  function findStepperContext() {
    const labels = [
      "application sent",
      "application submitted",
      "documents are currently",
      "demande envoyee",
      "examen des pieces",
      "demande deposee",
      "attestation",
      "reception du recepisse",
      "integration interview",
      "entretien d'assimilation",
      "traitement en cours",
      "decision taken",
      "decision",
      "booklet",
      "livret",
    ];

    const visualItems = findVisualStepItems(labels);
    if (visualItems.length >= 4) {
      return {
        container: commonContainer(visualItems) || visualItems[0].parentElement,
        items: visualItems,
      };
    }

    const itemSelectors = [
      ".ui-steps-item",
      ".p-steps-item",
      ".fr-stepper__step",
      "[role='listitem']",
      "li",
    ].join(",");

    const allItems = Array.from(document.querySelectorAll(itemSelectors))
      .filter((element) => !element.closest("#anef-tracker-root"))
      .filter(isVisible)
      .filter((element) => {
        const text = normalizeText(element.innerText || element.textContent);
        return text.length < 280 && labels.some((label) => text.includes(label));
      });

    const uniqueItems = [];
    const seen = new Set();
    for (const item of allItems) {
      const rect = item.getBoundingClientRect();
      const key = `${Math.round(rect.left)}:${Math.round(rect.top)}:${Math.round(rect.width)}:${Math.round(rect.height)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    }

    uniqueItems.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return Math.abs(ar.top - br.top) > 30 ? ar.top - br.top : ar.left - br.left;
    });

    if (uniqueItems.length >= 4) {
      return {
        container: commonContainer(uniqueItems) || uniqueItems[0].parentElement,
        items: uniqueItems,
      };
    }

    const possibleContainers = Array.from(document.querySelectorAll("app-ma-demande, app-root, main, section, div"))
      .filter((element) => !element.closest("#anef-tracker-root"))
      .filter(isVisible)
      .map((element) => ({ element, text: normalizeText(element.innerText || element.textContent) }))
      .filter(({ text }) => labels.filter((label) => text.includes(label)).length >= 4)
      .sort((a, b) => (a.element.innerText || "").length - (b.element.innerText || "").length);

    if (possibleContainers[0]) {
      return { container: possibleContainers[0].element, items: [] };
    }
    return { container: document.querySelector("app-root") || document.body, items: [] };
  }

  function findVisualStepItems(labels) {
    const candidates = Array.from(document.querySelectorAll("app-root *"))
      .filter((element) => !element.closest("#anef-tracker-root"))
      .filter(isVisible)
      .filter((element) => {
        const text = normalizeText(element.innerText || element.textContent);
        return text.length >= 8 && text.length <= 700 && labels.some((label) => text.includes(label));
      })
      .map((element) => climbToStepCard(element, labels))
      .filter(Boolean);

    const unique = dedupeOverlappingCards(candidates);
    const groups = [];
    for (const item of unique) {
      const rect = item.getBoundingClientRect();
      const top = rect.top;
      let group = groups.find((entry) => Math.abs(entry.top - top) < 90);
      if (!group) {
        group = { top, items: [] };
        groups.push(group);
      }
      group.items.push(item);
      group.top = (group.top * (group.items.length - 1) + top) / group.items.length;
    }

    const best = groups
      .map((group) => group.items.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left))
      .sort((a, b) => b.length - a.length)[0] || [];

    const expected = activeStepSet().length;
    return best.length > expected ? best.slice(0, expected) : best;
  }

  function climbToStepCard(element, labels) {
    let node = element;
    let best = null;
    while (node && node !== document.body && node !== document.documentElement) {
      const rect = node.getBoundingClientRect();
      const text = normalizeText(node.innerText || node.textContent);
      const looksLikeStepCard = rect.width >= 58
        && rect.width <= 260
        && rect.height >= 72
        && rect.height <= 540
        && text.length <= 700
        && labels.some((label) => text.includes(label));
      if (looksLikeStepCard) best = node;
      if (rect.width > Math.min(window.innerWidth * 0.45, 560)) break;
      node = node.parentElement;
    }
    return best;
  }

  function dedupeOverlappingCards(cards) {
    const sorted = Array.from(new Set(cards)).sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left) || ((br.width * br.height) - (ar.width * ar.height));
    });
    const output = [];
    for (const card of sorted) {
      const existingIndex = output.findIndex((other) => overlapRatio(card, other) > 0.62);
      if (existingIndex === -1) {
        output.push(card);
        continue;
      }
      const cardRect = card.getBoundingClientRect();
      const otherRect = output[existingIndex].getBoundingClientRect();
      const cardScore = stepCardScore(card, cardRect);
      const otherScore = stepCardScore(output[existingIndex], otherRect);
      if (cardScore > otherScore) output[existingIndex] = card;
    }
    return output;
  }

  function stepCardScore(element, rect) {
    const text = normalizeText(element.innerText || element.textContent);
    const area = rect.width * rect.height;
    const saneWidth = rect.width >= 80 && rect.width <= 190 ? 30 : 0;
    const saneHeight = rect.height >= 110 && rect.height <= 430 ? 30 : 0;
    const textScore = text.includes("traitement en cours") || text.includes("application") || text.includes("demande") ? 20 : 0;
    return saneWidth + saneHeight + textScore + Math.min(area / 1000, 80);
  }

  function overlapRatio(a, b) {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const x = Math.max(0, Math.min(ar.right, br.right) - Math.max(ar.left, br.left));
    const y = Math.max(0, Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top));
    const intersection = x * y;
    const minArea = Math.min(ar.width * ar.height, br.width * br.height);
    return minArea ? intersection / minArea : 0;
  }

  function commonContainer(items) {
    if (!items.length) return null;
    let node = items[0].parentElement;
    while (node && !items.every((item) => node.contains(item))) node = node.parentElement;
    return node;
  }

  function cleanupStepDecorations() {
    document.querySelectorAll(".anef-tracker-step-date, .anef-tracker-step-code, .anef-tracker-step-note").forEach((node) => node.remove());
    document.querySelectorAll(".anef-tracker-step-enhanced, .anef-tracker-current-step").forEach((node) => {
      node.classList.remove("anef-tracker-step-enhanced", "anef-tracker-current-step", "anef-tracker-dated-step");
      node.removeAttribute("data-anef-tracker-step-id");
    });
  }

  function decorateAnefStepper(context) {
    cleanupStepDecorations();
    const steps = activeStepSet();
    const items = context.items.slice(0, steps.length);
    if (items.length < 4) return;

    const activeId = currentStepId();
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const step = steps[index];
      const date = stepDate(step);
      item.classList.add("anef-tracker-step-enhanced");
      item.dataset.anefTrackerStepId = String(step.id);
      if (date) item.classList.add("anef-tracker-dated-step");
      if (activeId === step.id) item.classList.add("anef-tracker-current-step");

      if (date) {
        item.appendChild(ce("span", { className: "anef-tracker-step-date" }, formatDate(date)));
      }
      if (activeId === step.id && state.current?.code) {
        item.appendChild(ce("span", { className: "anef-tracker-step-code" }, state.current.code));
        const since = relativeAge(state.current.date || state.current.observedAt);
        item.appendChild(ce("span", { className: "anef-tracker-step-note" }, since ? `Changed ${formatDate(state.current.date || state.current.observedAt)} (${since})` : "Current ANEF API status"));
      }
    }
  }

  function placeRoot(context) {
    if (!root) root = ce("div", { id: "anef-tracker-root" });
    const anchor = context.container;
    const target = anchor?.parentElement || document.querySelector("app-root") || document.body;
    if (anchor && anchor.nextSibling !== root) {
      target.insertBefore(root, anchor.nextSibling);
    } else if (!root.parentElement) {
      target.appendChild(root);
    }
  }

  function renderCurrent(container) {
    const current = state.current;
    const info = statusInfo(current?.code);
    const phase = phaseInfo(info.phase);
    const changedDate = current?.date || current?.observedAt;
    const expected = info.expectedOverride || phase.estimate;

    const card = ce("section", { className: "anef-tracker-current" });
    const title = ce("div", { className: "anef-tracker-inline-title" });
    title.appendChild(ce("strong", {}, "ANEF API tracker"));
    title.appendChild(ce("span", {}, state.runtimeStatus || "Ready"));
    card.appendChild(title);

    const codeLine = ce("div", { className: "anef-tracker-code-row" });
    codeLine.appendChild(ce("span", { className: "anef-tracker-current-code" }, current?.code || "Waiting for ANEF login"));
    if (current?.code && changedDate) codeLine.appendChild(ce("span", { className: "anef-tracker-current-date" }, `Changed ${formatDate(changedDate)}`));
    card.appendChild(codeLine);

    card.appendChild(ce("p", {}, current?.code ? `${info.label}. ${info.detail}` : "Open your ANEF dashboard after logging in; the extension will insert real API dates on the frise above."));

    if (current?.code) {
      const meta = ce("div", { className: "anef-tracker-meta-grid" });
      meta.appendChild(metaItem("Visual step", currentStepId() ? `Step ${currentStepId()}` : "Unknown"));
      meta.appendChild(metaItem("Phase", phase.label));
      meta.appendChild(metaItem("Observed date", changedDate ? `${formatDate(changedDate)}${relativeAge(changedDate) ? ` (${relativeAge(changedDate)})` : ""}` : "Not exposed by ANEF"));
      meta.appendChild(metaItem("Expected next range", expected));
      card.appendChild(meta);

      const next = Array.isArray(info.next) ? info.next : [];
      if (next.length) {
        const list = ce("div", { className: "anef-tracker-next-list" });
        for (const code of next) list.appendChild(ce("span", { className: "anef-tracker-next-pill" }, code));
        card.appendChild(list);
      }
    }

    container.appendChild(card);
  }

  function metaItem(label, value) {
    const wrap = ce("div", { className: "anef-tracker-meta-item" });
    wrap.appendChild(ce("span", {}, label));
    wrap.appendChild(ce("strong", {}, value || "Unknown"));
    return wrap;
  }

  function renderRealDates(container) {
    const entries = activeStepSet()
      .map((step) => ({ step, date: stepDate(step) }))
      .filter((entry) => entry.date)
      .slice(0, 16);
    if (!entries.length) return;

    const section = ce("section", { className: "anef-tracker-section" });
    section.appendChild(ce("h3", {}, "Real dates found in ANEF APIs"));
    const grid = ce("div", { className: "anef-tracker-keydates" });
    for (const entry of entries) {
      grid.appendChild(keyDate(`Step ${entry.step.id}: ${entry.step.label}`, formatDate(entry.date)));
    }
    section.appendChild(grid);
    container.appendChild(section);
  }

  function renderKeyDates(container) {
    const useful = state.keyDates.filter((item) => item.date || item.meta?.decretId).slice(-10);
    if (!useful.length && !state.decretIds.length && !state.dossierId && !state.dossierNumber) return;
    const section = ce("section", { className: "anef-tracker-section" });
    section.appendChild(ce("h3", {}, "Other API data"));
    const grid = ce("div", { className: "anef-tracker-keydates" });
    if (state.dossierNumber) grid.appendChild(keyDate("Dossier number", state.dossierNumber));
    if (state.dossierId) grid.appendChild(keyDate("Internal dossier id", state.dossierId));
    for (const id of state.decretIds || []) grid.appendChild(keyDate("ANEF decree id", id));
    for (const item of useful) {
      if (item.meta?.decretId) continue;
      grid.appendChild(keyDate(item.label, item.date ? formatDate(item.date) : "Found"));
    }
    section.appendChild(grid);
    container.appendChild(section);
  }

  function keyDate(label, value) {
    const wrap = ce("div", { className: "anef-tracker-keydate" });
    wrap.appendChild(ce("span", {}, label));
    wrap.appendChild(ce("strong", {}, value || "Unknown"));
    return wrap;
  }

  function renderActions(container) {
    const actions = ce("div", { className: "anef-tracker-actions" });
    const refresh = ce("button", { type: "button" }, "Refresh API");
    refresh.addEventListener("click", requestRefresh);
    const exportButton = ce("button", { type: "button" }, "Export JSON");
    exportButton.addEventListener("click", exportJson);
    actions.append(refresh, exportButton);
    container.appendChild(actions);
  }

  function renderSources(container) {
    const section = ce("section", { className: "anef-tracker-sources" });
    section.appendChild(ce("p", {}, "Only dates exposed by ANEF APIs are added to the frise. Estimates are community ranges, not official commitments."));
    const sourceList = ce("div", { className: "anef-tracker-source-list" });
    for (const source of DATA.sources || []) {
      sourceList.appendChild(ce("a", { href: source.url, target: "_blank", rel: "noreferrer" }, source.label));
    }
    section.appendChild(sourceList);
    container.appendChild(section);
  }

  function render() {
    quietUntil = Date.now() + 500;
    cleanupStepDecorations();
    const context = findStepperContext();
    placeRoot(context);
    decorateAnefStepper(context);
    root.textContent = "";

    const shell = ce("div", { className: "anef-tracker-shell" });
    const body = ce("div", { className: "anef-tracker-body" });
    renderCurrent(body);
    renderRealDates(body);
    renderKeyDates(body);
    renderActions(body);
    renderSources(body);
    shell.appendChild(body);
    root.appendChild(shell);
    window.setTimeout(() => {
      quietUntil = 0;
    }, 500);
  }

  async function boot() {
    await loadInitialState();
    render();
    window.addEventListener("ANEF_TRACKER_DATA", handleIncoming);
    injectPageScript();
    const observer = new MutationObserver((mutations) => {
      if (Date.now() < quietUntil) return;
      const onlyOwnChanges = mutations.every((mutation) => {
        const target = mutation.target;
        return target instanceof Element && (
          target.closest("#anef-tracker-root")
          || target.classList.contains("anef-tracker-step-enhanced")
        );
      });
      if (!onlyOwnChanges) scheduleRender();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  boot().catch(() => {});
})();
