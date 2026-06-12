(function () {
  "use strict";

  const API_ORIGIN = "https://administration-etrangers-en-france.interieur.gouv.fr";
  const ENDPOINTS = {
    stepper: "/api/anf/dossier-stepper",
    frise: "/api/anf/usager/dossiers/frise-stepper",
    currentStates: "/api/anf/usager/current_states",
    dossierStatus: "/api/anf/usager/dossiers/statut",
    dossierBase: "/api/anf/usager/dossiers/",
    history: "/api/anf/usager/dossiers/historique",
    rapo: "/api/anf/usager/rapo",
    decrets: "/api/anf/usager/decrets",
    dmrDecrets: "/api/anf/usager/dmr/decrets",
    notifications: "/api/notifications",
  };

  const KNOWN_STATUS_CODES = new Set([
    "DRAFT",
    "DOSSIER_DEPOSE",
    "VERIFICATION_FORMELLE_A_TRAITER",
    "VERIFICATION_FORMELLE_EN_COURS",
    "VERIFICATION_FORMELLE_MISE_EN_DEMEURE",
    "INSTRUCTION_A_AFFECTER",
    "INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER",
    "INSTRUCTION_RECEPISSE_COMPLETUDE_A_ENVOYER_RETOUR_COMPLEMENT_A_TRAITER",
    "INSTRUCTION_DATE_EA_A_FIXER",
    "EA_EN_ATTENTE_EA",
    "EA_DEMANDE_REPORT_EA",
    "EA_CREA_A_VALIDER",
    "PROP_DECISION_PREF_A_EFFECTUER",
    "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_HIERARCHIQUE",
    "PROP_DECISION_PREF_PROP_A_EDITER",
    "PROP_DECISION_PREF_EN_ATTENTE_RETOUR_SIGNATAIRE",
    "CONTROLE_A_AFFECTER",
    "CONTROLE_A_EFFECTUER",
    "CONTROLE_EN_ATTENTE_PEC",
    "CONTROLE_PEC_A_FAIRE",
    "CONTROLE_TRANSMISE_POUR_DECRET",
    "CONTROLE_EN_ATTENTE_RETOUR_HIERARCHIQUE",
    "CONTROLE_DECISION_A_EDITER",
    "CONTROLE_EN_ATTENTE_SIGNATURE",
    "CONTROLE_DEMANDE_NOTIFIEE",
    "TRANSMIS_A_AC",
    "A_VERIFIER_AVANT_INSERTION_DECRET",
    "PRETE_POUR_INSERTION_DECRET",
    "DECRET_EN_PREPARATION",
    "DECRET_A_QUALIFIER",
    "DECRET_EN_VALIDATION",
    "INSEREE_DANS_DECRET",
    "DECRET_ENVOYE_PREFECTURE",
    "NOTIFICATION_ENVOYEE",
    "DECRET_NATURALISATION_PUBLIE",
    "DECRET_NATURALISATION_PUBLIE_JO",
    "DECRET_PUBLIE",
    "DEMANDE_TRAITEE",
    "DECISION_NEGATIVE_EN_DELAIS_RECOURS",
    "DECISION_NOTIFIEE",
    "DEMANDE_EN_COURS_RAPO",
    "IRRECEVABILITE_MANIFESTE",
    "IRRECEVABILITE_MANIFESTE_EN_DELAIS_RECOURS",
    "CSS_MISE_EN_DEMEURE_A_AFFECTER",
    "CSS_MISE_EN_DEMEURE_A_REDIGER",
    "CSS_MANUELS_A_AFFECTER",
    "CSS_MANUELS_A_REDIGER",
    "CSS_AUTOMATIQUES_A_AFFECTER",
    "CSS_AUTOMATIQUES_A_REDIGER",
    "CSS_EN_DELAIS_RECOURS",
    "CSS_NOTIFIE",
  ]);

  const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/WvhR9YrO6DHY
0UpAoIlIuDoF3PtLEJ3J0T5FOLAPSY2sa33AnECl6jWfM7uLuojuTDbfIz6J3vAo
sNUzwYFNHKx3EG1o6cYzjWm2LzZDa4e25wYlXcL2r3T0mFGS9DT7adKlomNURj4L
f2WUt11oNH8RYyH/uNk+kIL0HRJLtfTjyyjlWSyjUUDD1ATYZwjnQS2HvdcqJ+Go
3TTvqTG7yOPzC/lwSKG3zE3eL+pi9E9Lgw9NlSanewOu7toB9NiKwzP3kfSBNpkz
Sv4UBNClfp1UG+psSPnTx3Csil9TbPjSe99ZZ0/ffPf0h2xoga/7rWgScQwHzN9E
crvEfDgxAgMBAAECggEAa08Ikm2wOffcfEph6XwdgLpPT5ptEdtvoQ3GbessUGZf
HKHrE2iMmH6PM4g/VEx3Hat/2gJZv9dVtnv0E+IgMK4zyVFdCciPbbmP3qr7MzPK
F7fWqn26J7ydSc1hcZehXpwplNlL+qaphKkcvhlWOGm4GHgPSOjQa1V/GoZzDCE1
e1z9KpVuMMiV4d89FFiE3MHtnrmMnmUdbnesffVftnPmzkkGKKWTCL1BLrdEXgCz
GSFdqCo+PjcJjEojjmqHhgzTyjPOR6JGh0FqG9ht3aduIQMZfKR1p2+Ds18NlOZu
T60Lyc7Ud/d0H0f2h9GfftHYCSLkIxfTaAmoYXzXAQKBgQDoWc91xlh8Kb3vmIN1
IoVY2yhviDTpUqkGxvjt6WYmu38CFpEwSO0cpTVCAkWRKvjKLUOoCAaqfaTrN04t
LG85Z18gvSQKmncfv0zrKaTN/FrnKOA//hPCAcveDT6Ir9SCxgVmNBox70k89eQ+
5cDOZACqFhKcoAQa/LjF621HBQKBgQDS1Pi+GhSwbn6nBiqQdzU1+RpXdburzubd
3dgNlrAOmLoFEGqYNzaMcKbNljNTnAdv/FX6/NYaQGx/pYTs26o/SZZ+SE7Cl2RS
RJIuWeskuNEoH4W06JgO1djyHVOiHmKbyaATWCjoZSQnnHo8OUBUKOJpw8mrNlQl
IYUE0OLcPQKBgQDD3LlKUZnTiKhoqYrfGeuIfK34Xrwjlx+O6/l5LA+FRPaKfxWC
u2bNh+J+M0YLWksAuulWYvWjkGiOMz++Sr+zhxUkluwj2BPk+jDP53nafgju5YEr
0HU9TKBbHZUCSh384wo4HmGaiFiXf7wY3ToLgTciKZsk1qq/SRxFEvE6NQKBgHcS
Cs2qgybFsMf55o4ilS2/Ww4sEurMdny1bvD1usbzoJN9mwYOoMMeWEZh3ukIhPbN
J24R34WB/wT0YSc4RGVr1Q/LHJgv0lvYGEsPQ4tAyfeEHgp3FnHCerz6rSIxUPW1
IK/sKWZewNWSPULH/rnJQV4EUmBc1ZcG4E5A/u7tAoGBAMneO96PMhJFQDhsakTL
vGTbhuwBnFjbSuxmyebhszASOuKm8XTVDe004AZTSy7lAm+iYTkfeRbfVrIGWElT
5DWhmlN/zNTdX56dQWG3P5M48+bxZFXz0YCBAZJw8jZ5LcFuKrr5tQbcNZN9Pqgk
QJNdXtE3G7SjkDOn36yZSaXp
-----END PRIVATE KEY-----`;

  const PASSPHRASE = "wa_sir_3awtani_Dir_l_bou9_aaa_khay_div";
  let forgePromise = null;
  let privateKeyPromise = null;

  function currentScriptDataset() {
    const script = document.currentScript || document.querySelector("script[data-forge-url]");
    return script && script.dataset ? script.dataset : {};
  }

  function getForgeUrl() {
    return currentScriptDataset().forgeUrl || null;
  }

  function loadForge() {
    if (forgePromise) return forgePromise;
    forgePromise = new Promise((resolve, reject) => {
      if (typeof window.forge !== "undefined") {
        resolve(window.forge);
        return;
      }
      const forgeUrl = getForgeUrl();
      if (!forgeUrl) {
        reject(new Error("Missing forge URL"));
        return;
      }
      const script = document.createElement("script");
      script.src = forgeUrl;
      script.onload = () => resolve(window.forge);
      script.onerror = () => reject(new Error("Could not load forge"));
      (document.head || document.documentElement).appendChild(script);
    }).finally(() => {
      if (typeof window.forge === "undefined") forgePromise = null;
    });
    return forgePromise;
  }

  async function getPrivateKey() {
    if (!privateKeyPromise) {
      privateKeyPromise = loadForge().then((forge) => {
        return forge.pki.decryptRsaPrivateKey(PRIVATE_KEY_PEM.trim(), PASSPHRASE)
          || forge.pki.privateKeyFromPem(PRIVATE_KEY_PEM.trim());
      });
    }
    return privateKeyPromise;
  }

  function normalizeStatus(value) {
    if (!value || typeof value !== "string") return null;
    const direct = value.trim();
    const normalized = direct
      .replace(/[-\s]+/g, "_")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .toUpperCase();
    return KNOWN_STATUS_CODES.has(normalized) ? normalized : null;
  }

  async function decryptStatus(value) {
    const known = normalizeStatus(value);
    if (known) return known;
    if (!value || typeof value !== "string" || value.length < 24) return null;

    try {
      const forge = await loadForge();
      const key = await getPrivateKey();
      if (!key) return null;
      const decoded = forge.util.decode64(value);
      const buffer = forge.util.createBuffer(decoded, "raw");
      const clear = key.decrypt(buffer.getBytes(), "RSA-OAEP", {
        md: forge.md.sha256.create(),
        mgf1: forge.md.sha256.create(),
      });
      return normalizeStatus((clear.split("#K#")[0] || clear).trim());
    } catch (error) {
      return null;
    }
  }

  function isInterestingUrl(url) {
    if (!url) return false;
    const text = String(url);
    return text.includes("/api/anf/") || text.includes("/api/notifications");
  }

  function fullUrl(path) {
    return path.startsWith("http") ? path : API_ORIGIN + path;
  }

  async function fetchJson(path) {
    const response = await fetch(fullUrl(path), { credentials: "include" });
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    return response.json();
  }

  function send(type, data) {
    window.dispatchEvent(new CustomEvent("ANEF_TRACKER_DATA", {
      detail: {
        type,
        data,
        observedAt: new Date().toISOString(),
      },
    }));
  }

  function isDateLike(value) {
    if (!value || typeof value !== "string") return false;
    if (!/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(value)) return false;
    const parsed = Date.parse(value);
    return !Number.isNaN(parsed);
  }

  function normalizeDate(value) {
    if (!value || typeof value !== "string") return null;
    if (isDateLike(value)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return null;
  }

  function pickDate(object) {
    if (!object || typeof object !== "object") return null;
    const preferred = [
      "date_statut",
      "dateStatut",
      "date_status",
      "statusDate",
      "date_changement",
      "date_modification",
      "date_creation",
      "date_creation_demande",
      "date_depot",
      "dateDepot",
      "_updated",
      "_created",
      "updatedAt",
      "createdAt",
      "updated_at",
      "created_at",
      "date",
    ];
    for (const key of preferred) {
      const normalized = normalizeDate(object[key]);
      if (normalized) return normalized;
    }
    for (const [key, value] of Object.entries(object)) {
      if (/date/i.test(key)) {
        const normalized = normalizeDate(value);
        if (normalized) return normalized;
      }
    }
    return null;
  }

  function findDossierId(payload) {
    if (!payload || typeof payload !== "object") return null;
    const candidates = [
      payload?.dossier?.id,
      payload?.data?.id,
      payload?.data?.dossier?.id,
      payload?.id_dossier,
      payload?.dossier_id,
      payload?.id_demande,
    ];
    for (const value of candidates) {
      if (value != null && value !== "") return String(value);
    }
    return null;
  }

  function findDossierNumber(payload) {
    if (!payload || typeof payload !== "object") return null;
    const candidates = [
      payload?.dossier?.numero_national,
      payload?.numero_national,
      payload?.numeroNational,
      payload?.data?.numero_national,
      payload?.data?.demande?.numero_national,
    ];
    for (const value of candidates) {
      if (value != null && value !== "") return String(value);
    }
    return null;
  }

  function extractDecretIds(payload, output = new Set()) {
    if (!payload || typeof payload !== "object") return output;
    if (Array.isArray(payload)) {
      for (const item of payload) extractDecretIds(item, output);
      return output;
    }
    if (payload.decret && typeof payload.decret === "object" && payload.decret.id != null) {
      output.add(String(payload.decret.id));
    }
    if (/decret/i.test(String(payload.type || "")) && payload.id != null) {
      output.add(String(payload.id));
    }
    for (const value of Object.values(payload)) extractDecretIds(value, output);
    return output;
  }

  async function extractEvents(payload, source, path = "root", parent = null, output = []) {
    if (payload == null) return output;
    if (typeof payload === "string") {
      const code = await decryptStatus(payload);
      if (code) output.push({ code, date: pickDate(parent), source, path });
      return output;
    }
    if (Array.isArray(payload)) {
      for (let index = 0; index < payload.length; index += 1) {
        await extractEvents(payload[index], source, `${path}[${index}]`, payload[index], output);
      }
      return output;
    }
    if (typeof payload !== "object") return output;

    const directValues = [
      payload.statut,
      payload.status,
      payload.dossier_state,
      payload.rapo_statut,
      payload.state_dossier,
      payload.state_rapo,
      payload.state_declaratif_dmr,
      payload.state_dossier_declaration,
      payload.state_francisation,
      payload?.statut?.type,
      payload?.status?.type,
      payload?.data?.statut?.type,
      payload?.dossier?.statut,
    ];

    for (const value of directValues) {
      if (typeof value === "string") {
        const code = await decryptStatus(value);
        if (code) output.push({ code, date: pickDate(payload), source, path });
      }
    }

    for (const [key, value] of Object.entries(payload)) {
      if (key === "statut" || key === "status") {
        continue;
      }
      await extractEvents(value, source, `${path}.${key}`, value, output);
    }
    return output;
  }

  function addAssimilationInterviewDate(output, date, source, path) {
    if (output.some((item) => item.label === "Entretien d'assimilation" && item.date === date && item.source === source)) return;
    output.push({
      label: "Entretien d'assimilation",
      date,
      source,
      meta: { kind: "appointment", path },
    });
  }

  function extractAssimilationInterviewDates(payload, source, path = "root", output = []) {
    if (!payload || typeof payload !== "object") return output;
    if (Array.isArray(payload)) {
      payload.forEach((item, index) => extractAssimilationInterviewDates(item, source, `${path}[${index}]`, output));
      return output;
    }

    const nested = payload.entretien_assimilation || payload.entretienAssimilation;
    const nestedDate = normalizeDate(nested?.date_rdv || nested?.dateRdv);
    if (nestedDate) {
      addAssimilationInterviewDate(output, nestedDate, source, `${path}.entretien_assimilation.date_rdv`);
    }

    const directDate = normalizeDate(payload.date_rdv || payload.dateRdv);
    if (directDate && /entretien|assimilation/i.test(path)) {
      addAssimilationInterviewDate(output, directDate, source, `${path}.date_rdv`);
    }

    for (const [key, value] of Object.entries(payload)) {
      if (value && typeof value === "object") extractAssimilationInterviewDates(value, source, `${path}.${key}`, output);
    }
    return output;
  }

  function extractKeyDates(payload, source) {
    const dates = [];
    const add = (label, value) => {
      const date = normalizeDate(value);
      if (date) dates.push({ label, date, source });
    };

    dates.push(...extractAssimilationInterviewDates(payload, source));
    add("Complement demande", latestComplementDate(payload?.demande_complement));
    add("Date du statut", payload?.date_statut || payload?.dossier?.date_statut || payload?.data?.date_statut);

    const decretIds = Array.from(extractDecretIds(payload));
    for (const id of decretIds) {
      dates.push({ label: `Identifiant decret ANEF ${id}`, date: null, source, meta: { decretId: id } });
    }
    if (source === "frise-stepper") {
      dates.push(...extractFriseDates(payload, source));
    }
    return dates;
  }

  function extractFriseDates(payload, source, path = "frise", output = []) {
    if (!payload || typeof payload !== "object") return output;
    if (Array.isArray(payload)) {
      payload.forEach((item, index) => extractFriseDates(item, source, `${path}[${index}]`, output));
      return output;
    }
    const date = pickDate(payload);
    if (date) {
      const label = payload.title || payload.label || payload.libelle || payload.name || payload.etape || payload.step || path;
      output.push({ label: `Frise : ${String(label)}`, date, source });
    }
    for (const [key, value] of Object.entries(payload)) {
      if (value && typeof value === "object") extractFriseDates(value, source, `${path}.${key}`, output);
    }
    return output;
  }

  function latestComplementDate(complements) {
    if (!Array.isArray(complements)) return null;
    return complements
      .map((item) => item && (item.date_creation_demande || item.date_creation || item._created))
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() || null;
  }

  async function ingestPayload(source, url, payload, options = {}) {
    const events = await extractEvents(payload, source);
    const dossierId = findDossierId(payload) || options.dossierId || null;
    const dossierNumber = findDossierNumber(payload) || options.dossierNumber || null;
    const current = options.current || null;
    const decretIds = Array.from(extractDecretIds(payload));
    const keyDates = extractKeyDates(payload, source);
    const friseInfo = source === "frise-stepper" && payload
      ? {
        idActive: Number(payload.id_active || payload.idActive || 0) || null,
        typeFrise: payload.type_frise || payload.typeFrise || null,
        hasStepScec: payload.has_step_scec ?? payload.hasStepScec ?? null,
      }
      : null;

    if (!events.length && !current && !keyDates.length && !decretIds.length && !dossierId && !dossierNumber && !friseInfo) {
      return;
    }

    send("payload", {
      source,
      url,
      dossierId,
      dossierNumber,
      current,
      events,
      keyDates,
      decretIds,
      friseInfo,
    });
  }

  async function fetchNotificationsForDossier(dossierId) {
    if (!dossierId) return;
    try {
      const json = await fetchJson(ENDPOINTS.notifications);
      const items = Array.isArray(json?._items) ? json._items : [];
      const matches = items.filter((item) => String(item?.id_demande) === String(dossierId));
      const dates = matches
        .map((item) => ({
          label: item?.motif_notification || item?.type_notification || "Notification",
          date: normalizeDate(item?._created || item?.date_creation),
          source: "notifications",
        }))
        .filter((item) => item.date);
      if (dates.length) {
        send("payload", {
          source: "notifications",
          url: ENDPOINTS.notifications,
          dossierId,
          keyDates: dates,
          events: [],
          decretIds: [],
        });
      }
    } catch (error) {
      // Ignore unauthenticated or absent notification endpoint.
    }
  }

  async function pollKnownEndpoints() {
    await loadForge();
    let dossierId = null;
    let dossierNumber = null;

    try {
      const stepper = await fetchJson(ENDPOINTS.stepper);
      dossierId = findDossierId(stepper);
      dossierNumber = findDossierNumber(stepper);
      const currentCode = await decryptStatus(stepper?.dossier?.statut);
      const currentDate = normalizeDate(stepper?.dossier?.date_statut);
      const current = currentCode ? { code: currentCode, date: currentDate, source: "dossier-stepper" } : null;
      await ingestPayload("dossier-stepper", ENDPOINTS.stepper, stepper, { current, dossierId, dossierNumber });
    } catch (error) {
      send("status", { state: "waiting_for_login", message: "En attente d'une session ANEF authentifiee." });
      return;
    }

    const endpoints = [
      ["dossier-statut", ENDPOINTS.dossierStatus],
      ["current-states", ENDPOINTS.currentStates],
      ["frise-stepper", ENDPOINTS.frise],
      ["history", ENDPOINTS.history],
      ["rapo", ENDPOINTS.rapo],
      ["decrets", ENDPOINTS.decrets],
      ["dmr-decrets", ENDPOINTS.dmrDecrets],
    ];

    if (dossierId) {
      endpoints.unshift(["dossier-details", ENDPOINTS.dossierBase + encodeURIComponent(dossierId)]);
    }

    for (const [source, endpoint] of endpoints) {
      try {
        const payload = await fetchJson(endpoint);
        let current = null;
        if (source === "dossier-statut") {
          const code = await decryptStatus(payload?.dossier_state || payload?.state_dossier);
          const date = normalizeDate(payload?.updatedAt || payload?.updated_at || payload?.date_statut || payload?.dateStatut);
          current = code ? { code, date, source } : null;
        }
        await ingestPayload(source, endpoint, payload, { dossierId, dossierNumber, current });
      } catch (error) {
        // ANEF exposes different endpoints depending on dossier state; absence is normal.
      }
    }

    await fetchNotificationsForDossier(dossierId);
    send("status", { state: "ready", message: "ANEF status data loaded." });
  }

  function installFetchProbe() {
    if (window.__ANEF_TRACKER_FETCH_PROBE__) return;
    window.__ANEF_TRACKER_FETCH_PROBE__ = true;

    const originalFetch = window.fetch;
    if (typeof originalFetch === "function") {
      window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = args[0] && (args[0].url || args[0]);
        if (isInterestingUrl(url)) {
          response.clone().json()
            .then((json) => ingestPayload("network", String(url), json))
            .catch(() => {});
        }
        return response;
      };
    }

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__anefTrackerUrl = url;
      return originalOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (...args) {
      this.addEventListener("load", function () {
        if (!isInterestingUrl(this.__anefTrackerUrl)) return;
        try {
          const text = this.responseText;
          if (!text || text[0] !== "{" && text[0] !== "[") return;
          ingestPayload("network-xhr", String(this.__anefTrackerUrl), JSON.parse(text));
        } catch (error) {
          // Ignore non-JSON responses.
        }
      });
      return originalSend.apply(this, args);
    };
  }

  window.addEventListener("ANEF_TRACKER_REFRESH", () => {
    pollKnownEndpoints().catch(() => {});
  });

  installFetchProbe();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => pollKnownEndpoints().catch(() => {}));
  } else {
    pollKnownEndpoints().catch(() => {});
  }
  window.setInterval(() => pollKnownEndpoints().catch(() => {}), 180000);
})();
