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

H5P.MultiChoice = function(options, contentId, contentData) {
  if (!(this instanceof H5P.MultiChoice))
    return new H5P.MultiChoice(options, contentId, contentData);
  var self = this;
  this.contentId = contentId;
  H5P.EventDispatcher.call(this, arguments);
  var $ = H5P.jQuery;
  var texttemplate =
      '<div class="h5p-question"><%= question %></div>' +
      '  <ul class="h5p-answers">' +
      '    <% for (var i=0; i < answers.length; i++) { %>' +
      '      <li class="h5p-answer<% if (userAnswers.indexOf(i) > -1) { %> h5p-selected<% } %>">' +
      '        <label>' +
      '          <div class="h5p-input-container">' +
      '            <% if (behaviour.singleAnswer) { %>' +
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
      '<div class="h5p-show-solution-container"><a href="#" class="h5p-show-solution" style="display:none;"><%= UI.showSolutionButton %></a></div>';

  var defaults = {
    image: null,
    question: "No question text provided",
    answers: [
      {
        tipsAndFeedback: {
          tip: '',
          chosenFeedback: '',
          notChosenFeedback: ''
        },
        text: "Answer 1",
        correct: true
      }
    ],
    weight: 1,
    userAnswers: [],
    UI: {
      checkAnswerButton: 'Check',
      showSolutionButton: 'Show solution',
      tryAgainButton: 'Try again'
    },
    behaviour: {
      enableRetry: true,
      enableSolutionsButton: true,
      singleAnswer: false,
      singlePoint: true,
      randomAnswers: false,
      showSolutionsRequiresInput: true
    }
  };

  // Make sure tips and feedback exists
  options.answers.forEach(function (answer) {
    answer.tipsAndFeedback = answer.tipsAndFeedback || {};
  });

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

  // Initialize buttons and elements.
  var $myDom;
  var $checkButton;
  var $retryButton;
  var $solutionButton;
  var $feedbackDialog;
  var removeFeedbackDialog = function () {
    // Remove the open feedback dialog.
    $myDom.unbind('click', removeFeedbackDialog);
    $feedbackDialog.remove();
  };

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
        $myDom.click(removeFeedbackDialog);
        self.trigger('resize');
        e.stopPropagation();
      }
    }).appendTo($element.addClass('h5p-has-feedback'));
  };

  this.showAllSolutions = function () {
    if (solutionsVisible) {
      return;
    }
    solutionsVisible = true;

    $myDom.find('.h5p-answer').each(function (i, e) {
      var $e = $(e);
      var a = params.answers[i];
      if (a.correct) {
        $e.addClass('h5p-correct');
        $e.addClass('h5p-should');
      }
      else {
        $e.addClass('h5p-wrong');
        $e.addClass('h5p-should-not');
      }
      $e.find('input').attr('disabled', 'disabled');

      var c = $e.hasClass('h5p-selected');
      if (c === true && a.tipsAndFeedback.chosenFeedback !== undefined && a.tipsAndFeedback.chosenFeedback !== '') {
        addFeedback($e, a.tipsAndFeedback.chosenFeedback);
      }
      else if (c === false && a.tipsAndFeedback.notChosenFeedback !== undefined && a.tipsAndFeedback.notChosenFeedback !== '') {
        addFeedback($e, a.tipsAndFeedback.notChosenFeedback);
      }
    });
    var max = self.getMaxScore();

    // Add css class disabled to labels.
    $myDom.find('label').addClass('h5p-mc-disabled');

    //Hide buttons and retry depending on settings.
    $solutionButton.hide();
    $checkButton.hide();
    if (params.behaviour.enableRetry) {
      $retryButton.show();
    }
    self.trigger('resize');
  };

  /**
   * Used in contracts.
   * Shows the solution for the task and hides all buttons.
   */
  this.showSolutions = function () {
    self.showAllSolutions();

    //Hides all buttons.
    $retryButton.hide();
    };

  this.hideSolutions = function () {
    $solutionButton.text(params.UI.showSolutionButton).removeClass('h5p-try-again');
    solutionsVisible = false;

    $myDom.find('.h5p-correct').removeClass('h5p-correct');
    $myDom.find('.h5p-wrong').removeClass('h5p-wrong');
    $myDom.find('.h5p-should').removeClass('h5p-should');
    $myDom.find('.h5p-should-not').removeClass('h5p-should-not');
    $myDom.find('input').prop('disabled', false);
    $myDom.find('.h5p-feedback-button, .h5p-feedback-dialog').remove();
    $myDom.find('.h5p-has-feedback').removeClass('h5p-has-feedback');
    self.trigger('resize');
  };

  /**
   * Resets the whole task.
   * Used in contracts with integrated content.
   * @private
   */
  this.resetTask = function () {
    self.hideSolutions();
    removeSelections();
    $checkButton.show();
    $retryButton.hide();
    $solutionButton.hide();
  };

  var calculateMaxScore = function () {
    if (blankIsCorrect) {
      return params.weight;
    }
    var maxScore = 0;
    for (var i = 0; i < params.answers.length; i++) {
      var choice = params.answers[i];
      if (choice.correct) {
        maxScore += (choice.weight !== undefined ? choice.weight : 1);
      }
    }
    return maxScore;
  };

  this.getMaxScore = function () {
    return (!params.behaviour.singleAnswer && !params.behaviour.singlePoint ? calculateMaxScore() : params.weight);
  };

  var added = false;
  var addSolutionButton = function () {
    if (added) {
      return;
    }
    added = true;
    $solutionButton = $myDom.find('.h5p-show-solution').click(function () {
      calcScore();
      if (self.getAnswerGiven()) {
        self.showAllSolutions();
      }
      return false;
    });
  };

  /**
   * Adds the ui buttons.
   * @private
   */
  var addButtons = function () {
    addSolutionButton();
    $solutionButton.hide();
    addCheckButton();
    addRetryButton();
  };

  /**
   * Adds a "check solution" button.
   * @private
   */
  var addCheckButton = function () {
    $checkButton = $('<div/>', {
      text: params.UI.checkAnswerButton,
      'class': 'h5p-multichoice-check-button'
    })
      .click(function () {
        disableInput();
        $checkButton.hide();
        if (params.behaviour.enableSolutionsButton) {
          $solutionButton.show();
        }
        if (params.behaviour.enableRetry) {
          $retryButton.show();
        }
        self.showCheckSolution();
        self.triggerXAPICompleted(score, self.getMaxScore());
      })
      .appendTo($myDom.find('.h5p-show-solution-container'));
  };

  /**
   * Adds a "retry" button.
   * @private
   */
  var addRetryButton = function () {
    $retryButton = $('<div/>', {
      text: params.UI.tryAgainButton,
      'class': 'h5p-try-again'
    }).hide()
      .click(function () {
        $solutionButton.hide();
        $retryButton.hide();
        $checkButton.show();
        self.hideSolutions();
        removeSelections();
        enableInput();
      })
      .appendTo($myDom.find('.h5p-show-solution-container'));
  };



  /**
   * Shows feedback on the selected fields.
   * @public
   */
  this.showCheckSolution = function () {
    $myDom.find('.h5p-answer').each(function (i, e) {
      var $e = $(e);
      var a = params.answers[i];
      if ($e.hasClass('h5p-selected')) {
        if (a.correct) {
          $e.addClass('h5p-correct');
        }
        else {
          $e.addClass('h5p-wrong');
        }
      }

      var c = $e.hasClass('h5p-selected');
      if (c === true && a.tipsAndFeedback.chosenFeedback !== undefined && a.tipsAndFeedback.chosenFeedback !== '') {
        addFeedback($e, a.tipsAndFeedback.chosenFeedback);
      }
    });

    //Disable task if maxscore is achieved
    if (score === self.getMaxScore()) {
      finishedTask();
    }
    //Add disabled css class to label
    $myDom.find('label').addClass('h5p-mc-disabled');
    self.trigger('resize');
  };

  /**
   * Method to use when the task is correctly answered, removes all buttons and disables input.
   */
  var finishedTask = function () {
    $checkButton.hide();
    $retryButton.hide();
    $solutionButton.hide();
    $myDom.find('input').attr('disabled', 'disabled');
    self.trigger('resize');
  };

  /**
   * Disables choosing new input.
   */
  var disableInput = function () {
    $myDom.find('input').attr('disabled', 'disabled');
  };

  /**
   * Enables new input.
   */
  var enableInput = function () {
    $myDom.find('input').attr('disabled', false);
    // Remove css class disabled from labels.
    $myDom.find('label').removeClass('h5p-mc-disabled');
  };

  var blankIsCorrect = true;
  for (var i = 0; i < params.answers.length; i++) {
    if (params.answers[i].correct) {
      blankIsCorrect = false;
      break;
    }
  }

  var calcScore = function () {
    score = 0;
    params.userAnswers = [];
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
    if (!params.userAnswers.length && blankIsCorrect) {
      score = params.weight;
    }
    if (params.behaviour.singlePoint) {
      score = (score === calculateMaxScore() ? params.weight : 0);
    }
  };

  /**
   * Removes selections from task.
   */
  var removeSelections = function () {
    $myDom.find(':checked').each( function () {
      this.checked = false;
      $(this).parents('.h5p-answer').removeClass("h5p-selected");

      //Sets type of icon depending on answer type.
      if (params.behaviour.singleAnswer) {
        $(this).siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(true, false));
      }
      else {
        $(this).siblings('.h5p-radio-or-checkbox').html(getCheckboxOrRadioIcon(false, false));
      }
    });
    calcScore();
  };

  // Function for attaching the multichoice to a DOM element.
  this.attach = function (target) {
    if (typeof(target) === "string") {
      target = $("#" + target);
    } else {
      target = $(target);
    }

    // If we are reattached, forget if we have shown solutions before.
    solutionsVisible = false;

    // Recalculate icons on attach, in case we are re-attaching.
    for (var i = 0; i < params.answers.length; i++) {
      params.answers[i].checkboxOrRadioIcon = getCheckboxOrRadioIcon(params.behaviour.singleAnswer, params.userAnswers.indexOf(i) > -1);
    }

    // Render own DOM into target.
    $myDom = target;
    $myDom.html(template.render(params)).addClass('h5p-multichoice').addClass(params.behaviour.singleAnswer ? 'h5p-radio' : 'h5p-check');

    // Add image
    if (params.image) {
      $myDom.find('.h5p-question').prepend(
        $('<img/>', {
          src: H5P.getPath(params.image.path, contentId),
          alt: '',
          class: 'h5p-question-image'
        }).load(function() {
          self.trigger('resize');
        })
      );
    }

    // Create tips:
    $('.h5p-answer', $myDom).each(function (i) {
      var tip = params.answers[i].tipsAndFeedback.tip;
      if (tip === undefined) {
        return; // No tip
      }

      tip = tip.trim();
      if (!tip.length) {
        return; // Empty tip
      }

      // Add tip
      $('.h5p-alternative-container', this)
        .append(H5P.JoubelUI.createTip(tip))
        .addClass('h5p-has-tip');
    });

    // Set event listeners.
    $('input', $myDom).change(function () {
      var $this = $(this);
      var num = parseInt($(this).val().split('_')[1], 10);
      if (params.behaviour.singleAnswer) {
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

      self.triggerXAPI('attempted');

      var answerChecked = false;
      $myDom.find('.h5p-answer').each( function () {
        if($(this).hasClass('h5p-selected')) {
          answerChecked = true;
        }
      });

      if (answerChecked) {
        self.hideSolutions();
        $checkButton.show();
        $retryButton.hide();
        $solutionButton.hide();
      }
    });




    // Adds check and retry button
    addButtons();

    if (!params.behaviour.singleAnswer) {
      calcScore();
    }

    return this;
  };

  // Initialization code
  // Randomize order, if requested
  var idMap;
  if (params.behaviour.randomAnswers) {
    // Store original order in answers
    for (i = 0; i < params.answers.length; i++) {
      params.answers[i].originalOrder = i;
    }

    var origOrder = $.extend([], params.answers);
    params.answers = H5P.shuffleArray(params.answers);

    // Create a map from the new id to the old one
    idMap = [];
    for (i = 0; i < params.answers.length; i++) {
      idMap[i] = params.answers[i].originalOrder;
    }
  }

  // Start with an empty set of user answers.
  params.userAnswers = [];

  // Restore previous state
  if (contentData && contentData.previousState !== undefined) {

    // Restore answers
    if (contentData.previousState.answers) {
      if (!idMap) {
        params.userAnswers = contentData.previousState.answers;
      }
      else {
        // The answers have been shuffled, and we must use the id mapping.
        for (i = 0; i < contentData.previousState.answers.length; i++) {
          for (var k = 0; k < idMap.length; k++) {
            if (idMap[k] === contentData.previousState.answers[i]) {
              params.userAnswers.push(k);
            }
          }
        }
      }
    }
  }

  /**
   * Pack the current state of the interactivity into a object that can be
   * serialized.
   *
   * @public
   */
  this.getCurrentState = function () {
    var state = {};
    if (!idMap) {
      state.answers = params.userAnswers;
    }
    else {
      // The answers have been shuffled and must be mapped back to their
      // original ID.
      state.answers = [];
      for (var i = 0; i < params.userAnswers.length; i++) {
        state.answers.push(idMap[params.userAnswers[i]]);
      }
    }
    return state;
  };


  this.getAnswerGiven = function() {
    return params.behaviour.showSolutionsRequiresInput !== true || params.userAnswers.length || blankIsCorrect;
  };

  this.getScore = function() {
    return score;
  }

  this.getTitle = function() {
    return H5P.createTitle(params.question);
  };
};

H5P.MultiChoice.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.MultiChoice.prototype.constructor = H5P.MultiChoice;
