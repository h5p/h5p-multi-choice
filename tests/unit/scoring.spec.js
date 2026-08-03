'use strict';

const { expect } = require('chai');
const { resetGlobals, loadScript } = require('../setup/h5p-globals');

/**
 * js/multichoice-scoring.js — additive pure leaf module (no jQuery/DOM/runtime).
 * Extracted parallel to the scoring logic trapped inside `js/multichoice.js`'s
 * `calcScore`/`calculateMaxScore` closures (MC-IMPL-02).
 * Binds to: MC-CON-01 (getMaxScore), MC-CON-02 (calcScore), MC-INV-01 (score clamped to
 * [0, maxScore]).
 */
describe('H5P.MultiChoice.scoring', function () {
  let scoring;

  beforeEach(function () {
    resetGlobals();
    loadScript('js/multichoice-scoring.js');
    scoring = global.H5P.MultiChoice.scoring;
  });

  describe('calculateMaxScore (MC-CON-01)', function () {
    it('sums the weight of every correct answer', function () {
      const answers = [{ correct: true }, { correct: false }, { correct: true, weight: 2 }];
      expect(scoring.calculateMaxScore(answers, 1, false)).to.equal(3);
    });

    it('returns the content weight when a blank submission is correct', function () {
      const answers = [{ correct: false }, { correct: false }];
      expect(scoring.calculateMaxScore(answers, 5, true)).to.equal(5);
    });
  });

  describe('getMaxScore (MC-CON-01)', function () {
    it('collapses to weight for single-answer mode', function () {
      const answers = [{ correct: true, weight: 2 }, { correct: true, weight: 3 }];
      expect(scoring.getMaxScore(answers, 1, true, false, false)).to.equal(1);
    });

    it('collapses to weight for single-point mode', function () {
      const answers = [{ correct: true }, { correct: true }];
      expect(scoring.getMaxScore(answers, 4, false, true, false)).to.equal(4);
    });

    it('sums correct-answer weights otherwise', function () {
      const answers = [{ correct: true }, { correct: true }, { correct: false }];
      expect(scoring.getMaxScore(answers, 1, false, false, false)).to.equal(2);
    });
  });

  describe('calcScore (MC-CON-02, MC-INV-01)', function () {
    const answers = [
      { text: 'A', correct: true },
      { text: 'B', correct: false },
      { text: 'C', correct: true }
    ];

    it('adds weight for each correct pick and subtracts for each incorrect pick', function () {
      expect(scoring.calcScore([0, 1], answers)).to.equal(0); // +1 -1
      expect(scoring.calcScore([0, 2], answers)).to.equal(2); // +1 +1
    });

    it('never goes negative (MC-INV-01)', function () {
      expect(scoring.calcScore([1], answers)).to.equal(0); // -1 clamped to 0
    });

    it('awards the weight when nothing is selected and a blank submission is correct', function () {
      expect(scoring.calcScore([], answers, { blankIsCorrect: true, weight: 1 })).to.equal(1);
    });

    it('collapses to all-or-nothing under singlePoint once passPercentage is met', function () {
      const opts = { singlePoint: true, weight: 5, passPercentage: 100 };
      expect(scoring.calcScore([0, 2], answers, opts)).to.equal(5); // both correct picked → 100%
      expect(scoring.calcScore([0], answers, opts)).to.equal(0);   // only half → below 100%
    });
  });

  describe('calcSingleAnswerScore', function () {
    const answers = [{ correct: true }, { correct: false }];

    it('returns the weight when the chosen answer is correct', function () {
      expect(scoring.calcSingleAnswerScore(0, answers, 1)).to.equal(1);
    });

    it('returns 0 when the chosen answer is wrong', function () {
      expect(scoring.calcSingleAnswerScore(1, answers, 1)).to.equal(0);
    });

    it('returns 0 when nothing is chosen', function () {
      expect(scoring.calcSingleAnswerScore(undefined, answers, 1)).to.equal(0);
    });
  });
});

