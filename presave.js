var H5PPresave = H5PPresave || {};

H5PPresave['H5P.MultiChoice'] = function (content, finished) {
  var presave = H5PEditor.Presave;
  var score = 0;
  var correctAnswers = 0;

  if (isContentInValid()) {
    throw new presave.exceptions.InvalidContentSemanticsException('Invalid Multi Choice Error');
  }

  if (isSinglePoint()) {
    score = 1;
  } else {
    correctAnswers = content.answers.filter(function (answer) {
      return answer.correct === true;
    });
    score = Math.max(correctAnswers.length, 1);
  }

  presave.validateScore(score);

  if (finished) {
    finished({maxScore: score});
  }

  function isContentInValid() {
    return !presave.checkNestedRequirements(content, 'content.answers') || !Array.isArray(content.answers);
  }

  function isSinglePoint() {
    return presave.checkNestedRequirements(content, 'content.behaviour.singlePoint') && content.behaviour.singlePoint === true;
  }
};
