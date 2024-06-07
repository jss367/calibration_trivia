// Exporting an object to hold the state
export const state = {
  currentQuestionIndex: 0,
  questions: [],
  score: 0,
  userAnswers: [],
  correctAnswers: [],
  userConfidences: []
};

export let brierScore = 0;  // Change const to let


// Other DOM elements and constants
export const quizContainer = document.getElementById('quiz-container');
export const questionContainer = document.getElementById('question-container');
export const nextButton = document.getElementById('next-button');
export const resultsContainer = document.getElementById('results-container');
export const usernameContainer = document.getElementById('username-container');
export const startQuizButton = document.getElementById('start-quiz');
export const leaderboardContainer = document.getElementById('leaderboard-container');
export const categorySelectionContainer = document.getElementById('category-selection-container');
export const sessionIDSelectionContainer = document.getElementById('session-id-selection-container');
export const modeSelectionContainer = document.getElementById('mode-selection-container');
export const modeSinglePlayer = document.getElementById('mode-single');
export const modeGroupParticipant = document.getElementById('mode-group-participant');
export const modeGroupQuestioner = document.getElementById('mode-group-questioner');
export const questionCountContainer = document.getElementById('question-count-container');
export const startButtonContainer = document.getElementById('start-button-container');
export const sessionIdContainer = document.getElementById('session-id-container');
