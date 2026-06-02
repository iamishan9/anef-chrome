# ANEF Naturalization Tracker

A local-only Chrome Manifest V3 extension for the ANEF portal:

https://administration-etrangers-en-france.interieur.gouv.fr/

## What it does

- Reads ANEF naturalization APIs after you log in.
- Decrypts hidden naturalization status fields that ANEF already decrypts in its own browser app.
- Shows the exact status code, the date ANEF says it changed, and the phase explanation.
- Stores a local history of observed status changes in `chrome.storage.local`.
- Enhances the ANEF page directly, next to the official frise:
  - green date chips for dated steps,
  - yellow highlight for the current status,
  - likely next codes and estimated ranges.
- Exports local history as JSON from the overlay or popup.

## Install locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select this folder:
   `/Users/ishangautam/Documents/ANEF chrome extension`
5. Open ANEF, log in, then go to your naturalization dashboard.

## Privacy model

The extension does not send your dossier data anywhere. It runs only on the official ANEF domain and stores only local summaries: status code, dates, dossier identifiers found in ANEF responses, decree IDs, and observed history.

No ANEF password is stored.

## Estimate sources

The estimate ranges are intentionally conservative. They are seeded from:

- ANEF public app bundle endpoint names and current status enum, inspected on 2026-06-01.
- France Prefecture's ANEF API guide for `dossier_state`, `createdAt`, and `updatedAt` usage.
- Naturalisation-Facile 2026 public status dataset and explanations.
- Public Services+ reports about `CONTROLE_EN_ATTENTE_PEC` delays in May 2026.

These are not official processing commitments.
