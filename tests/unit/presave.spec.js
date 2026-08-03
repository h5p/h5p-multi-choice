'use strict';

const { expect } = require('chai');
const { resetGlobals, loadScript } = require('../setup/h5p-globals');
const fixtures = require('../fixtures/params');

/**
 * presave.js — needs H5PEditor.Presave (stubbed by the harness) and its
 * `validateScore` member (grown into the shared mock for this content type — see
 * libraries/h5p-js-testing-shared/docs/03-contracts-and-parity.md).
 * Binds to: MC-DATA-01 (maxScore = max(correct, 1)), MC-DATA-02 (singlePoint → 1),
 * MC-DATA-03 (throws on missing/non-array answers), MC-DATA-04 (validateScore honoured).
 */
describe('presave.js', function () {
  let presave;

  beforeEach(function () {
    resetGlobals();
    loadScript('presave.js');
    presave = global.H5PPresave['H5P.MultiChoice'];
  });

  it('yields {maxScore: N} where N is the number of correct answers (MC-DATA-01)', function () {
    const content = fixtures.canonical.twoCorrectOfThree();
    let result;

    presave(content, function (data) {
      result = data;
    });

    expect(result).to.deep.equal({ maxScore: 2 });
  });

  it('yields {maxScore: 1} — not 0 — when no answer is correct (MC-DATA-01, MC-IMPL-01)', function () {
    const content = fixtures.canonical.noneCorrect();
    let result;

    presave(content, function (data) {
      result = data;
    });

    expect(result).to.deep.equal({ maxScore: 1 });
  });

  it('yields {maxScore: 1} when behaviour.singlePoint is true, regardless of correct count (MC-DATA-02)', function () {
    const content = fixtures.canonical.singlePoint();
    let result;

    presave(content, function (data) {
      result = data;
    });

    expect(result).to.deep.equal({ maxScore: 1 });
  });

  it("yields {maxScore: 1} when behaviour.type === 'single' (MC-DATA-02)", function () {
    const content = fixtures.canonical.singleAnswerType();
    let result;

    presave(content, function (data) {
      result = data;
    });

    expect(result).to.deep.equal({ maxScore: 1 });
  });

  it('throws InvalidContentSemanticsException when answers is missing (MC-DATA-03)', function () {
    expect(function () {
      presave({ question: 'x' }, function () {});
    }).to.throw().with.property('name', 'InvalidContentSemanticsException');
  });

  it('throws InvalidContentSemanticsException when answers is not an array (MC-DATA-03)', function () {
    expect(function () {
      presave({ question: 'x', answers: 'not-an-array' }, function () {});
    }).to.throw().with.property('name', 'InvalidContentSemanticsException');
  });

  it('does not throw for a valid score — validateScore is honoured (MC-DATA-04)', function () {
    const content = fixtures.canonical.twoCorrectOfThree();
    expect(function () {
      presave(content, function () {});
    }).to.not.throw();
  });
});

