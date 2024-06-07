// DOM Elements
const quizContainer = document.getElementById('quiz-container');
const questionContainer = document.getElementById('question-container');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
const usernameContainer = document.getElementById('username-container');
const startQuizButton = document.getElementById('start-quiz');
const leaderboardContainer = document.getElementById('leaderboard-container');
const categorySelectionContainer = document.getElementById('category-selection-container');
const sessionIDSelectionContainer = document.getElementById('session-id-selection-container');
const modeSelectionContainer = document.getElementById('mode-selection-container');
const modeSinglePlayer = document.getElementById('mode-single');
const modeGroupParticipant = document.getElementById('mode-group-participant');
const modeGroupQuestioner = document.getElementById('mode-group-questioner');
const questionCountContainer = document.getElementById('question-count-container');
const startButtonContainer = document.getElementById('start-button-container');
const sessionIdContainer = document.getElementById('session-id-container');

// Quiz state variables
let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let brierScore = 0;
let userAnswers = [];
let correctAnswers = [];
let userConfidences = [];

function initialize() {
  // Initializing event listeners from eventListeners.js
  import('./eventListeners.js').then(module => {
    module.setupEventListeners();
  });

  // Initialize other settings and state
  updateStartButtonState(); // Initial call to set the correct state of the start button

  // Retrieve the mode from local storage and set it
  const savedMode = localStorage.getItem('selectedMode');
  if (savedMode) {
    document.getElementById(`mode-${savedMode}`).checked = true;
    handleModeSelection();
  }

  // Check URL for session ID and user role
  const pathSegments = window.location.pathname.split('/').filter(segment => segment); // Get non-empty segments
  const sessionIdFromURL = pathSegments[0]; // Assuming the session ID is the first segment
  const urlParams = new URLSearchParams(window.location.search);
  const userRole = urlParams.get('role'); // Role can be 'questioner' or 'responder'

  if (sessionIdFromURL) {
    console.log("Session ID from URL:", sessionIdFromURL);
    localStorage.setItem('currentSessionId', sessionIdFromURL);
    if (userRole === 'questioner') {
      displayQuestionerScreen(sessionIdFromURL);
    } else if (userRole === 'responder') {
      displayResponderScreen(sessionIdFromURL);
    }
  }
}

export {
  brierScore,
  categorySelectionContainer,
  correctAnswers,
  currentQuestionIndex,
  leaderboardContainer,
  modeGroupParticipant,
  modeGroupQuestioner,
  modeSelectionContainer,
  modeSinglePlayer,
  nextButton,
  questionContainer,
  questionCountContainer,
  questions,
  quizContainer,
  resultsContainer,
  score,
  sessionIDSelectionContainer,
  sessionIdContainer,
  startButtonContainer,
  startQuizButton,
  userAnswers,
  userConfidences,
  usernameContainer
};

document.addEventListener('DOMContentLoaded', initialize);
