// main.js

const appVersion = '1.5.0';
console.log('App Version:', appVersion);

import { initialize, handleModeSelection, setupShareButton } from './initialization.js';
import { loadQuestionsSingle, displayQuestion } from './singlePlayer.js';
import { questionerNextQuestion, displayQuestionerScreen } from './groupQuestioner.js';
import { loadQuestionsParticipant, displayQuestionForGroupParticipant } from './groupParticipant.js';
import { createSession, joinSelectedSession, getCurrentSessionId, loadSessionQuestions } from './sessionManagement.js';
import { submitAnswer } from './quizLogic.js';
import { displayResults } from './results.js';
import { displayLeaderboard } from './leaderboard.js';
import {
    startButtonContainer,
    categorySelectionContainer,
    questionCountContainer,
    usernameContainer,
    startQuizButton,
    nextButton,
    modeSelectionContainer,
    modeGroupParticipant,
    modeGroupQuestioner,
    questions,
    currentQuestionIndex,
} from './shared.js';

function initializeEventListeners() {
    document.addEventListener('DOMContentLoaded', initialize);
    modeSelectionContainer.addEventListener('change', handleModeSelection);
    startQuizButton.addEventListener('click', () => {
        console.log("Start button clicked");
        startQuiz();
    });
    nextButton.addEventListener('click', handleNextButton);
    document.getElementById('username').addEventListener('input', handleUsernameInput);
    document.getElementById('show-leaderboard').addEventListener('click', handleShowLeaderboard);
}

function handleUsernameInput() {
    const usernameInput = this.value.trim();
    const startButton = document.getElementById('start-quiz');
    startButton.disabled = !(usernameInput.length > 0 || modeGroupQuestioner.checked);
}

function handleShowLeaderboard() {
    const sessionId = getCurrentSessionId();
    if (sessionId) {
        displayLeaderboard(sessionId);
    } else {
        console.error('No session ID found for displaying leaderboard');
    }
}

function startQuiz() {
    console.log("startQuiz function called");
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    console.log("Selected mode:", selectedMode);

    hideUIElements([
        usernameContainer,
        modeSelectionContainer,
        startButtonContainer,
        questionCountContainer,
        categorySelectionContainer
    ]);
    console.log("UI elements hidden");

    switch (selectedMode) {
        case 'single':
            handleSinglePlayerMode();
            break;
        case 'group-participant':
            handleGroupParticipantMode();
            break;
        case 'group-questioner':
            handleGroupQuestionerMode();
            break;
        default:
            console.error("Unknown mode selected:", selectedMode);
    }
}

function hideUIElements(elements) {
    elements.forEach(element => element.style.display = 'none');
}

function handleSinglePlayerMode() {
    console.log("Starting single player mode");
    loadQuestionsSingle()
        .then(() => {
            console.log("Questions loaded successfully for single player");
            displayQuestion(0);
        })
        .catch(error => {
            console.error("Failed to load questions for single player:", error);
        });
}

function handleGroupParticipantMode() {
    console.log("Starting group participant mode");
    return joinSelectedSession()
        .then((sessionId) => {
            console.log("Session joined successfully:", sessionId);
            return loadQuestionsParticipant();
        })
        .then(() => {
            console.log("Questions loaded successfully for group participant");
            displayQuestionForGroupParticipant(0);
        })
        .catch(error => {
            console.error("Failed to start group participant mode:", error);
        });
}

function handleGroupQuestionerMode() {
    console.log("Starting group questioner mode");
    createSession()
        .then((sessionId) => {
            console.log("Session created successfully:", sessionId);
            return loadSessionQuestions(sessionId);
        })
        .then(() => {
            const sessionId = getCurrentSessionId();
            console.log("Questions loaded successfully for group questioner");
            displayQuestionerScreen(sessionId);
            setupShareButton(sessionId);
        })
        .catch(error => {
            console.error("Failed to create session or load questions for group questioner:", error);
        });
}

function handleNextButton() {
    if (modeGroupQuestioner.checked) {
        const sessionId = getCurrentSessionId();
        questionerNextQuestion(sessionId);
    } else if (submitAnswer()) {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            if (modeGroupParticipant.checked) {
                displayQuestionForGroupParticipant(currentQuestionIndex);
            } else {
                displayQuestion(currentQuestionIndex);
            }
        } else {
            displayResults();
        }
    } else {
        alert("Please select an answer and provide a confidence level before proceeding.");
    }
}

nextButton.classList.add('button-spacing');
document.getElementById('start-quiz').disabled = !modeGroupQuestioner.checked;

initializeEventListeners();
