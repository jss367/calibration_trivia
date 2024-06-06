import { setupEventListeners } from './eventListeners.js';
import { handleModeSelection } from './modeHandlers.js';

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

export function initialize() {
  setupEventListeners();
  const savedMode = localStorage.getItem('selectedMode');
  if (savedMode) {
    document.getElementById(`mode-${savedMode}`).checked = true;
    handleModeSelection();
  }
}

export {
  categorySelectionContainer, leaderboardContainer, modeGroupParticipant,
  modeGroupQuestioner, modeSelectionContainer,
  modeSinglePlayer, nextButton, questionContainer, questionCountContainer, quizContainer, resultsContainer, sessionIDSelectionContainer, sessionIdContainer, startButtonContainer, startQuizButton, usernameContainer
};
