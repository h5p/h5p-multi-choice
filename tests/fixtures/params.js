'use strict';

/**
 * Fixture accessors for MultiChoice unit specs.
 *
 * There is no upstream sample `.h5p` package for MultiChoice in this workspace (unlike
 * TrueFalse's extracted `tf_*.h5p` fixtures), so `content/*.json` are hand-authored,
 * complete param shapes matching the current `semantics.json` (see
 * `docs/06-gotchas-and-field-notes.md` for the note). `versions/*.json` are frozen
 * pre-migration snapshots — one per exercised `upgrades.js` step — and must never be
 * edited once a test binds to them; add a new file for a new version instead.
 */

const multiAnswer = require('./content/multi-answer.json');
const singleAnswer = require('./content/single-answer.json');
const version1_1 = require('./versions/1_1.json');
const version1_3 = require('./versions/1_3.json');
const version1_4 = require('./versions/1_4.json');
const version1_5 = require('./versions/1_5.json');
const version1_9 = require('./versions/1_9.json');
const version1_9b = require('./versions/1_9b.json');
const version1_12 = require('./versions/1_12.json');
const version1_13 = require('./versions/1_13.json');

/** Deep clone so specs can mutate a fixture without leaking into other tests. */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Minimal, declarative content for a single behaviour under test (presave shape:
 * top-level `answers`/`behaviour`, no `contentId`/`contentData` wrapper).
 * @param {object} [overrides]
 */
function makeContent(overrides) {
  return Object.assign({
    question: '<p>Unit test question?</p>',
    answers: [
      { text: 'A', correct: true },
      { text: 'B', correct: false }
    ],
    behaviour: {}
  }, overrides || {});
}

module.exports = {
  clone,
  makeContent,

  // Real, complete content fixtures.
  content: {
    multiAnswer: function () { return clone(multiAnswer); },
    singleAnswer: function () { return clone(singleAnswer); }
  },

  // Frozen per-version inputs for the upgrade scripts. Never mutate the source files;
  // clone() protects specs from cross-test leakage.
  versions: {
    v1_1: function () { return clone(version1_1); },
    v1_3: function () { return clone(version1_3); },
    v1_4: function () { return clone(version1_4); },
    v1_5: function () { return clone(version1_5); },
    v1_9: function () { return clone(version1_9); },
    v1_9b: function () { return clone(version1_9b); },
    v1_12: function () { return clone(version1_12); },
    v1_13: function () { return clone(version1_13); }
  },

  /**
   * Canonical fixtures referenced by durable invariant/contract expectations in
   * behavior_spec.md. Named so every test tier can bind to identical data.
   */
  canonical: {
    twoCorrectOfThree: function () {
      return makeContent({
        answers: [
          { text: 'A', correct: true },
          { text: 'B', correct: true },
          { text: 'C', correct: false }
        ]
      });
    },
    noneCorrect: function () {
      return makeContent({
        answers: [
          { text: 'A', correct: false },
          { text: 'B', correct: false }
        ]
      });
    },
    singlePoint: function () {
      return makeContent({
        answers: [
          { text: 'A', correct: true },
          { text: 'B', correct: true }
        ],
        behaviour: { singlePoint: true }
      });
    },
    singleAnswerType: function () {
      return makeContent({
        answers: [
          { text: 'A', correct: true },
          { text: 'B', correct: false }
        ],
        behaviour: { type: 'single' }
      });
    }
  }
};

