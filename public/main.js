// main.js

const appVersion = process.env.APP_VERSION;
console.log('App Version:', appVersion);

import { initialize, handleModeSelection } from './initialization.js';
import { loadQuestionsSingle, displayQuestion } from './singlePlayer.js';
import { questionerNextQuestion } from './groupQuestioner.js';
import { loadQuestionsParticipant, displayQuestionForGroupParticipant } from './groupParticipant.js';
import { createSession, joinSelectedSession, getCurrentSessionId } from './sessionManagement.js';
import { submitAnswer, nextQuestion } from './quizLogic.js';
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




// Event listeners
document.addEventListener('DOMContentLoaded', initialize);
modeSelectionContainer.addEventListener('change', handleModeSelection);
startQuizButton.addEventListener('click', () => {
    console.log("Start button clicked");
    startQuiz();
});
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
    console.log("startQuiz function called");
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    console.log("Selected mode:", selectedMode);

    // Hide UI elements
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
        // Handle unknown mode (e.g., show an error message to the user)
    }
}

function hideUIElements(elements) {
    elements.forEach(element => {
        element.style.display = 'none';
    });
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
            // Handle error (e.g., show an error message to the user)
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
    createSession();
    loadSessionQuestions(getCurrentSessionId())
        .then(() => {
            console.log("Questions loaded successfully for group questioner");
            displayQuestionQuestioner(0);
        })
        .catch(error => {
            console.error("Failed to load questions for group questioner:", error);
            // Handle error
        });
}


function handleNextButton() {
    if (modeGroupQuestioner.checked) {
        const sessionId = getCurrentSessionId();
        questionerNextQuestion(sessionId);
    } else {
        if (submitAnswer()) {  // Only proceed if submitAnswer was successful
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
            // Alert the user that they need to answer the question and provide a confidence level
            alert("Please select an answer and provide a confidence level before proceeding.");
        }
    }
} ``


document.getElementById('show-leaderboard').addEventListener('click', () => {
    const sessionId = getCurrentSessionId();
    if (sessionId) {
        displayLeaderboard(sessionId);
    } else {
        console.error('No session ID found for displaying leaderboard');
    }
});
