import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/injected.js", import.meta.url), "utf8");
const instrumented = source.replace(
  "  window.addEventListener(\"ANEF_TRACKER_REFRESH\"",
  "  window.__testExports = { extractKeyDates, normalizeDate };\n\n  window.addEventListener(\"ANEF_TRACKER_REFRESH\"",
);

const sandbox = {
  CustomEvent: function CustomEvent(type, options) {
    return { type, ...options };
  },
  Date,
  Error,
  JSON,
  Number,
  Promise,
  Set,
  String,
  URL,
  console,
  document: {
    readyState: "loading",
    addEventListener() {},
    currentScript: null,
    querySelector() {
      return null;
    },
  },
  window: {
    addEventListener() {},
    dispatchEvent() {},
    setInterval() {},
  },
};
sandbox.XMLHttpRequest = function XMLHttpRequest() {};
sandbox.XMLHttpRequest.prototype.open = function open() {};
sandbox.XMLHttpRequest.prototype.send = function send() {};
sandbox.window.XMLHttpRequest = sandbox.XMLHttpRequest;
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);
vm.runInContext(instrumented, sandbox, { filename: "src/injected.js" });

const { extractKeyDates } = sandbox.window.__testExports;
const appointment = "2026-07-15T08:30:00+02:00";

const keyDates = extractKeyDates({
  dossier: {
    id: 123,
    entretien_assimilation: {
      date_rdv: appointment,
    },
  },
}, "dossier-details");

const extractedDates = Array.from(keyDates
  .filter((item) => item.label === "Entretien d'assimilation")
  .map((item) => item.date));

assert.deepEqual(
  extractedDates,
  ["2026-07-15T06:30:00.000Z"],
  "nested entretien_assimilation.date_rdv should be extracted as the interview appointment date",
);

console.log("injected extractor tests passed");
