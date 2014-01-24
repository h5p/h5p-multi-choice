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
//   randomAnswers: false  // Whether to randomize the order of answers.
// }
//
// Events provided:
// - h5pQuestionAnswered: Triggered when a question has been answered.

var H5P = H5P || {};

H5P.MultiChoice = function(options, contentId) {
  var that = this;
  if (!(this instanceof H5P.MultiChoice))
    return new H5P.MultiChoice(options, contentId);

  var $ = H5P.jQuery;
  var lp = H5P.getLibraryPath('H5P.MultiChoice-1.0');

  var texttemplate =
          '<div class="h5p-question"><%= question %></div>' +
          '  <ul class="h5p-answers">' +
          '    <% for (var i=0; i<answers.length; i++) { %>' +
          '      <li class="h5p-answer<% if (userAnswers.indexOf(i) > -1) { %> h5p-selected<% } %>">' +
          '        <label>' +
          '          <div class="h5p-input-container">' +
          '            <% if (singleAnswer) { %>' +
          '            <input type="radio" name="answer" class="h5p-input" value="answer_<%= i %>"<% if (userAnswers.indexOf(i) > -1) { %> checked<% } %> />' +
          '            <% } else { %>' +
          '            <input type="checkbox" name="answer_<%= i %>" class="h5p-input" value="answer_<%= i %>"<% if (userAnswers.indexOf(i) > -1) { %> checked<% } %> />' +
          '            <% } %>' +
          '            <a width="100%" height="100%" class="h5p-radio-or-checkbox" href="#"><%= answers[i].checkboxOrRadioIcon %></a>' +
          '          </div><div class="h5p-alternative-container">' +
          '            <span class="h5p-span"><%= answers[i].text %></span>' +
          '          </div><div class="h5p-clearfix"></div>' +
          '        </label>' +
          '      </li>' +
          '    <% } %>' +
          '  </ul>' +
          '<div class="h5p-show-solution-container"><div class="feedback-text"></div><a href="#" class="h5p-show-solution" style="display:none;"><%= UI.showSolutionButton %></a></div>';

  var defaults = {
    question: "No question text provided",
    answers: [
      {text: "Answer 1", correct: false},
      {text: "Answer 2", correct: true}
    ],
    singleAnswer: false,
    singlePoint: true,
    randomAnswers: false,
    weight: 1,
    userAnswers: [],
    UI: {
      showSolutionButton: 'Show solution',
      tryAgainButton: 'Try again',
      correctText: 'Correct!',
      almostText: 'Almost!',
      wrongText: 'Wrong!'
    },
    displaySolutionsButton: true,
    postUserStatistics: (H5P.postUserStatistics === true),
    tryAgain: true
  };
  var template = new EJS({text: texttemplate});
  var params = $.extend(true, {}, defaults, options);

  var getCheckboxOrRadioIcon = function (radio, selected) {
    var icon;
    if (radio) {
      icon = selected ? '&#xe603;' : '&#xe600;';
    }
    else {
      icon = selected ? '&#xe601;' : '&#xe602;';
    }
    return icon;
  };

  var $myDom;
  var $solutionButton;
  var $feedbackElement;
  var $feedbackDialog;
  var removeFeedbackDialog = function () {
    // Remove the open feedback dialog.
    H5P.$body.unbind('click', removeFeedbackDialog);
    $feedbackDialog.remove();
  }

  var answerGiven = false;
  var score = 0;
  var solutionsVisible = false;

  var addFeedback = function ($element, feedback) {
    $('<div/>', {
      role: 'button',
      tabIndex: 1,
      class: 'h5p-feedback-button',
      title: 'View feedback',
      click: function (e) {
        if ($feedbackDialog !== undefined) {
          if ($feedbackDialog.parent()[0] === $element[0]) {
            // Skip if we're trying to open the same dialog twice
            return;
          }
          
          // Remove last dialog.
          $feedbackDialog.remove();
        }
        
        $feedbackDialog = $('<div class="h5p-feedback-dialog"><div class="h5p-feedback-inner"><div class="h5p-feedback-text">' + feedback + '</div></div></div>').appendTo($element);
        H5P.$body.click(removeFeedbackDialog);
        e.stopPropagation();
      }
    }).appendTo($element);
  }

  var showSolutions = function () {
    if (solutionsVisible) {
      return;
    }

    if ($solutionButton !== undefined) {
      if (params.tryAgain) {
        $solutionButton.text(params.UI.tryAgainButton).addClass('h5p-try-again');
      }
      else {
        $solutionButton.remove();
      }
    }

    solutionsVisible = true;
    $myDom.find('.h5p-answer').each(function (i, e) {
      var $e = $(e);
      var a = params.answers[i];
      if (a.correct) {
        $e.addClass('h5p-correct');
      }
      else {
        $e.addClass('h5p-wrong');
      }
      $e.find('input').attr('disabled', 'disabled');
      
      var c = $e.hasClass('h5p-selected');
      if (c === true && a.chosenFeedback !== undefined && a.chosenFeedback !== '') {
        addFeedback($e, a.chosenFeedback);
      }
      else if (c === false && a.notChosenFeedback !== undefined && a.notChosenFeedback !== '') {
        addFeedback($e, a.notChosenFeedback);
      }
    });
    var max = maxScore();
    if (score === max) {
      $feedbackElement.addClass('h5p-passed').html(params.UI.correctText);
    }
    else if (score === 0) {
      $feedbackElement.addClass('h5p-failed').html(params.UI.wrongText);
    }
    else {
      $feedbackElement.addClass('h5p-almost').html(params.UI.almostText);
    }
  };

  var hideSolutions = function () {
    $solutionButton.text(params.UI.showSolutionButton).removeClass('h5p-try-again');
    solutionsVisible = false;

    $feedbackElement.removeClass('h5p-passed h5p-failed h5p-almost').empty();
    $myDom.find('.h5p-correct').removeClass('h5p-correct');
    $myDom.find('.h5p-wrong').removeClass('h5p-wrong');
    $myDom.find('input').prop('disabled', false);
    $myDom.find('.h5p-feedback-button, .h5p-feedback-dialog').remove();
  };

  var calculateMaxScore = function () {
    var maxScore = 0;
    for (var i = 0; i < params.answers.length; i++) {
      var choice = params.answers[i];
      if (choice.correct) {
        maxScore += (choice.weight !== undefined ? choice.weight : 1);
      }
    }
    return maxScore;
  };

  var maxScore = function () {
    return (!params.singleAnswer && !params.singlePoint ? calculateMaxScore() : params.weight);
  };
  
  var addSolutionButton = function () {
    $solutionButton = $myDom.find('.h5p-show-solution').show().click(function () {
      if ($solutionButton.hasClass('h5p-try-again')) {
        hideSolutions();
      }
      else {
        showSolutions();
        if (params.postUserStatistics === true) {
          H5P.setFinished(contentId, score, maxScore());
        }
      }
      return false;
    });
  };

  var calcScore = function () {
    score = 0;
    params.userAnswers = new Array();
    $('input', $myDom).each(function (idx, el) {
      var $el = $(el);
      if ($el.is(':checked')) {
        var choice = params.answers[idx];
        var weight = (choice.weight !== undefined ? choice.weight : 1);
        if (choice.correct) {
          score += weight;
        }
        else {
          score -= weight;
        }
        var num = parseInt($(el).val().split('_')[1], 10);
        params.userAnswers.push(num);
      }
    });
    if (score < 0) {
      score = 0;
    }
    if (params.singlePoint) {
      score = (score === calculateMaxScore() ? params.weight : 0);
    }
  };

  // Function for attaching the multichoice to a DOM element.
  var attach = function (target) {
    if (typeof(target) === "string") {
      target = $("#" + target);
    } else {
      target = $(target);
    }

    // If we are reattached, forget if we have shown solutions before.
    solutionsVisible = false;

    // Recalculate icons on attach, in case we are re-attaching.
    for (var i = 0; i < params.answers.length; i++) {
      params.answers[i].checkboxOrRadioIcon = getCheckboxOrRadioIcon(params.singleAnswer, params.userAnswers.indexOf(i) > -1);
    }

    // Render own DOM into target.
    $myDom = target;
    $myDom.html(template.render(params)).addClass('h5p-multichoice');
    
    $feedbackElement = $myDom.find('.h5p-show-solution-container .feedback-text');

    // Set event listeners.
    $('input', $myDom).change(function () {
      var $this = $(this);
      answerGiven = true;
      var num = parseInt($(this).val().split('_')[1], 10);
      if (params.singleAnswer) {
        params.userAnswers[0] = num;
        if (params.answers[num].correct) {
          score = 1;
        } else {
          score = 0;
        }
        $this.parents('.h5p-answers').find('.h5p-answer.h5p-selected').removeClass("h5p-selected");
        $this.parents('.h5p-answers').find('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(true, false));

        $this.parents('.h5p-answer').addClass("h5p-selected");
        $this.siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(true, true));
      } else {  
        if ($this.is(':checked')) {
          $this.parents('.h5p-answer').addClass("h5p-selected");
          $this.siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(false, true));
        } else {
          $this.parents('.h5p-answer').removeClass("h5p-selected");
          $this.siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(false, false));
        }
        calcScore();
      }
      // Triggers must be done on the returnObject.
      $(returnObject).trigger('h5pQuestionAnswered');
    });

    if (params.displaySolutionsButton === true) {
      addSolutionButton();
    }
    if (!params.singleAnswer) {
      calcScore();
    }

    return this;
  };

  // Initialization code
  // Randomize order, if requested
  if (params.randomAnswers) {
    params.answers = H5P.shuffleArray(params.answers);
  }
  // Start with an empty set of user answers.
  params.userAnswers = [];

  // Masquerade the main object to hide inner properties and functions.
  var returnObject = {
    machineName: 'H5P.MultiChoice',
    attach: attach, // Attach to DOM object
    getScore: function() {
      return score;
    },
    getAnswerGiven: function() {
      return answerGiven;
    },
    getMaxScore: maxScore,
    showSolutions: showSolutions,
    addSolutionButton: addSolutionButton,
    tryAgain: params.tryAgain,
    defaults: defaults // Provide defaults for inspection
  };
  // Store options.
  return returnObject;
};
