# Behavior Spec — H5P.MultiChoice

**Purpose.** This is the *durable* specification of what H5P.MultiChoice must do,
stated — wherever possible — at a boundary that survives reimplementation (jQuery →
web components → whatever comes next). The actual unit/integration/e2e tests are
**disposable bindings** to these expectations. When the implementation is rewritten, keep
this file, delete the coupled tests, and regenerate tests from the still-valid entries.

This file is the single source of "what must remain true" for the library, shared
across all test types. It is not a test file and runs nothing itself.

> Structure copied from `H5P.TrueFalse-1.8/tests/behavior_spec.md` (the canonical
> template) per `libraries/h5p-js-testing-shared/docs/05-adding-a-content-type.md`.

## Durability tiers (legend)

Order = most durable (survives full rewrite) → least (dies with the implementation).

| Tier | Meaning | Preferred test mechanic |
|---|---|---|
| `Invariant` | Property that holds for *any* implementation, any language. | property-based (fast-check) / assertion |
| `Contract` | Shape/behavior crossing a boundary H5P or the platform defines (H5P content-type contract, xAPI, semantics/params). | contract test / e2e |
| `Property` | Behavioral property across generated inputs (idempotence, inverse, round-trip). | property-based |
| `E2E-behavioral` | Observable output of the running content type given input. | playwright e2e / vdiff |
| `Impl-detail` | Coupled to current code structure; **expected to be discarded on rewrite.** | unit |

Each expectation records: **ID · statement · tier · current binding (test) · notes.**
`Current binding` may be `none (unverified)` until a test exists.

> **Execution context ≠ durability tier.** A `Contract` proven only against a **mock**
> of an H5P-internal collaborator (`H5PEditor.Presave`, `H5P.EventDispatcher`) is only
> *fully* honored once an integration binding exercises the real implementation. Rows
> below note this explicitly.

---

## Canonical fixtures (durable data)

No upstream sample `.h5p` package for MultiChoice exists in this workspace (unlike
TrueFalse's extracted `tf_*.h5p` files), so the "real, complete" fixtures below are
hand-authored to match the current `semantics.json` shape rather than extracted from a
package — see `docs/06-gotchas-and-field-notes.md`.

| Fixture | Purpose | Bound expectations |
|---|---|---|
| `tests/fixtures/content/multi-answer.json` | Complete params, checkbox (multi) mode, tips + per-answer feedback + overall feedback. | MC-E2E (future) |
| `tests/fixtures/content/single-answer.json` | Complete params, radio (single) mode. | MC-E2E (future) |
| `tests/fixtures/versions/1_1.json` … `1_13.json` | Frozen pre-migration snapshots, one per exercised `upgrades.js` step. | MC-UPG-01..07 |
| `params.canonical.twoCorrectOfThree() / noneCorrect() / singlePoint() / singleAnswerType()` (`tests/fixtures/params.js`) | Minimal presave/scoring oracles. | MC-DATA-01/02, MC-IMPL-01 |

New library versions add a new `versions/1_<minor>.json` snapshot; never edit older ones.

---

## Contracts — H5P content-type contract
See h5p.org/documentation/developers/contracts. These survive any UI rewrite.

| ID | Statement | Tier | Current binding | Notes |
|---|---|---|---|---|
| MC-CON-01 | `getMaxScore()` returns `weight` for single-answer/single-point configurations, else the sum of correct-answer weights. | Contract | `tests/unit/scoring.spec.js` (`getMaxScore`/`calculateMaxScore`) | Extracted into the additive `H5P.MultiChoice.scoring` leaf (parallels the inline logic; the shipped `js/multichoice.js` still owns the live behaviour — full contract needs e2e). |
| MC-CON-02 | `getScore()` for multi-answer mode is `Σ(correct picked) − Σ(incorrect picked)`, clamped to `[0, maxScore]`. | Contract | `tests/unit/scoring.spec.js` (`calcScore`) | Leaf-module binding; e2e still needed for the live class. |
| MC-CON-03 | `getAnswerGiven()` is false before any selection, true after (or always true when a blank submission is the correct answer). | Contract | none | Needs main class → e2e. |
| MC-CON-04 | `getCurrentState()` returns `{answers: number[]}` (original-order indices even under shuffling); restoring it reproduces that selection. | Contract | none | Needs main class → e2e. |
| MC-CON-05 | `resetTask()` returns the instance to the initial no-answer state. | Contract | none | Needs main class → e2e. |
| MC-CON-06 | `showSolutions()` marks every correct option regardless of the user's selection. | Contract | none | Observable via DOM/e2e. |

## Contracts — xAPI
| ID | Statement | Tier | Current binding | Notes |
|---|---|---|---|---|
| MC-XAPI-01 | An `answered` statement is produced with `interactionType: 'choice'`. | Contract | none | Needs main class → e2e. |
| MC-XAPI-02 | `correctResponsesPattern` lists the `originalOrder` of every correct answer. | Contract | none | Needs main class → e2e. |
| MC-XAPI-03 | `result.response` lists the user's chosen answer id(s); `result.success` reflects `passPercentage`. | Contract | none | Needs main class → e2e. |

## Contracts — data (semantics / upgrades / presave)
| ID | Statement | Tier | Current binding | Notes |
|---|---|---|---|---|
| MC-DATA-01 | Presave yields `{maxScore: N}` where `N = max(correctAnswerCount, 1)` for non-single-point content (note: yields `1`, not `0`, even when **no** answer is marked correct — a documented quirk, not a bug fix target here). | Contract | `tests/unit/presave.spec.js` (vs. **mock**) | Fixture: `params.canonical.twoCorrectOfThree()` / `noneCorrect()`. Mock-only; no integration binding yet (see MC-DATA-04). |
| MC-DATA-02 | Presave yields `{maxScore: 1}` when `behaviour.singlePoint === true` OR `behaviour.type === 'single'`. | Contract | `tests/unit/presave.spec.js` (vs. **mock**) | Fixture: `params.canonical.singlePoint()` / `singleAnswerType()`. |
| MC-DATA-03 | Presave throws `InvalidContentSemanticsException` when `answers` is missing or not an array. | Contract | `tests/unit/presave.spec.js` (vs. **mock**) + `tests/integration/presave-real.spec.js` (vs. **real**) | The integration binding pins the real-core exception shape (`.code === 'H5P-P500'`); the mock hardcodes `.name`. |
| MC-DATA-04 | Presave calls `H5PEditor.Presave.validateScore(score)`, which must accept the computed score. | Contract | `tests/unit/presave.spec.js` (implicit — no throw on valid content) | The mock's `validateScore` was **grown in `h5p-js-testing-shared`** (it previously lacked this member — TrueFalse's `presave.js` never called it) with a parity-checked contract addition; MultiChoice is the second content type to exercise this shared surface. |
| MC-UPG-01 | Upgrade 1.1 moves flat behavioural keys (`tryAgain`, `enableSolutionsButton`, `singleAnswer`, `singlePoint`, `randomAnswers`, `showSolutionsRequiresInput`) into `behaviour`, defaulting each to `true` when absent, and sets `UI.checkAnswerButton = 'Check'`. | Contract | `tests/unit/upgrades.spec.js` | Fixture: `versions/1_1.json`. |
| MC-UPG-02 | Upgrade 1.3 moves each answer's flat `tip`/`chosenFeedback`/`notChosenFeedback` into `answer.tipsAndFeedback`, defaulting missing fields to `''`. | Contract | `tests/unit/upgrades.spec.js` | Fixture: `versions/1_3.json`. |
| MC-UPG-03 | Upgrade 1.4 derives `behaviour.type` (`'auto'`\|`'single'`\|`'multi'`) from `behaviour.singleAnswer` and the count of correct answers, then deletes `behaviour.singleAnswer`. | Contract | `tests/unit/upgrades.spec.js` | Fixture: `versions/1_4.json` (+ inline variant for the non-singleAnswer branch). |
| MC-UPG-04 | Upgrade 1.5 wraps a legacy `image` into `media = {library: 'H5P.Image 1.0', params: {file: image}}` and deletes `image`. | Contract | `tests/unit/upgrades.spec.js` | Fixture: `versions/1_5.json`. |
| MC-UPG-05 | Upgrade 1.10 derives `overallFeedback` ranges from whichever of `UI.correctText`/`almostText`/`wrongText`/`feedback` are present, and deletes those UI keys. | Contract | `tests/unit/upgrades.spec.js` | Fixtures: `versions/1_9.json` (all three specified), `1_9b.json` (only generic `feedback`). |
| MC-UPG-06 | Upgrade 1.13 sets `extras.metadata.title` from `question` (HTML stripped), falling back to an existing title or `'Multiple Choice'`. | Contract | `tests/unit/upgrades.spec.js` | Fixture: `versions/1_12.json`. |
| MC-UPG-07 | Upgrade 1.14 wraps a legacy `media` value into `{type: media, disableImageZooming}`, sourcing `disableImageZooming` from `behaviour` (default `false`) and deleting it from `behaviour`. | Contract | `tests/unit/upgrades.spec.js` | Fixture: `versions/1_13.json`. |

## Invariants
| ID | Statement | Tier | Current binding | Notes |
|---|---|---|---|---|
| MC-INV-01 | Score is always within `[0, getMaxScore()]`. | Invariant | `tests/unit/scoring.spec.js` (`calcScore` clamps negative totals to 0) | Full invariant (incl. the live class) is e2e. |
| MC-INV-02 | In single-answer mode, selecting one option always deselects any previously-selected option (mutual exclusion). | Invariant | none | Needs main class → e2e (trapped in `registerDomElements`'s click handler; see MC-IMPL-02). |

## Properties
| ID | Statement | Tier | Current binding | Notes |
|---|---|---|---|---|
| MC-PROP-01 | State round-trip is lossless: `restore(getCurrentState())` reproduces the same `getScore()`, including under `randomAnswers` shuffling. | Property | none | Needs main class → e2e/property. |
| MC-PROP-02 | `resetTask()` is idempotent. | Property | none | Needs main class → e2e/property. |

## E2E / observable behavior
| ID | Statement | Tier | Current binding | Notes |
|---|---|---|---|---|
| MC-E2E-01 | Checkbox (multi) mode: checking/unchecking answers updates score and re-enables the Check button. | E2E-behavioral | none | Not yet built for this type. |
| MC-E2E-02 | Radio (single) mode: selecting a new option deselects the previous one, keyboard arrows move focus/selection. | E2E-behavioral | none | Not yet built for this type. |
| MC-E2E-03 | `showAllSolutions()` marks every correct/incorrect option and disables further input. | E2E-behavioral | none | Not yet built for this type. |

## Implementation details (disposable — expected to die on rewrite)
Kept only so the current coupled unit tests trace to *something*; do not promote these.

| ID | Statement | Tier | Current binding | Notes |
|---|---|---|---|---|
| MC-IMPL-01 | `Math.max(correctAnswers.length, 1)` in `presave.js` never yields `0`, even for zero correct answers. | Impl-detail | `tests/unit/presave.spec.js` | Documented quirk (MC-DATA-01); not "fixed" here — out of scope for a test-coverage change. |
| MC-IMPL-02 | Scoring (`calcScore`/`calculateMaxScore`) is trapped inside `js/multichoice.js`'s closures, invoked from DOM click handlers. | Impl-detail | extracted (parallel, not wired) to `js/multichoice-scoring.js` / `H5P.MultiChoice.scoring`, tested in `tests/unit/scoring.spec.js` | Additive leaf — assigns onto the existing `H5P.MultiChoice` namespace, added to `library.json`'s `preloadedJs` after the main script; does not change the shipped class's runtime behaviour (same pattern as `H5P.TrueFalse.scoring`). |
| MC-IMPL-03 | Global-IIFE loads against `H5P.jQuery`/`H5P.Question`/`H5P.JoubelUI`/`H5P.shuffleArray`/`H5P.EventDispatcher`. | Impl-detail | harness `tests/setup/h5p-globals.js` | Dies when moving off globals/jQuery. `H5P.Question`/`H5P.JoubelUI`/`H5P.shuffleArray` are MultiChoice-specific additions over TrueFalse's stub set. |

---

## Maintenance rule
When you add or change a test, add/append the matching expectation here and set its
`Current binding`. When promoting logic to a more durable boundary (e.g. fully wiring
`js/multichoice.js` to consume `H5P.MultiChoice.scoring`, or moving to web components),
re-tier the affected entries and drop the `Impl-detail` rows that no longer apply.

When a `Contract` is proven only against a **mock** of an H5P collaborator, note the mock
in its binding and treat an **integration/parity** binding against the real
implementation as outstanding. MC-DATA-03 carries that integration binding
(`tests/integration/presave-real.spec.js`); the generic mock↔real parity of the shared
`EventDispatcher`/`Presave` stubs (including the `validateScore` member grown for this
type) is validated centrally in the `h5p-js-testing-shared` package, so this content type
trusts it rather than re-proving it.

