# Recover Well

Recover Well is a React web-app prototype for organizing general post-surgery recovery information. It brings together a sample daily checklist, procedure-planning prompts, medication-list review, and patient-controlled drafts to help prepare for a care conversation.

> **Prototype only:** Recover Well is not a medical device, clinical decision-support system, patient portal, or medical record. It does not provide diagnosis or treatment recommendations. Do not use it to make care decisions, communicate emergencies, or store real patient information. Follow instructions from the treating care team. For emergencies, contact your local emergency number.

## Product specification

### Intended users and goal

- **Patients and caregivers:** organize recovery tasks, procedure details, symptoms, and questions to discuss with the care team.
- **Goal:** make general recovery information and conversation-preparation tools easy to find in one interface, while directing users to their care team for individualized guidance.

### Current features

- **Demo profiles:** create a display-name profile and sign in or switch between profiles during one open session. This is not real sign-up or authentication; there are no passwords, accounts, or server-side identity checks.
- **Optional saving on this device:** a "Save my demo profiles on this device" checkbox (off by default) keeps profiles in this browser's `localStorage` so they survive a reload. Turning it off erases the saved copy, and "Erase all demo profiles" clears the page and the device. Saved data is unencrypted and visible to anyone using the same browser.
- **Home and recovery checklist:** show a sample recovery overview and let users check off example daily tasks.
- **Personal reminders:** add or remove optional daily-plan and self-care reminders for each demo profile. These are user-created organizers, not care instructions.
- **Procedure planning:** select from sample service lines and procedures, enter a date and arrival details, and check off general discussion prompts.
- **Procedure-relevant ICU and recovery modules:** selecting a surgical service and procedure displays related general discussion topics for ICU care and recovery. Topics are prompts to confirm with the care team, not care instructions.
- **Postoperative destination overview:** shows broad examples of when home, a hospital ward, or ICU/monitored care may be part of a planned pathway for the selected procedure. These are not rules or predictions; procedure approach, the person’s health and recovery, local resources, and clinician assessment determine the actual destination.
- **Anesthesia education:** a separate overview of general, regional, local, sedation/monitored anesthesia care, and combined approaches, with possible short-term effects, recovery expectations, questions for the anesthesia team, and links to American Society of Anesthesiologists resources. It does not infer which type a selected procedure will use.
- **Health-history checklist:** optionally note reported health conditions in the active demo profile. It is not exhaustive and does not calculate risk or guide treatment.
- **Recovery information:** browse general recovery stages, procedure categories, and ICU-care topics.
- **Medication review:** maintain a separate in-memory reported medicine list for each demo profile, search that list, and see a small set of hard-coded interaction prompts. No health conditions are inferred between profiles.
- **Medication reference and dual-availability guide:** medicines are listed as Prescription or Over the counter. Searching a medicine looks up names in RxNorm (U.S. National Library of Medicine) and marks each result Prescription or Over the counter using FDA drug labeling (openFDA), falling back to a built-in reference list; search text is sent to those public APIs. RxNorm results are not a separate group. Ten medicines sold both ways (e.g. ibuprofen, naproxen, omeprazole) have a separate dataset (`src/dualAvailabilityMedications.js`) comparing OTC and prescription strengths and directions, paraphrased from FDA labeling with DailyMed links. The interaction check screens by ingredient and class, and flags medicines it cannot screen. Not a dosing or interaction authority; the dosing text has not had clinician or pharmacist review.
- **Care-visit preparation:** draft a summary of user-entered symptoms and questions. It is an editable personal draft, not a clinical assessment or record.
- **General health tips:** optional whole-person well-being ideas covering nourishment, movement, rest, emotional well-being, social support, and complementary-product safety, with source links to WHO and NCCIH.
- **Care-team message preparation:** create a message draft to copy into a separate, secure channel. The app does not send it.
- **Health reference:** a searchable, filterable (with session-only saved topics, copy, print, and care-team questions), paraphrased set of general medical and nursing education topics with named sources; not clinically reviewed and not a diagnosis or triage tool.
- **Emergency reminders:** display emergency guidance for urgent situations.

### Data handling and limitations

- Each demo profile has separate in-memory daily and procedure checklist state, procedure-planning fields including the anesthesia education selection, health-history notes, self-care check-in and notes, saved dated check-ins shown on a calendar and optional general wellness suggestions derived from the entered values (not medical advice, not exported, hideable) (user-entered values only, no interpretation), personal reminders, and medication list. Visit-preparation drafts are also held in page memory and are cleared when switching profiles. Profile data is never saved to an account or database. By default it is not saved to browser storage either, and reloading or leaving the page clears all profiles and their data. If the person turns on saving, profiles are written unencrypted to this browser's `localStorage` (key `recover-well:saved-profiles`) until saving is turned off or the profiles are erased. Profiles are not private or protected from other people using the same open browser tab.
- The visit-preparation tool can copy a generated draft, download it as a text file, or open the browser print dialog only when the user selects the corresponding action. Review exported content before sharing; the app does not send or save the draft.
- The app has no backend, authorization, verified authentication, encryption-at-rest, audit logging, role management, or secure messaging integration.
- Use a non-identifying display name only. Do not enter real names, contact details, dates of birth, patient identifiers, or protected health information anywhere in the prototype.
- The medication rules cover only selected combinations and factors. A lack of displayed warnings does not mean a medication combination is safe. Verify the complete medication list with a pharmacist or prescriber.
- The recovery, ICU, procedure-route, and anesthesia content is general and incomplete. The destination examples do not determine or predict discharge readiness, and anesthesia selection is only an education filter—not a record of the planned anesthetic. Self-care entries are user-reported and are not interpreted as a health assessment. Nothing in the app determines risk, discharge readiness, or treatment. Follow instructions from the care team.
- Postanesthesia care and anesthesia education links: [ASA Standards for Postanesthesia Care](https://www.asahq.org/standards-and-practice-parameters/standards-for-postanesthesia-care), [ASA Types of Anesthesia](https://madeforthismoment.asahq.org/anesthesia-101/types-of-anesthesia/), and [ASA Anesthesia Recovery](https://madeforthismoment.asahq.org/preparing-for-surgery/recovery/). Local pathways and individual instructions may differ.
- General health tips are educational, not personalized advice; the linked source pages were last checked on 20 October 2026. Follow professional guidance for individual needs.

## Technology

- React 18
- Vite
- Vitest, jsdom, and Testing Library

## Run locally

Install dependencies and start the development server:

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## CI and deployment

The [CI and deploy workflow](./.github/workflows/ci-deploy.yml) runs tests, lint, and a
production build for pull requests and pushes. Pushes to `main` also deploy the `dist/` output to
GitHub Pages at the repository path. GitHub Pages must be enabled with **GitHub Actions** as its
source in the repository settings.

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Vite development server on port 3000. |
| `npm test -- --run` | Run the Vitest suite once (non-interactive). |
| `npm test` | Start Vitest in watch mode. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Serve the production build locally for preview. |

## Project layout

```text
src/
  index.jsx                      App entry point
  App.jsx                        Main app, navigation, recovery and procedure-planning views
  Pharmacy.jsx                   Medication list, interaction screening, medication search
  DualAvailabilityGuide.jsx      OTC-vs-Rx comparison cards (unreviewed educational content)
  CareSupport.jsx                Emergency reminders and care-visit preparation
  SelfCare.jsx                   Optional patient-reported check-in and planning prompts
  HealthReference.jsx            Plain-language health topic reference
  profileStorage.js              Opt-in localStorage saving for demo profiles
  rxnormSearch.js                NLM RxNorm and openFDA lookups (with built-in fallback)
  medicationFormulary.js         Built-in medication list
  medicationStrengths.js         Strength options per medication
  medicationInteractions.js      Selected interaction and factor rules
  dualAvailabilityMedications.js Data for the OTC-vs-Rx guide
  healthReferenceData.js         Data for the health reference
  App.css, index.css             Styles
  setupTests.js, reportWebVitals.js
  *.test.jsx                     Component and interaction tests
public/                          Static assets (app icons and web manifest)
.github/workflows/ci-deploy.yml  Test, lint, build, and GitHub Pages deploy
RecoverWell.code-workspace       VS Code workspace file
```

## Before production use

This prototype is not ready for real patient or clinical use. A production implementation would need, at minimum, a defined clinical and privacy scope; clinically reviewed content and medication logic; a secure backend and verified identity/authorization model; explicit consent, retention, deletion, and audit policies; secure communication and care-record integrations; accessibility and security reviews; and validation with intended users and qualified clinical stakeholders. Applicable legal, regulatory, and organizational requirements must be assessed before collecting health information or deploying in a care setting.
