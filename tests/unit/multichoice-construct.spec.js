'use strict';

const { expect } = require('chai');
const { resetGlobals, installMultiChoiceStubs, loadScript } = require('../setup/h5p-globals');
const fixtures = require('../fixtures/params');

/**
 * js/multichoice.js — the live constructor, exercised WITHOUT calling
 * `registerDomElements()` (that path is DOM-rendering-heavy and left to e2e per
 * docs/05-adding-a-content-type.md's "DOM-touching logic" tier). What's tested here is
 * everything the constructor computes synchronously at construction time: `getMaxScore`,
 * `getAnswerGiven`, `getCurrentState`, `getScore` (initial state), and `getTitle`.
 *
 * Uses the MultiChoice-specific stubs (`H5P.Question`, `H5P.JoubelUI`,
 * `H5P.shuffleArray`) layered locally in `tests/setup/h5p-globals.js` on top of the
 * shared harness (real jQuery, mock EventDispatcher/Presave).
 *
 * Binds to: MC-CON-01 (getMaxScore, live class), MC-CON-03 (getAnswerGiven, live class).
 */
describe('H5P.MultiChoice (construction-time behaviour)', function () {
  let MultiChoice;

  beforeEach(function () {
    resetGlobals();
    installMultiChoiceStubs();
    loadScript('js/multichoice.js');
    MultiChoice = global.H5P.MultiChoice;
  });

  it('registers H5P.MultiChoice as a constructor extending H5P.Question', function () {
    expect(MultiChoice).to.be.a('function');
    expect(MultiChoice.prototype).to.be.instanceOf(global.H5P.Question);
  });

  describe('getMaxScore (MC-CON-01)', function () {
    it('sums correct-answer weights for multi-answer, non-single-point content', function () {
      const instance = new MultiChoice(fixtures.content.multiAnswer(), 1, {});
      // multi-answer.json: 2 correct answers (Red, Blue), weight defaults to 1 each.
      expect(instance.getMaxScore()).to.equal(2);
    });

    it("collapses to weight for behaviour.type === 'single'", function () {
      const instance = new MultiChoice(fixtures.content.singleAnswer(), 1, {});
      expect(instance.getMaxScore()).to.equal(1);
    });

    it('collapses to weight when behaviour.singlePoint is true', function () {
      const params = fixtures.content.multiAnswer();
      params.behaviour.singlePoint = true;
      const instance = new MultiChoice(params, 1, {});
      expect(instance.getMaxScore()).to.equal(1);
    });
  });

  describe('getAnswerGiven (MC-CON-03)', function () {
    it('is false before any interaction and no previous state', function () {
      const instance = new MultiChoice(fixtures.content.multiAnswer(), 1, {});
      expect(instance.getAnswerGiven()).to.equal(false);
    });

    it('is true when a previous state restored user answers', function () {
      const instance = new MultiChoice(
        fixtures.content.multiAnswer(),
        1,
        { previousState: { answers: [0] } }
      );
      expect(instance.getAnswerGiven()).to.equal(true);
    });
  });

  describe('getCurrentState', function () {
    it('reflects userAnswers restored from a previous state (no shuffling)', function () {
      const instance = new MultiChoice(
        fixtures.content.multiAnswer(),
        1,
        { previousState: { answers: [0, 2] } }
      );
      expect(instance.getCurrentState()).to.deep.equal({ answers: [0, 2] });
    });

    it('defaults to an empty answers list with no previous state', function () {
      const instance = new MultiChoice(fixtures.content.multiAnswer(), 1, {});
      expect(instance.getCurrentState()).to.deep.equal({ answers: [] });
    });
  });

  describe('getScore (initial state)', function () {
    it('is 0 with no previous state', function () {
      const instance = new MultiChoice(fixtures.content.multiAnswer(), 1, {});
      expect(instance.getScore()).to.equal(0);
    });

    it('is computed from a restored previous state', function () {
      // Red (index 0) and Blue (index 2) are both correct in multi-answer.json.
      const instance = new MultiChoice(
        fixtures.content.multiAnswer(),
        1,
        { previousState: { answers: [0, 2] } }
      );
      expect(instance.getScore()).to.equal(2);
    });
  });

  describe('getTitle', function () {
    it('falls back to "Multiple Choice" without metadata', function () {
      const instance = new MultiChoice(fixtures.content.multiAnswer(), 1, {});
      expect(instance.getTitle()).to.equal('Multiple Choice');
    });

    it('uses contentData.metadata.title when present', function () {
      const instance = new MultiChoice(
        fixtures.content.multiAnswer(),
        1,
        { metadata: { title: 'Colours Quiz' } }
      );
      expect(instance.getTitle()).to.equal('Colours Quiz');
    });
  });
});

