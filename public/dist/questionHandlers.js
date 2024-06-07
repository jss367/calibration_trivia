'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadSessionQuestions = loadSessionQuestions;
exports.loadQuestionsSingle = loadQuestionsSingle;
exports.displayQuestion = displayQuestion;
exports.displayQuestionerScreen = displayQuestionerScreen;
exports.displayResponderScreen = displayResponderScreen;
exports.loadQuestionsParticipant = loadQuestionsParticipant;
exports.onQuestionIndexUpdated = onQuestionIndexUpdated;
exports.nextQuestion = nextQuestion;

var _initialization = require('./initialization.js');

var _resultsHandler = require('./resultsHandler.js');

var _util = require('./util.js');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function loadSessionQuestions(sessionId) {
  return db.collection('sessions').doc(sessionId).get().then(function (doc) {
    if (doc.exists) {
      console.log("Fetched document:", doc.data());
      if (doc.data().questions && doc.data().questions.length > 0) {
        _initialization.state.questions = doc.data().questions;
      } else {
        console.log("No questions available in this session!");
        throw new Error("No questions available");
      }
    } else {
      console.log("No such session!");
      throw new Error("No such session");
    }
  }).catch(function (error) {
    console.error("Error loading session questions:", error);
    throw error;
  });
}

function loadQuestionsSingle() {
  console.log("inside loadQuestionsSingle");
  var questionCount = parseInt(document.getElementById('question-count').value, 10);
  var checkboxes = document.querySelectorAll('.category-checkbox');
  var selectedFiles = Array.from(checkboxes).filter(function (checkbox) {
    return checkbox.checked;
  }).map(function (checkbox) {
    return checkbox.value;
  });

  // Continue only if at least one category is selected
  if (selectedFiles.length === 0) {
    console.log("Please select at least one category."); // Should this be an error?
    return;
  }

  var promises = selectedFiles.map(function (file) {
    return fetch(file).then(function (response) {
      if (!response.ok) {
        throw new Error('Network response was not ok for file ' + file);
      }
      return response.json().catch(function (err) {
        throw new Error('Invalid JSON in file ' + file + ': ' + err.message);
      });
    });
  });

  Promise.all(promises).then(function (loadedQuestionsArrays) {
    var _ref;

    // Flatten the array of arrays into a single array
    _initialization.state.questions = (_ref = []).concat.apply(_ref, _toConsumableArray(loadedQuestionsArrays));

    // Shuffle questions array here
    shuffleArray(_initialization.state.questions);

    // Only keep as many questions as the user requested
    _initialization.state.questions = _initialization.state.questions.slice(0, questionCount);

    console.log("modeSinglePlayer.checked is ", _initialization.modeSinglePlayer.checked);
    console.log("modeGroupParticipant.checked is ", modeGroupParticipant.checked);
    console.log("modeGroupQuestioner.checked is ", modeGroupQuestioner.checked);

    // Switch this to just one of the modes
    if (_initialization.modeSinglePlayer.checked) {
      displayQuestion(_initialization.state.currentQuestionIndex);
    }
  }).catch(function (error) {
    console.error('Error loading questions:', error.message);
  });
}

function displayQuestion(index) {
  // This is for single player mode

  if (!_initialization.state.questions[index]) {
    console.error("Question not found for index: ", index);
    return; // Exit the function if the question is not found
  }

  var question = _initialization.state.questions[index];

  // Create a new div for the question
  var questionDiv = document.createElement('div');

  // Initialize the answer input HTML
  var answerInputHTML = '';

  var options = ['A', 'B', 'C', 'D'];
  answerInputHTML = question.options.map(function (option, index) {
    return '\n    <div>\n      <input type="radio" id="option-' + options[index] + '" class="input-radio" name="answer" value="' + option + '">\n      <label for="option-' + options[index] + '">' + options[index] + ': ' + option + '</label>\n    </div>\n  ';
  }).join('');

  var confidenceInputHTML = (0, _util.getConfidenceInputHTML)();

  questionDiv.innerHTML = '\n    <h3>Question ' + (index + 1) + ' of ' + _initialization.state.questions.length + '</h3>\n    <h2>' + question.question + '</h2>\n    ' + answerInputHTML + '\n    ' + confidenceInputHTML + '\n  ';

  _initialization.questionContainer.innerHTML = ''; // Clear previous question
  _initialization.questionContainer.appendChild(questionDiv); // Append new question

  _initialization.nextButton.style.display = 'block';
}

function displayQuestionerScreen(sessionId) {
  loadSessionQuestions(sessionId).then(function () {
    // Display the first question
    _initialization.state.currentQuestionIndex = 0;
    (0, _resultsHandler.displayQuestionQuestioner)(_initialization.state.currentQuestionIndex);

    // Set up questioner-specific UI elements
    _initialization.quizContainer.style.display = 'block';
    modeSelectionContainer.style.display = 'none';
    startButtonContainer.style.display = 'none';
    questionCountContainer.style.display = 'none';
    categorySelectionContainer.style.display = 'none';
    sessionIdContainer.style.display = 'block'; // Show the session ID
    sessionIdContainer.innerHTML = '<p>Session ID: ' + sessionId + '</p>';

    // Show the next button for the questioner to proceed to the next question
    _initialization.nextButton.style.display = 'block';
    _initialization.nextButton.disabled = false; // Enable the next button for the questioner
  }).catch(function (error) {
    console.error("Error displaying questioner screen:", error);
  });
}

function displayResponderScreen(sessionId) {
  loadSessionQuestions(sessionId).then(function () {
    _initialization.quizContainer.style.display = 'block';
    modeSelectionContainer.style.display = 'none';
    startButtonContainer.style.display = 'none';
    usernameContainer.style.display = 'none'; // Hide username container if it's still visible
    sessionIdContainer.style.display = 'none'; // Hide session ID container if it's still visible

    // Additional setup for responder...
    // Initialize current question index
    _initialization.state.currentQuestionIndex = 0;

    // Display the first question
    (0, _resultsHandler.displayQuestionForGroupParticipant)(_initialization.state.currentQuestionIndex);

    // Start listening for updates on the current question index from Firestore
    (0, _resultsHandler.startListeningForQuestionUpdates)(sessionId);
  }).catch(function (error) {
    console.error("Error displaying responder screen:", error);
  });
}

function loadQuestionsParticipant() {
  var sessionId = (0, _util.getCurrentSessionId)();
  if (!sessionId) {
    console.error("No session ID found.");
    return;
  }

  db.collection('sessions').doc(sessionId).get().then(function (doc) {
    if (doc.exists && doc.data().questions) {
      _initialization.state.questions = doc.data().questions;
      _initialization.state.currentQuestionIndex = 0;
      (0, _resultsHandler.displayQuestionForGroupParticipant)(_initialization.state.currentQuestionIndex);
    } else {
      console.error("No questions available in this session or session does not exist.");
    }
  }).catch(function (error) {
    return console.error("Error loading session questions:", error);
  });
}

function onQuestionIndexUpdated(sessionData) {
  console.log('Inside onQuestionIndexUpdated');
  if (sessionData.currentQuestionIndex !== undefined && sessionData.currentQuestionIndex !== _initialization.state.currentQuestionIndex) {
    // Submit the current answer before moving to the next question
    if (modeGroupParticipant.checked) {
      submitAnswer();
    }
    // Update the current question index
    _initialization.state.currentQuestionIndex = sessionData.currentQuestionIndex;
    (0, _resultsHandler.displayQuestionForGroupParticipant)(_initialization.state.currentQuestionIndex);
  }
}

function nextQuestion(sessionId) {
  // Increment the current question index
  _initialization.state.currentQuestionIndex++;
  // Check if there are more questions
  if (_initialization.state.currentQuestionIndex < _initialization.state.questions.length) {
    (0, _resultsHandler.displayQuestionForGroupParticipant)(_initialization.state.currentQuestionIndex);
  } else {
    displayResults();
  }
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var _ref2 = [array[j], array[i]];
    array[i] = _ref2[0];
    array[j] = _ref2[1];
  }
}