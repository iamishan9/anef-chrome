import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/shared-logic.js", import.meta.url), "utf8");
const sandbox = {
  module: { exports: {} },
  window: {},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "src/shared-logic.js" });

const logic = Object.keys(sandbox.module.exports).length
  ? sandbox.module.exports
  : sandbox.window.ANEF_TRACKER_LOGIC;

assert.equal(typeof logic.selectStepDate, "function");
assert.equal(typeof logic.isNationalityPage, "function");

const interviewDate = "2026-07-15T08:30:00.000Z";
const statusDate = "2026-06-01T09:00:00.000Z";

assert.equal(
  logic.selectStepDate({
    step: { id: 7, label: "Entretien d'assimilation" },
    currentStepId: 7,
    currentDate: statusDate,
    currentObservedAt: "2026-06-01T09:05:00.000Z",
    codeDates: [statusDate],
    keyDates: [
      { label: "Notification entretien assimilation", date: "2026-06-05T10:00:00.000Z", source: "notifications" },
      { label: "Assimilation interview", date: interviewDate, source: "dossier-details" },
      { label: "Status date", date: statusDate, source: "dossier-statut" },
    ],
  }),
  interviewDate,
  "the actual assimilation appointment date should beat the active status date",
);

assert.equal(
  logic.selectStepDate({
    step: { id: 7, label: "Entretien d'assimilation" },
    currentStepId: 7,
    currentDate: statusDate,
    codeDates: [statusDate],
    keyDates: [{ label: "Status date", date: statusDate, source: "dossier-statut" }],
  }),
  statusDate,
  "without a specific appointment date, the active status date remains the fallback",
);

assert.equal(
  logic.selectStepDate({
    step: { id: 7, label: "Entretien d'assimilation" },
    currentStepId: 7,
    currentDate: statusDate,
    codeDates: [statusDate],
    keyDates: [
      { label: "Notification entretien assimilation", date: "2026-06-05T10:00:00.000Z", source: "notifications" },
      { label: "Status date", date: statusDate, source: "dossier-statut" },
    ],
  }),
  statusDate,
  "notification receipt dates should not be used as the interview appointment date",
);

assert.equal(
  logic.selectStepDate({
    step: { id: 1, label: "Demande envoyee" },
    currentStepId: 7,
    codeDates: [],
    keyDates: [
      { label: "Timeline: Demande envoyee", date: "2026-01-12T00:00:00.000Z", source: "frise-stepper" },
    ],
  }),
  "2026-01-12T00:00:00.000Z",
  "timeline dates from the ANEF frise should map back to their visual step",
);

assert.equal(
  logic.isNationalityPage(
    "https://administration-etrangers-en-france.interieur.gouv.fr/particuliers/#/compte",
    "Mon compte Mes informations",
  ),
  false,
  "generic ANEF account pages should not show dossier details",
);

assert.equal(
  logic.isNationalityPage(
    "https://administration-etrangers-en-france.interieur.gouv.fr/particuliers/#/naturalisation",
    "",
  ),
  true,
  "naturalisation URLs should show the tracker",
);

assert.equal(
  logic.isNationalityPage(
    "https://administration-etrangers-en-france.interieur.gouv.fr/particuliers/#/dossier",
    "Demande envoyee Examen des pieces Entretien d'assimilation Traitement en cours Decision",
  ),
  true,
  "the nationality stepper should show the tracker even when the URL is generic",
);

console.log("extension logic tests passed");
