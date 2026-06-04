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
    return (step.includes("assimilation") && label.includes("assimilation"))
      || (step.includes("recepisse") && label.includes("recepisse"));
  }

  function isPrimaryStepDate(stepLabel, itemLabel) {
    const step = normalizeText(stepLabel);
    const label = normalizeText(itemLabel);
    return step.includes("assimilation") && label === "assimilation interview";
  }

  function specificKeyDatesForStep(step, keyDates) {
    const primary = sortedDates((keyDates || [])
      .filter((item) => item?.date && isPrimaryStepDate(step?.label, item.label))
      .map((item) => item.date));
    if (primary.length) return primary;

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
    specificKeyDatesForStep,
    selectStepDate,
    isNationalityPage,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.ANEF_TRACKER_LOGIC = api;
})(typeof window !== "undefined" ? window : globalThis);
