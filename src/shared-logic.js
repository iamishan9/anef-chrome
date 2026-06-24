(function (root) {
  "use strict";

  function normalizeText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  function sortedDates(values) {
    return (values || [])
      .map(normalizeDate)
      .filter(Boolean)
      .sort();
  }

  function keyDateMatchesStep(stepLabel, itemLabel) {
    const step = normalizeText(stepLabel);
    const label = normalizeText(itemLabel);
    const timelineLabel = label.replace(/^timeline:\s*/, "");
    if (timelineLabel && timelineLabel === step) return true;
    return (step.includes("assimilation") && label.includes("assimilation"))
      || (step.includes("recepisse") && label.includes("recepisse"));
  }

  function isPrimaryStepDate(stepLabel, itemLabel) {
    const step = normalizeText(stepLabel);
    const label = normalizeText(itemLabel);
    return step.includes("assimilation") && label === "assimilation interview";
  }

  function specificKeyDatesForStep(step, keyDates) {
    const stepLabel = normalizeText(step?.label);
    const primary = sortedDates((keyDates || [])
      .filter((item) => item?.date && isPrimaryStepDate(step?.label, item.label))
      .map((item) => item.date));
    if (primary.length) return primary;
    if (stepLabel.includes("assimilation")) return [];

    return sortedDates((keyDates || [])
      .filter((item) => item?.date && keyDateMatchesStep(step?.label, item.label))
      .map((item) => item.date));
  }

  function selectStepDate({ step, currentStepId, currentDate, currentObservedAt, codeDates, keyDates }) {
    const specificDates = specificKeyDatesForStep(step, keyDates);
    if (specificDates.length) return specificDates[0];

    if (currentStepId === step?.id) {
      const activeStatusDate = normalizeDate(currentDate);
      if (activeStatusDate) return activeStatusDate;
    }

    const statusDates = sortedDates(codeDates);
    if (statusDates.length) return statusDates[0];

    if (currentStepId === step?.id) {
      const current = normalizeDate(currentObservedAt);
      if (current) return current;

      const statusDate = sortedDates((keyDates || [])
        .filter((item) => normalizeText(item?.label) === "status date")
        .map((item) => item.date))[0];
      if (statusDate) return statusDate;
    }

    return null;
  }

  function normalizeKeyDateLabel(label) {
    return normalizeText(label)
      .replace(/^frise:\s*/, "")
      .replace(/^timeline:\s*/, "");
  }

  function stepLabelMatches(normalizedKeyLabel, stepLabel) {
    const step = normalizeText(stepLabel);
    if (!step || !normalizedKeyLabel) return false;
    return normalizedKeyLabel.includes(step) || step.includes(normalizedKeyLabel);
  }

  function keyDateMatchesStepDate(item, stepEntries) {
    const itemDate = normalizeDate(item?.date);
    if (!itemDate) return false;
    const label = normalizeKeyDateLabel(item.label);
    if (label.includes("statut") || label === "status date" || label === "date du statut") {
      return true;
    }
    for (const step of stepEntries || []) {
      const stepDate = normalizeDate(step.date);
      if (!stepDate || stepDate !== itemDate) continue;
      const stepNorm = normalizeText(step.label);
      if (label.includes("assimilation") && stepNorm.includes("assimilation")) return true;
      if (label.includes("recepisse") && stepNorm.includes("recepisse")) return true;
      if (stepLabelMatches(label, step.label)) return true;
    }
    return false;
  }

  function shouldSkipKeyDate(item, stepEntries, decretIds) {
    if (!item?.label) return true;
    if (item.meta?.decretId) return true;
    const label = normalizeText(item.label);
    if (label.startsWith("identifiant decret")) return true;
    if (label === "date du statut" || label === "status date") return true;
    if (decretIds?.some((id) => label.includes(String(id)))) return true;
    if (keyDateMatchesStepDate(item, stepEntries)) return true;
    if (label.startsWith("frise :") || label.startsWith("timeline:")) {
      const clean = normalizeKeyDateLabel(item.label);
      return (stepEntries || []).some((step) => stepLabelMatches(clean, step.label));
    }
    return false;
  }

  function filterKeyDates(keyDates, stepEntries, decretIds) {
    return (keyDates || []).filter((item) => !shouldSkipKeyDate(item, stepEntries, decretIds));
  }

  function isNationalityPage(url, pageText) {
    const normalizedUrl = normalizeText(url);
    if ([
      "naturalisation",
      "nationalite",
      "nationalite-francaise",
      "nationality",
    ].some((term) => normalizedUrl.includes(term))) {
      return true;
    }

    const text = normalizeText(pageText);
    if (!text) return false;

    const stepTerms = [
      "demande envoyee",
      "examen des pieces",
      "demande deposee",
      "recepisse de completude",
      "entretien d'assimilation",
      "traitement en cours",
      "decision",
    ];
    const stepMatches = stepTerms.filter((term) => text.includes(term)).length;
    if (stepMatches >= 4) return true;

    return (text.includes("entretien d'assimilation") && text.includes("traitement en cours"))
      || (text.includes("nationalite francaise") && (text.includes("dossier") || text.includes("demande")))
      || (text.includes("naturalisation") && (text.includes("dossier") || text.includes("demande")));
  }

  const api = {
    normalizeText,
    normalizeDate,
    normalizeKeyDateLabel,
    specificKeyDatesForStep,
    selectStepDate,
    shouldSkipKeyDate,
    filterKeyDates,
    isNationalityPage,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ANEF_TRACKER_LOGIC = api;
})(typeof window !== "undefined" ? window : globalThis);
