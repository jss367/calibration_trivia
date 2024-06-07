'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfidenceInputHTML = getConfidenceInputHTML;
exports.getCurrentSessionId = getCurrentSessionId;
exports.submitAnswerToFirestore = submitAnswerToFirestore;
exports.updateStartButtonState = updateStartButtonState;
exports.updateNextButton = updateNextButton;
exports.calculateConfidenceDecileScores = calculateConfidenceDecileScores;
function getConfidenceInputHTML() {
  return '\n    <div>\n      <label for="confidence">Confidence:</label>\n      <input type="number" id="confidence" class="input-small" min="0" max="100" step="1">%\n    </div>\n  ';
}

function getCurrentSessionId() {
  return localStorage.getItem('currentSessionId');
}

function submitAnswerToFirestore(sessionId, userId, answer, confidence) {
  if (!sessionId || !userId) {
    console.error('Session ID or User ID is missing.');
    return;
  }

  var answerData = { answer: answer, confidence: confidence, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
  db.collection('sessions').doc(sessionId).collection('answers').doc(userId).set(answerData).then(function () {
    return console.log('Answer submitted successfully');
  }).catch(function (error) {
    return console.error("Error submitting answer:", error);
  });
}

function updateStartButtonState() {
  var checkedModeRadioButton = document.querySelector('input[name="mode"]:checked');
  var mode = checkedModeRadioButton ? checkedModeRadioButton.value : '';

  var usernameInput = document.getElementById('username').value.trim();
  var sessionIdInput = document.getElementById('session-id').value.trim();
  var isCategorySelected = Array.from(document.querySelectorAll('.category-checkbox')).some(function (checkbox) {
    return checkbox.checked;
  });

  var enableButton = false;

  if (mode === 'single') {
    enableButton = isCategorySelected;
  } else if (mode === 'group-questioner') {
    enableButton = sessionIdInput && isCategorySelected;
  } else if (mode === 'group-participant') {
    enableButton = usernameInput.length > 0;
  }

  document.getElementById('start-quiz').disabled = !enableButton;
}

function updateNextButton() {
  var sessionIdInput = document.getElementById('session-id').value.trim();
  var categoryCheckboxes = document.querySelectorAll('.category-checkbox');
  var isAnyCategorySelected = Array.from(categoryCheckboxes).some(function (checkbox) {
    return checkbox.checked;
  });

  nextButton.disabled = !(sessionIdInput.length > 0 && isAnyCategorySelected);
}

function calculateConfidenceDecileScores(answers) {
  var decileScores = Array(10).fill(0);
  var decileCounts = Array(10).fill(0);
  var decileCorrectCounts = Array(10).fill(0);

  answers.forEach(function (answer) {
    var decile = Math.min(Math.floor(answer.userConfidence * 10), 9);
    decileCounts[decile]++;
    if (answer.correctAnswer === answer.userAnswer) {
      decileCorrectCounts[decile]++;
    }
  });

  return decileScores.map(function (_, index) {
    return {
      decileRange: index * 10 + '-' + (index + 1) * 10 + '%',
      score: decileCounts[index] ? decileCorrectCounts[index] / decileCounts[index] : null,
      correct: decileCorrectCounts[index],
      total: decileCounts[index]
    };
  });
}