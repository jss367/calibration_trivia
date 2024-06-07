'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupEventListeners = setupEventListeners;

var _initialization = require('./initialization.js');

var _modeHandlers = require('./modeHandlers.js');

var _questionHandlers = require('./questionHandlers.js');

var _sessionHandlers = require('./sessionHandlers.js');

var _util = require('./util.js');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function setupEventListeners() {
  modeSelectionContainer.addEventListener('change', _modeHandlers.handleModeSelection);
  document.getElementById('username').addEventListener('input', _util.updateStartButtonState);
  document.getElementById('session-id').addEventListener('input', _util.updateStartButtonState);
  document.querySelectorAll('.category-checkbox').forEach(function (checkbox) {
    checkbox.addEventListener('change', _util.updateStartButtonState);
  });

  _initialization.nextButton.addEventListener('click', function () {
    console.log("Next button has been clicked");
    console.log("Current Mode:");
    console.log("  Single Player:", _initialization.modeSinglePlayer.checked);
    console.log("  Group Participant:", _initialization.modeGroupParticipant.checked);
    console.log("  Group Questioner:", _initialization.modeGroupQuestioner.checked);
    console.log("Current Question Index:", _initialization.state.currentQuestionIndex);
    console.log("Total Questions:", _initialization.state.questions.length);
    console.log("User Answers:", _initialization.state.userAnswers);
    console.log("Correct Answers:", _initialization.state.correctAnswers);
    console.log("User Confidences:", _initialization.state.userConfidences);
    console.log("Score:", _initialization.state.score);
    console.log("Brier Score:", _initialization.state.brierScore);

    // Handling for Group Questioner mode
    if (_initialization.modeGroupQuestioner.checked) {
      console.log("Handling Group Questioner mode");

      // Increment the current question index
      _initialization.state.currentQuestionIndex++;
      console.log("Updated Question Index (Questioner):", _initialization.state.currentQuestionIndex);

      // Check if there are more questions
      if (_initialization.state.currentQuestionIndex < _initialization.state.questions.length) {
        (0, _questionHandlers.displayQuestionQuestioner)(_initialization.state.currentQuestionIndex); // Display next question for Group Questioner
      } else {
        (0, _questionHandlers.displayResults)(); // Display results if it's the last question
      }
    } else if (_initialization.modeGroupParticipant.checked) {
      console.log("Handling Group Participant mode");
      (0, _questionHandlers.submitAnswer)();
      var sessionId = (0, _util.getCurrentSessionId)(); // Retrieve the current session ID for group modes
      console.log("Session ID:", sessionId);
      (0, _questionHandlers.nextQuestion)(sessionId); // Advance to the next question in the session for Group Participant mode
    } else {
      console.log("Handling Single Player mode");
      // For Single Player mode, handle answer submission and question navigation
      (0, _questionHandlers.submitAnswer)();

      // Increment the current question index
      _initialization.state.currentQuestionIndex++;
      console.log("Updated Question Index (Single Player):", _initialization.state.currentQuestionIndex);

      // Check if there are more questions
      if (_initialization.state.currentQuestionIndex < _initialization.state.questions.length) {
        (0, _questionHandlers.displayQuestion)(_initialization.state.currentQuestionIndex); // Display next question for Single Player
      } else {
        (0, _questionHandlers.displayResults)(); // Display results if it's the last question
      }
    }
  });

  // Event listener for mode selection
  modeSelectionContainer.addEventListener('change', function (event) {
    startButtonContainer.style.display = 'flex';

    if (event.target.value === 'group-questioner') {
      // Group Questioner specific elements
      sessionIdContainer.style.display = 'block';
      categorySelectionContainer.style.display = 'block';
      questionCountContainer.style.display = 'block';
      sessionIDSelectionContainer.style.display = 'none';
      usernameContainer.style.display = 'none';
      document.getElementById('start-quiz').disabled = false;
      startQuizButton.removeEventListener('click', _sessionHandlers.joinSelectedSession);
      _initialization.nextButton.disabled = true; // Initially disable the Next button

      document.getElementById('session-id').addEventListener('input', _util.updateNextButton);
      document.querySelectorAll('.category-checkbox').forEach(function (checkbox) {
        checkbox.addEventListener('change', _util.updateNextButton);
      });
    } else if (event.target.value === 'group-participant') {
      // Group Participant specific elements
      sessionIdContainer.style.display = 'none';
      usernameContainer.style.display = 'block';
      sessionIDSelectionContainer.style.display = 'block';
      (0, _sessionHandlers.loadAvailableSessions)();
      // Hide elements not used in Group Participant mode
      questionCountContainer.style.display = 'none';
      categorySelectionContainer.style.display = 'none';
      startQuizButton.removeEventListener('click', _sessionHandlers.joinSelectedSession); // Remove existing listener if any
      startQuizButton.addEventListener('click', _sessionHandlers.joinSelectedSession);
    } else if (event.target.value === 'single') {
      // Single Player specific elements
      sessionIdContainer.style.display = 'none';
      usernameContainer.style.display = 'none'; // Hide the username input field
      questionCountContainer.style.display = 'block';
      categorySelectionContainer.style.display = 'block';
      sessionIDSelectionContainer.style.display = 'none';
      document.getElementById('start-quiz').disabled = false; // Enable start button directly for single player
      startQuizButton.removeEventListener('click', _sessionHandlers.joinSelectedSession);
    } else {
      // Default case: Hide all specific elements
      questionCountContainer.style.display = 'none';
      categorySelectionContainer.style.display = 'none';
      sessionIDSelectionContainer.style.display = 'none';
      document.getElementById('start-quiz').disabled = true;
      startQuizButton.removeEventListener('click', _sessionHandlers.joinSelectedSession);
    }
  });

  // Additional event listener for username input
  document.getElementById('username').addEventListener('input', function () {
    var usernameInput = this.value.trim();
    var startButton = document.getElementById('start-quiz');

    // Enable the start button only if the username is not empty or if Group Questioner mode is selected
    if (usernameInput.length > 0 || _initialization.modeGroupQuestioner.checked) {
      startButton.disabled = false;
    } else {
      startButton.disabled = true;
    }
  });

  // Inside the startQuizButton event listener
  startQuizButton.addEventListener('click', function () {
    var selectedMode = document.querySelector('input[name="mode"]:checked').value;
    console.log("Selected Mode: ", selectedMode);

    // Hide UI elements not needed once the quiz starts
    usernameContainer.style.display = 'none';
    modeSelectionContainer.style.display = 'none';
    startButtonContainer.style.display = 'none';
    questionCountContainer.style.display = 'none';
    categorySelectionContainer.style.display = 'none';

    if (selectedMode === 'single') {
      console.log("Starting Single Player Mode");
      var randomUsername = (0, _sessionHandlers.generateRandomUsername)();
      localStorage.setItem('username', randomUsername);
      quizContainer.style.display = 'block';
      loadQuestionsSingle();
    } else if (selectedMode === 'group-participant') {
      console.log("Starting Group Participant Mode");
      var selectedSessionId = document.getElementById('session-id-select').value;
      if (selectedSessionId) {
        localStorage.setItem('currentSessionId', selectedSessionId);
        window.location.href = '/' + selectedSessionId + '?role=responder'; // Redirect to the session URL with role
      } else {
        console.log("Please select a session.");
      }
    } else if (selectedMode === 'group-questioner') {
      console.log("Starting Group Questioner Mode");
      var sessionId = document.getElementById('session-id').value.trim();
      if (sessionId) {
        // Save the session ID to Firestore and start the quiz
        var questionCount = parseInt(document.getElementById('question-count').value, 10);
        var checkboxes = document.querySelectorAll('.category-checkbox');
        var selectedFiles = Array.from(checkboxes).filter(function (checkbox) {
          return checkbox.checked;
        }).map(function (checkbox) {
          return checkbox.value;
        });

        if (selectedFiles.length === 0) {
          console.log("Please select at least one category.");
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
          shuffleArray(_initialization.state.questions);
          _initialization.state.questions = _initialization.state.questions.slice(0, questionCount);

          return (0, _sessionHandlers.saveQuestionsToFirestore)(sessionId, _initialization.state.questions);
        }).then(function () {
          console.log("Session ID set successfully:", sessionId);
          localStorage.setItem('currentSessionId', sessionId);
          window.location.href = '/' + sessionId + '?role=questioner'; // Redirect to the session URL with role
        }).catch(function (error) {
          return console.error("Error setting session ID or loading questions:", error);
        });
      } else {
        console.log("Please enter a session ID.");
      }
    }
  });

  _initialization.nextButton.classList.add('button-spacing');
}