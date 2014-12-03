var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.MultiChoice'] = (function ($) {
  return {
    1: {
      1: {
        contentUpgrade: function (parameters, finished) {
          // Moved all behavioural settings into "behaviour" group.
          parameters.behaviour = {
            enableRetry: parameters.tryAgain,
            enableSolutionsButton: parameters.enableSolutionsButton,
            singleAnswer: parameters.singleAnswer,
            singlePoint: parameters.singlePoint,
            randomAnswers: parameters.randomAnswers,
            showSolutionsRequiresInput: parameters.showSolutionsRequiresInput
          };
          parameters.UI.checkAnswerButton = 'Check';
          delete parameters.tryAgain;
          delete parameters.enableSolutionsButton;
          delete parameters.singleAnswer;
          delete parameters.singlePoint;
          delete parameters.randomAnswers;
          delete parameters.showSolutionsRequiresInput;

          finished(null, parameters);
        }
      }
    }
  };
})(H5P.jQuery);