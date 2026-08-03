/**
 * Pure scoring helpers for H5P.MultiChoice.
 *
 * Extracted so this logic is unit-testable without the H5P runtime (no jQuery/DOM).
 * The main content type (`js/multichoice.js`) keeps its own inline implementation for
 * now — this module is purely additive (assigns onto the existing `H5P.MultiChoice`
 * namespace) and introduces no new required load order, so H5P's concat/dependency
 * model is unaffected. It durably documents (and lets us pin, via tests) the scoring
 * rules that are otherwise trapped inside `registerDomElements`'s click handlers.
 *
 * Mirrors the pattern already used by H5P.TrueFalse's `h5p-true-false-scoring.js`.
 */
var H5P = H5P || {};
H5P.MultiChoice = H5P.MultiChoice || {};

H5P.MultiChoice.scoring = (function () {
  'use strict';

  /**
   * The maximum achievable score for a set of answers, honouring "single point" /
   * "single answer" collapsing to the content's configured `weight`.
   *
   * @param {Array<{correct: boolean, weight?: number}>} answers
   * @param {number} weight content weight (defaults to 1 when omitted)
   * @param {boolean} blankIsCorrect true when no answer is marked correct (an
   *        unanswered/blank submission is the correct one)
   * @return {number} the max score
   */
  function calculateMaxScore(answers, weight, blankIsCorrect) {
    weight = weight === undefined ? 1 : weight;
    if (blankIsCorrect) {
      return weight;
    }
    var maxScore = 0;
    (answers || []).forEach(function (choice) {
      if (choice.correct) {
        maxScore += (choice.weight !== undefined ? choice.weight : 1);
      }
    });
    return maxScore;
  }

  /**
   * The max score as the runtime would report it via `getMaxScore()`: single-answer
   * and single-point configurations always collapse to `weight`; otherwise it's the
   * sum of correct-answer weights.
   *
   * @param {Array} answers
   * @param {number} weight
   * @param {boolean} singleAnswer
   * @param {boolean} singlePoint
   * @param {boolean} blankIsCorrect
   * @return {number}
   */
  function getMaxScore(answers, weight, singleAnswer, singlePoint, blankIsCorrect) {
    weight = weight === undefined ? 1 : weight;
    return (!singleAnswer && !singlePoint) ? calculateMaxScore(answers, weight, blankIsCorrect) : weight;
  }

  /**
   * Score for a multi-answer (checkbox) selection: +weight per correct choice picked,
   * -weight per incorrect choice picked, clamped at 0, then collapsed to `weight`
   * (all-or-nothing) when `singlePoint` and the pass percentage is met.
   *
   * @param {number[]} userAnswers indices into `answers` the user selected
   * @param {Array<{correct: boolean, weight?: number}>} answers
   * @param {object} [opts]
   * @param {number} [opts.weight=1]
   * @param {boolean} [opts.blankIsCorrect=false]
   * @param {boolean} [opts.singlePoint=false]
   * @param {number} [opts.passPercentage=100]
   * @return {number} score
   */
  function calcScore(userAnswers, answers, opts) {
    opts = opts || {};
    var weight = opts.weight === undefined ? 1 : opts.weight;
    var blankIsCorrect = !!opts.blankIsCorrect;
    var singlePoint = !!opts.singlePoint;
    var passPercentage = opts.passPercentage === undefined ? 100 : opts.passPercentage;

    var score = 0;
    (userAnswers || []).forEach(function (index) {
      var choice = answers[index];
      var choiceWeight = (choice.weight !== undefined ? choice.weight : 1);
      score += choice.correct ? choiceWeight : -choiceWeight;
    });

    if (score < 0) {
      score = 0;
    }

    if ((!userAnswers || !userAnswers.length) && blankIsCorrect) {
      score = weight;
    }

    if (singlePoint) {
      var max = calculateMaxScore(answers, weight, blankIsCorrect);
      score = (max > 0 && (100 * score / max) >= passPercentage) ? weight : 0;
    }

    return score;
  }

  /**
   * Score for a single-answer (radio) selection: `weight` if the chosen answer is
   * correct, else 0.
   *
   * @param {number|undefined} chosenIndex index into `answers`, or undefined if none
   * @param {Array<{correct: boolean}>} answers
   * @param {number} [weight=1]
   * @return {number}
   */
  function calcSingleAnswerScore(chosenIndex, answers, weight) {
    weight = weight === undefined ? 1 : weight;
    if (chosenIndex === undefined || chosenIndex === null || !answers[chosenIndex]) {
      return 0;
    }
    return answers[chosenIndex].correct ? weight : 0;
  }

  return {
    calculateMaxScore: calculateMaxScore,
    getMaxScore: getMaxScore,
    calcScore: calcScore,
    calcSingleAnswerScore: calcSingleAnswerScore
  };
})();

