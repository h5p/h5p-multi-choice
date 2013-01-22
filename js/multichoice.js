// Will render a Question with multiple choices for answers.

// Options format:
// {
//   title: "Optional title for question box",
//   question: "Question text",
//   answers: [{text: "Answer text", correct: false}, ...],
//   singleAnswer: true, // or false, will change rendered output slightly.
//   singlePoint: true,  // True if question give a single point score only
//                       // if all are correct, false to give 1 point per
//                       // correct answer. (Only for singleAnswer=false)
//   randomOrder: false  // Whether to randomize the order of answers.
// }
//
// Events provided:
// - h5pQuestionAnswered: Triggered when a question has been answered.

// TODO list:
//
// Keep state of question between renderings. Show current state if user has
// answered before!
//
// Actually randomize order if randomOrder=true

window.H5P = window.H5P || {};

H5P.MultiChoice = function (options, contentId) {
  if ( !(this instanceof H5P.MultiChoice) )
    return new H5P.MultiChoice(options, contentId);

  var $ = H5P.jQuery;
  var cp = H5P.getContentPath(contentId);

  var texttemplate = '' +
'<div class="multichoice">' +
'  <div class="title"><%= title %></div>' +
'  <% if (illustration) { %>' +
'    <div class="illustration"><img src="<%= illustration %>"></div>' +
'  <% } %>' +
'  <div class="question"><%= question %></div>' +
'  <form>' +
'    <ul class="answers">' +
'      <% for (var i=0; i<answers.length; i++) { %>' +
'        <li class="answer<% if (userAnswers.contains(i)) { %> selected<% } %>">' +
'          <label>' +
'            <% if (singleAnswer) { %>' +
'            <input type="radio" name="answer" value="answer_<%= i %>"<% if (userAnswers.contains(i)) { %> checked<% } %>>' +
'            <% } else { %>' +
'            <input type="checkbox" name="answer_<%= i %>" value="answer_<%= i %>"<% if (userAnswers.contains(i)) { %> checked<% } %>>' +
'            <% } %>' +
'            <span><%= answers[i].text %></span>' +
'          </label>' +
'        </li>' +
'      <% } %>' +
'    </ul>' +
'  </form>' +
'</div>' +
  '';

  var that = this;
  var defaults = {
    title: "",
    illustration: "",
    question: "No question text provided",
    answers: [{text: "Answer 1", correct: false },
              {text: "Answer 2", correct: true }],
    singleAnswer: false,
    singlePoint: true,
    randomOrder: false,
    weight: 1
  };
  var template = new EJS({text: texttemplate});
  var params = $.extend({}, defaults, options);
  if (params.illustration != '') {
    params.illustration = cp + params.illustration;
  }
  var $myDom;

  var answerGiven = false;
  params.userAnswers = new Array();
  var score = 0;

  if (params.randomOrder) {
    // TODO: Randomize answer order
    console.log("TODO: Randomize order");
  }

  // Function for attaching the multichoice to a DOM element.
  var attach = function (target) {
    if (typeof(target) == "string") {
      target = $("#" + target);
    } else {
      target = $(target);
    }
    // Render own DOM into target.
    $myDom = target;
    $myDom.html(template.render(params));


    // Set event listeners.
    $('input', $myDom).click(function () {
      answerGiven = true;
      var num = parseInt($(this).val().split('_')[1], 10);
      if (params.singleAnswer) {
        params.userAnswers[0] = num;
        if (params.answers[num].correct) {
          score = 1;
        } else {
          score = 0;
        }
        $(this).parents('.answers').find('.answer.selected').removeClass("selected");
        $(this).parents('.answer').addClass("selected");
      } else {
        score = 0;
        params.userAnswers = new Array();
        if ($(this).is(':checked')) {
          $(this).parents('.answer').addClass("selected");
        } else {
          $(this).parents('.answer').removeClass("selected");
        }
        $('input', $myDom).each(function (idx, el) {
          var $el = $(el);
          if ($el.is(':checked') == params.answers[idx].correct) {
            score += 1; // TODO: Weight of answers?
            var num = parseInt($(el).val().split('_')[1], 10);
            params.userAnswers.push(num);
          }
        });
        if (params.singlePoint) {
          score = (score == params.answers.length) ? 1 : 0;
        }
      }
      // Triggers must be done on the returnObject.
      $(returnObject).trigger('h5pQuestionAnswered');
    });

    return this;
  };

  // Masquerade the main object to hide inner properties and functions.
  var returnObject = {
    machineName: 'H5P.MultiChoice',
    attach: attach, // Attach to DOM object
    getScore: function () {return score;},
    getAnswerGiven: function () {return answerGiven;},
    totalScore: function () {
      if (!params.singleAnswer && !params.singlePoint) {
        var s = 0;
        for (var i = params.answers.length - 1; i >= 0; i--) {
          var a = params.answers[i];
          s += (a.weight !== undefined) ? a.weight : 1;
        }
        return s;
      }
      return params.weight;
    },
    defaults: defaults // Provide defaults for inspection
  };
  // Store options.
  return returnObject;
};
