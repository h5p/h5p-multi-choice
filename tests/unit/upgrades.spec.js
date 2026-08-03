'use strict';

const { expect } = require('chai');
const { resetGlobals, loadScript } = require('../setup/h5p-globals');
const fixtures = require('../fixtures/params');

/**
 * upgrades.js — pure param transforms. No jQuery / DOM.
 * Binds to: MC-UPG-01..07. Versioned inputs come from tests/fixtures/versions/*.json.
 */
describe('upgrades.js', function () {
  let upgrades;

  beforeEach(function () {
    resetGlobals();
    loadScript('upgrades.js');
    upgrades = global.H5PUpgrades['H5P.MultiChoice'];
  });

  it('registers the H5P.MultiChoice upgrade map', function () {
    expect(upgrades).to.be.an('object');
    expect(upgrades[1][1].contentUpgrade).to.be.a('function');
    expect(upgrades[1][3].contentUpgrade).to.be.a('function');
    expect(upgrades[1][4]).to.be.a('function');
    expect(upgrades[1][5]).to.be.a('function');
    expect(upgrades[1][10]).to.be.a('function');
    expect(upgrades[1][13]).to.be.a('function');
    expect(upgrades[1][14]).to.be.a('function');
  });

  describe('1.1 — flat behavioural keys move into behaviour (MC-UPG-01)', function () {
    it('moves tryAgain/enableSolutionsButton/singleAnswer/singlePoint/randomAnswers/showSolutionsRequiresInput into behaviour and sets UI.checkAnswerButton', function () {
      const params = fixtures.versions.v1_1();
      let result;

      upgrades[1][1].contentUpgrade(params, function (err, outParams) {
        result = outParams;
      });

      expect(result.behaviour).to.deep.equal({
        enableRetry: false,
        enableSolutionsButton: false,
        singleAnswer: false,
        singlePoint: false,
        randomAnswers: false,
        showSolutionsRequiresInput: false
      });
      expect(result.UI.checkAnswerButton).to.equal('Check');
      expect(result).to.not.have.property('tryAgain');
      expect(result).to.not.have.property('enableSolutionsButton');
      expect(result).to.not.have.property('singleAnswer');
      expect(result).to.not.have.property('singlePoint');
      expect(result).to.not.have.property('randomAnswers');
      expect(result).to.not.have.property('showSolutionsRequiresInput');
    });

    it('defaults every flat key to true when absent', function () {
      const params = { answers: [] };
      let result;

      upgrades[1][1].contentUpgrade(params, function (err, outParams) {
        result = outParams;
      });

      expect(result.behaviour).to.deep.equal({
        enableRetry: true,
        enableSolutionsButton: true,
        singleAnswer: true,
        singlePoint: true,
        randomAnswers: true,
        showSolutionsRequiresInput: true
      });
    });
  });

  describe('1.3 — per-answer tip/feedback move into tipsAndFeedback (MC-UPG-02)', function () {
    it('moves tip/chosenFeedback/notChosenFeedback and defaults missing ones to empty strings', function () {
      const params = fixtures.versions.v1_3();
      let result;

      upgrades[1][3].contentUpgrade(params, function (err, outParams) {
        result = outParams;
      });

      expect(result.answers[0].tipsAndFeedback).to.deep.equal({
        tip: 'Think produce aisle.',
        chosenFeedback: 'Correct!',
        notChosenFeedback: 'You missed the apple.'
      });
      expect(result.answers[0]).to.not.have.property('tip');
      expect(result.answers[0]).to.not.have.property('chosenFeedback');
      expect(result.answers[0]).to.not.have.property('notChosenFeedback');

      // Carrot had none of the flat fields — everything defaults to ''.
      expect(result.answers[1].tipsAndFeedback).to.deep.equal({
        tip: '',
        chosenFeedback: '',
        notChosenFeedback: ''
      });
    });
  });

  describe('1.4 — derive behaviour.type from singleAnswer + correct count (MC-UPG-03)', function () {
    it("sets type 'auto' when behaviour.singleAnswer is true and exactly one answer is correct", function () {
      const params = fixtures.versions.v1_4(); // singleAnswer: true, 1 correct of 3
      let result;

      upgrades[1][4](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.behaviour.type).to.equal('auto');
      expect(result.behaviour).to.not.have.property('singleAnswer');
    });

    it("sets type 'single' when behaviour.singleAnswer is true but more than one answer is correct", function () {
      const params = {
        answers: [{ correct: true }, { correct: true }],
        behaviour: { singleAnswer: true }
      };
      let result;

      upgrades[1][4](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.behaviour.type).to.equal('single');
    });

    it("sets type 'multi' when behaviour.singleAnswer is false and not exactly-one-correct", function () {
      const params = {
        answers: [{ correct: true }, { correct: false }, { correct: false }],
        behaviour: { singleAnswer: false }
      };
      let result;

      upgrades[1][4](params, function (err, outParams) {
        result = outParams;
      });

      // Only one is correct here, so the 'auto' branch (numCorrect > 1) is NOT taken —
      // falls through to 'multi'.
      expect(result.behaviour.type).to.equal('multi');
    });

    it("sets type 'auto' when behaviour.singleAnswer is false and more than one answer is correct", function () {
      const params = {
        answers: [{ correct: true }, { correct: true }, { correct: false }],
        behaviour: { singleAnswer: false }
      };
      let result;

      upgrades[1][4](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.behaviour.type).to.equal('auto');
    });
  });

  describe('1.5 — legacy image becomes a media object (MC-UPG-04)', function () {
    it('wraps image into media = {library: "H5P.Image 1.0", params: {file: image}} and deletes image', function () {
      const params = fixtures.versions.v1_5();
      const originalImage = fixtures.versions.v1_5().image;
      let result;

      upgrades[1][5](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.media).to.deep.equal({ library: 'H5P.Image 1.0', params: { file: originalImage } });
      expect(result).to.not.have.property('image');
    });

    it('leaves params without an image untouched', function () {
      const params = { answers: [] };
      let result;

      upgrades[1][5](params, function (err, outParams) {
        result = outParams;
      });

      expect(result).to.not.have.property('media');
    });
  });

  describe('1.10 — derive overallFeedback from UI text fields (MC-UPG-05)', function () {
    it('builds three ranges when correctText/almostText/wrongText are all specified', function () {
      const params = fixtures.versions.v1_9();
      let result;

      upgrades[1][10](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.overallFeedback).to.deep.equal([
        { from: 0, to: 0, feedback: 'Not quite.' },
        { from: 1, to: 99, feedback: 'So close!' },
        { from: 100, to: 100, feedback: 'Great job!' }
      ]);
      expect(result.UI).to.not.have.property('correctText');
      expect(result.UI).to.not.have.property('almostText');
      expect(result.UI).to.not.have.property('wrongText');
      expect(result.UI).to.not.have.property('feedback');
    });

    it('builds a single 0-100 range from a generic UI.feedback when nothing else is specified', function () {
      const params = fixtures.versions.v1_9b();
      let result;

      upgrades[1][10](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.overallFeedback).to.deep.equal([
        { from: 0, to: 100, feedback: 'You attempted the question.' }
      ]);
    });

    it('leaves overallFeedback untouched when UI is absent', function () {
      const params = { answers: [] };
      let result;

      upgrades[1][10](params, function (err, outParams) {
        result = outParams;
      });

      expect(result).to.not.have.property('overallFeedback');
    });
  });

  describe('1.13 — metadata.title from question (MC-UPG-06)', function () {
    it('sets extras.metadata.title from question with HTML tags stripped', function () {
      const params = fixtures.versions.v1_12();
      let result;

      upgrades[1][13](params, function (err, outParams, extras) {
        result = extras;
      }, {});

      expect(result.metadata.title).to.equal('Sample pending metadata title extraction.');
    });

    it('falls back to an existing extras title when question is absent', function () {
      let result;

      upgrades[1][13]({}, function (err, outParams, extras) {
        result = extras;
      }, { metadata: { title: 'Existing Title' } });

      expect(result.metadata.title).to.equal('Existing Title');
    });

    it("falls back to 'Multiple Choice' when neither question nor title exist", function () {
      let result;

      upgrades[1][13]({}, function (err, outParams, extras) {
        result = extras;
      }, {});

      expect(result.metadata.title).to.equal('Multiple Choice');
    });
  });

  describe('1.14 — move disableImageZooming from behaviour into media (MC-UPG-07)', function () {
    it('wraps top-level media and relocates disableImageZooming from behaviour', function () {
      const params = fixtures.versions.v1_13();
      const originalMedia = fixtures.versions.v1_13().media;
      let result;

      upgrades[1][14](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.media.type).to.deep.equal(originalMedia);
      expect(result.media.disableImageZooming).to.equal(true);
      expect(result.behaviour).to.not.have.property('disableImageZooming');
    });

    it('defaults disableImageZooming to false when behaviour lacks it', function () {
      const params = { media: { library: 'H5P.Image 1.1', params: {} }, behaviour: {} };
      let result;

      upgrades[1][14](params, function (err, outParams) {
        result = outParams;
      });

      expect(result.media.disableImageZooming).to.equal(false);
    });

    it('leaves params without media untouched', function () {
      const params = { behaviour: { enableRetry: true } };
      let result;

      upgrades[1][14](params, function (err, outParams) {
        result = outParams;
      });

      expect(result).to.not.have.property('media');
      expect(result.behaviour).to.deep.equal({ enableRetry: true });
    });
  });
});

