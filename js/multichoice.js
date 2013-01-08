// Will render a Question with multiple choices for answers.

// Options format:
// {
//   title: "Optional title for question box",
//   question: "Question text",
//   answers: [{text: "Answer text", correct: false}, ...],
//   singleAnswer: true, // or false, will change rendered output slightly.
// }
window.H5P = window.H5P || {};

H5P.MultiChoice = function (options) {
  if ( !(this instanceof H5P.MultiChoice) )
    return new H5P.MultiChoice(options);

  var texttemplate = '' +
'<div class="multichoice">' +
'  <div class="title"><%= title %></div>' +
'  <div class="question"><%= question %></div>' +
'  <ul class="answers">' +
'    <% for (var i=0; i<answers.length; i++) { %>' +
'      <li class="answer">' +
'        <label>' +
'          <% if (singleAnswer) { %>' +
'          <input type="radio" name="answer" value="answer_<%= i %>">' +
'          <% } else { %>' +
'          <input type="checkbox" name="answer_<%= i %>">' +
'          <% } %>' +
'          <span><%= answers[i].text %></span>' +
'        </label>' +
'      </li>' +
'    <% } %>' +
'  </ul>' +
'</div>' +
  '';

  var defaults = {
    title: "",
    question: "No question text provided",
    answers: [{text: "Answer 1", correct: false },
              {text: "Answer 2", correct: true }],
    singleAnswer: true,
    randomOrder: false
  };
  var template = new EJS({text: texttemplate});
  var params = jQuery.extend({}, defaults, options);
  var myDom;

  var answerGiven = false;
  var score = 0;

  if (params.randomOrder) {
    // TODO: Randomize answer order
    console.log("TODO: Randomize order");
  }

  // Function for attaching the multichoice to a DOM element.
  var attach = function (targetId) {
    // Render own DOM into target.
    template.update(targetId, params);
    myDom = jQuery('#'+targetId);

    // Set event listeners.
    $('input', myDom).click(function () {
      answerGiven = true;
      var num = parseInt($(this).val().split('_')[1], 10);
      if (params.singleAnswer) {
        if (params.answers[num].correct) {
          score = 1;
        } else {
          score = 0;
        }
      } else {
        score = 0;
        $('input', myDom).each(function (idx, el) {
          var $el = $(el);
          // var num = parseInt($el.val().split('_')[1], 10);
          if ($el.is(':checked') == params.answers[idx].correct) {
            score += 1; // TODO: Weight of answers?
          }
        });
      }
    });

    return this;
  };

  // Store options.
  return {
    machineName: 'H5P.MultiChoice',
    attach: attach, // Attach to DOM object
    getScore: function () {return score;},
    getAnswerGiven: function () {return answerGiven;},
    defaults: defaults // Provide defaults for inspection
  };
};
