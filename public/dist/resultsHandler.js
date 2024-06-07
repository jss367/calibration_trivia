'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.displayResults = displayResults;

var _initialization = require('./initialization.js');

var _util = require('./util.js');

function displayResults() {
  var quizContainer = document.getElementById('quiz-container');
  var resultsContainer = document.getElementById('results-container');
  quizContainer.style.display = 'none';

  if (_initialization.state.modeGroupQuestioner.checked) {
    displayLeaderboard((0, _util.getCurrentSessionId)());
  } else {
    _initialization.state.brierScore /= _initialization.questions.length;

    // Determine the label and color based on Brier score
    var scoreLabel = void 0,
        scoreColor = void 0;
    if (_initialization.state.brierScore <= 0.10) {
      scoreLabel = 'Excellent';
      scoreColor = 'green';
    } else if (_initialization.state.brierScore <= 0.20) {
      scoreLabel = 'Good';
      scoreColor = 'blue';
    } else if (_initialization.state.brierScore <= 0.30) {
      scoreLabel = 'Fair';
      scoreColor = 'orange';
    } else {
      scoreLabel = 'Poor';
      scoreColor = 'red';
    }

    var answers = _initialization.userAnswers.map(function (userAnswer, index) {
      return {
        userAnswer: userAnswer,
        correctAnswer: _initialization.correctAnswers[index],
        userConfidence: _initialization.userConfidences[index]
      };
    });

    var confidenceDecileScores = (0, _util.calculateConfidenceDecileScores)(answers);

    resultsContainer.innerHTML = '\n      <h2>Results</h2>\n      <p>Correct answers: ' + _initialization.state.score + ' / ' + _initialization.questions.length + '</p>\n      <p style="color:' + scoreColor + ';">Brier score: ' + _initialization.state.brierScore.toFixed(2) + ' (' + scoreLabel + ')</p>\n      ' + confidenceDecileScores.map(function (_ref) {
      var decileRange = _ref.decileRange,
          score = _ref.score,
          correct = _ref.correct,
          total = _ref.total;

      if (total === 0) {
        return '<p>You did not answer any questions with ' + decileRange + '% confidence.</p>';
      } else {
        return '<p>When you were ' + decileRange + '% confident, you were correct ' + Math.round(score * 100) + '% of the time (' + correct + '/' + total + ').</p>';
      }
    }).join('') + '\n    ';

    resultsContainer.style.display = 'block';
    displayIndividualResults();
  }
}

function displayIndividualResults() {
  var resultsContainer = document.getElementById('results-container');
  for (var i = 0; i < _initialization.questions.length; i++) {
    var resultPara = document.createElement('p');

    if (_typeof(_initialization.correctAnswers[i]) === 'object') {
      var userAnswerString = _initialization.userAnswers[i].toString(); // Convert user's answer to string
      var isCorrect = _initialization.correctAnswers[i].includes(userAnswerString);
      resultPara.style.color = isCorrect ? 'green' : 'red';
      resultPara.innerHTML = 'Question ' + (i + 1) + ': ' + _initialization.questions[i].question + '<br>Your answer was ' + userAnswerString + ' with ' + _initialization.userConfidences[i] * 100 + '% confidence.<br>The correct answer is ' + _initialization.correctAnswers[i] + '.';
    } else {
      var _isCorrect = _initialization.correctAnswers[i] === _initialization.userAnswers[i];
      resultPara.style.color = _isCorrect ? 'green' : 'red';
      resultPara.innerHTML = 'Question ' + (i + 1) + ': ' + _initialization.questions[i].question + '<br>Your answer was ' + _initialization.userAnswers[i] + ' with ' + _initialization.userConfidences[i] * 100 + '% confidence.<br>The correct answer is ' + _initialization.correctAnswers[i] + '.';
    }
    resultsContainer.appendChild(resultPara);
  }
}

function displayLeaderboard(sessionId) {
  var db = firebase.firestore();
  db.collection('sessions').doc(sessionId).collection('answers').get().then(function (querySnapshot) {
    var scores = {};
    querySnapshot.forEach(function (doc) {
      var data = doc.data();
      var userId = doc.id;
      // Assuming 'answer' and 'confidence' are stored in each doc
      if (!scores[userId]) {
        scores[userId] = { correct: 0, total: 0 };
      }
      var isCorrect = _initialization.questions[scores[userId].total].correctAnswer === data.answer;
      if (isCorrect) {
        scores[userId].correct++;
      }
      scores[userId].total++;
    });

    // Display the leaderboard
    var leaderboardDiv = document.getElementById('leaderboard-container');
    leaderboardDiv.innerHTML = '<h2>Leaderboard</h2>';
    Object.keys(scores).forEach(function (userId) {
      var score = scores[userId];
      var scoreElement = document.createElement('p');
      scoreElement.innerText = userId + ': ' + score.correct + ' / ' + score.total;
      leaderboardDiv.appendChild(scoreElement);
    });
    leaderboardDiv.style.display = 'block';
  }).catch(function (error) {
    console.error("Error getting documents: ", error);
  });
}