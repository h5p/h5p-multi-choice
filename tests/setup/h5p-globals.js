'use strict';

/**
 * MultiChoice Tier-2 test setup.
 *
 * The generic ~80% of this harness lives in the shared `h5p-js-testing-shared` package
 * and is consumed from its root export (jsdom registration, real-jQuery wiring,
 * `resetGlobals()` namespace scaffold, `loadScript()`, and the generic
 * `EventDispatcher`/`Presave` mocks). See `libraries/h5p-js-testing-shared/AGENTS.md`.
 *
 * What stays here is ONLY the MultiChoice-specific collaborator stubs layered on top of
 * the shared core:
 *
 *  - `H5P.Question` — the base class `H5P.MultiChoice.call(self, ...)` is chained onto
 *    (`self.registerDomElements`, `self.setIntroduction`, `self.setContent`,
 *    `self.addButton`/`showButton`/`hideButton`, `self.setFeedback`,
 *    `self.updateFeedbackContent`, `self.removeFeedback`, `self.read`,
 *    `self.createXAPIEventTemplate`, `self.triggerXAPI`, `self.setImage`/`setVideo`/
 *    `setAudio`, `self.isRoot`, `self.getMaxScore`), plus the STATIC members
 *    `H5P.Question.determineOverallFeedback` and `H5P.Question.ScorePoints` that
 *    `js/multichoice.js` reads directly off the constructor (not the instance).
 *  - `H5P.JoubelUI` — a runtime UI-component factory `js/multichoice.js` depends on via
 *    its `H5P.Question` base (buttons/confirmation dialogs); stubbed minimally so
 *    loading the script never throws, even though most unit specs never reach the DOM
 *    rendering path (`registerDomElements`) that would exercise it.
 *  - `H5P.shuffleArray` — used only when `behaviour.randomAnswers` is true.
 *
 * `H5P.MultiChoice` itself is NOT pre-stubbed — `js/multichoice.js` defines it when
 * loaded; each spec calls `loadScript('js/multichoice.js')` and reads the result off
 * `global.H5P.MultiChoice`.
 */

const path = require('path');
const { createHarness } = require('h5p-js-testing-shared');

// libraries/H5P.MultiChoice-1.16 — the root `loadScript` resolves relative paths against.
const LIB_ROOT = path.resolve(__dirname, '..', '..');

// Bind the shared harness to this library. This registers jsdom, wires real jQuery, and
// provides `resetGlobals` (mock EventDispatcher/Presave) + `loadScript`.
const harness = createHarness(LIB_ROOT);
const { jQuery, resetGlobals, loadScript } = harness;

/**
 * Minimal `H5P.Question` base class stand-in.
 *
 * Faithful enough for unit specs that construct `H5P.MultiChoice` and call methods that
 * don't require a real render (`getMaxScore`, `getScore`, `getAnswerGiven`,
 * `getCurrentState`, `getXAPIData`, `resetTask` after a manual `registerDomElements`).
 * DOM-heavy assertions (actual button/answer markup) are left to e2e — see
 * `tests/behavior_spec.md`.
 */
function installQuestionStub() {
  global.H5P.Question = function Question(type, options) {
    this.type = type;
    this.options = options;
  };

  const proto = global.H5P.Question.prototype;
  proto.setIntroduction = function () { return this; };
  proto.setContent = function () { return this; };
  proto.setImage = function () { return this; };
  proto.setVideo = function () { return this; };
  proto.setAudio = function () { return this; };
  proto.addButton = function () { return this; };
  proto.showButton = function () { return this; };
  proto.hideButton = function () { return this; };
  proto.setFeedback = function () { return this; };
  proto.updateFeedbackContent = function () { return this; };
  proto.removeFeedback = function () { return this; };
  proto.read = function () { return this; };
  proto.isRoot = function () { return true; };
  proto.triggerXAPI = function () { return this; };
  proto.createXAPIEventTemplate = function () {
    return {
      data: { statement: { result: {} } },
      getVerifiedStatementValue: function (path) {
        let obj = this.data.statement;
        path.forEach(function (key) {
          obj[key] = obj[key] || {};
          obj = obj[key];
        });
        return obj;
      },
      setScoredResult: function (score, max, instance, compound, success) {
        this.data.statement.result = { score: { raw: score, max: max, scaled: max ? score / max : 0 }, success: success };
      }
    };
  };
  // trigger()/on()/off() are shared by EventDispatcher; H5P.Question extends it in the
  // real core. Layer the same shared mock onto the prototype chain so `self.trigger(...)`
  // (used for the 'resize' event) works without a separate stub.
  const EventDispatcher = global.H5P.EventDispatcher;
  const ed = new EventDispatcher();
  proto.trigger = ed.trigger.bind(ed);
  proto.on = ed.on.bind(ed);
  proto.off = ed.off.bind(ed);

  // Static members read directly off `H5P.Question` (not the instance).
  global.H5P.Question.determineOverallFeedback = function (overallFeedback, ratio) {
    const percentage = Math.round(ratio * 100);
    const match = (overallFeedback || []).find(function (range) {
      return percentage >= range.from && percentage <= range.to;
    });
    return (match && match.feedback) || '';
  };
  global.H5P.Question.ScorePoints = function ScorePoints() {
    this.getElement = function (isCorrect) {
      return global.H5P.jQuery('<span>', { 'class': isCorrect ? 'h5p-question-plus-one-container' : 'h5p-question-minus-one-container' });
    };
  };

  return global.H5P.Question;
}

/** Minimal `H5P.JoubelUI` stand-in — only enough for load-time reference, not full behaviour. */
function installJoubelUIStub() {
  global.H5P.JoubelUI = {
    createButton: function (options) { return global.H5P.jQuery('<button>', options); }
  };
  return global.H5P.JoubelUI;
}

/** `H5P.shuffleArray` — identity by default; specs that need shuffling can override. */
function installShuffleArrayStub() {
  global.H5P.shuffleArray = function (array) { return array.slice(); };
  return global.H5P.shuffleArray;
}

/**
 * Install every MultiChoice-specific stub the runtime file (`js/multichoice.js`) reads
 * at load/construction time. Call before `loadScript('js/multichoice.js')`.
 */
function installMultiChoiceStubs() {
  installQuestionStub();
  installJoubelUIStub();
  installShuffleArrayStub();
}

// Establish base globals immediately so simply requiring the setup is enough.
resetGlobals();

module.exports = {
  jQuery,
  LIB_ROOT,
  resetGlobals,
  loadScript,
  installQuestionStub,
  installJoubelUIStub,
  installShuffleArrayStub,
  installMultiChoiceStubs
};

