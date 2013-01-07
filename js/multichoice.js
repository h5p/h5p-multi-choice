// Will render a Question with multiple choices for answers.

// Options format:
// {
//   title: "Optional title for question box",
//   question: "Question text",
//   answers: [{text: "Answer text", correct: false}, ...],
//   singleAnswer: true, // or false, will change rendered output slightly.
// }

function H5P_MultiChoice(options) {
  if ( !(this instanceof H5P_MultiChoice) )
    return new H5P_MultiChoice(options);

  var defaults = {
    title: "",
    question: "No question text provided",
    answers: [{text: "Answer 1", correct: false }, 
              {text: "Answer 2", correct: true }],
    singleAnswer: true
  };

  // Function for attaching the multichoice to a DOM element.
  var _attach = function (targetId) {
    // TODO: Randomize answers

    // Render own DOM into target.
    template.update(targetId, params);
  }

  // Get the score for the question.
  var _getScore = function () {
    return 0;
  }

  var template = new EJS({url: '../views/multichoice.ejs'});
  var params = jQuery.extend({}, defaults, options);

  // Store options.
  return {
    attach: _attach // Attach to DOM object
  , getScore: _getScore
  , options: options // Might be useful to inspect options from construction
  , defaults: defaults // Provide defaults for inspection
  };
}
