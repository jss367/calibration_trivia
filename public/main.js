// main.js
import { initialize, handleModeSelection, updateStartButtonState } from './initialization.js';
import { loadQuestionsSingle, displayQuestion } from './singlePlayer.js';
import { loadSessionQuestions, displayQuestionQuestioner, questionerNextQuestion } from './groupQuestioner.js';
import { loadQuestionsParticipant, displayQuestionForGroupParticipant, onQuestionIndexUpdated } from './groupParticipant.js';
import { createSession, joinSelectedSession, getCurrentSessionId } from './sessionManagement.js';
import { submitAnswer, getConfidenceInputHTML, nextQuestion, calculateConfidenceDecileScores } from './quizLogic.js';
import { displayLeaderboard } from './leaderboard.js';
import { displayResults } from './results.js';
import { saveQuestionsToFirestore, submitAnswerToFirestore } from './firestore.js';

const appVersion = '1.3.2';
console.log('App Version:', appVersion);

// Global variables
let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let brierScore = 0;
let userAnswers = [];
let correctAnswers = [];
let userConfidences = [];

// DOM elements
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

// Event listeners
document.addEventListener('DOMContentLoaded', initialize);
modeSelectionContainer.addEventListener('change', handleModeSelection);
startQuizButton.addEventListener('click', startQuiz);
nextButton.addEventListener('click', handleNextButton);

document.getElementById('username').addEventListener('input', function () {
    const usernameInput = this.value.trim();
    const startButton = document.getElementById('start-quiz');

    // Enable the start button only if the username is not empty or if Group Questioner mode is selected
    if (usernameInput.length > 0 || modeGroupQuestioner.checked) {
        startButton.disabled = false;
    } else {
        startButton.disabled = true;
    }
});

// Initially disable the start button (except for group questioner mode)
document.getElementById('start-quiz').disabled = !modeGroupQuestioner.checked;

nextButton.classList.add('button-spacing');

// Functions
function startQuiz() {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;

    // Hide UI elements
    usernameContainer.style.display = 'none';
    modeSelectionContainer.style.display = 'none';
    startButtonContainer.style.display = 'none';
    questionCountContainer.style.display = 'none';
    categorySelectionContainer.style.display = 'none';

    if (selectedMode === 'single') {
        loadQuestionsSingle();
    } else if (selectedMode === 'group-participant') {
        joinSelectedSession();
    } else if (selectedMode === 'group-questioner') {
        createSession();
    }
}

function handleNextButton() {
    if (modeGroupQuestioner.checked) {
        const sessionId = getCurrentSessionId();
        questionerNextQuestion(sessionId);
    } else if (modeGroupParticipant.checked) {
        submitAnswer();
        const sessionId = getCurrentSessionId();
        nextQuestion(sessionId);
    } else {
        submitAnswer();
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion(currentQuestionIndex);
        } else {
            displayResults();
        }
    }
}

// Export variables and functions that need to be accessed by other modules
export {
    currentQuestionIndex,
    questions,
    score,
    brierScore,
    userAnswers,
    correctAnswers,
    userConfidences,
    quizContainer,
    questionContainer,
    nextButton,
    resultsContainer,
    usernameContainer,
    startQuizButton,
    leaderboardContainer,
    categorySelectionContainer,
    sessionIDSelectionContainer,
    modeSelectionContainer,
    modeSinglePlayer,
    modeGroupParticipant,
    modeGroupQuestioner,
    questionCountContainer,
    startButtonContainer,
    sessionIdContainer
};
