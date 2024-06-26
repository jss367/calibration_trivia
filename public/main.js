// main.js

const appVersion = '1.3.9';
console.log('App Version:', appVersion);

import { initialize, handleModeSelection } from './initialization.js';
import { loadQuestionsSingle, displayQuestion } from './singlePlayer.js';
import { questionerNextQuestion } from './groupQuestioner.js';
import { loadQuestionsParticipant } from './groupParticipant.js';
import { createSession, joinSelectedSession, getCurrentSessionId } from './sessionManagement.js';
import { submitAnswer, nextQuestion } from './quizLogic.js';
import { displayResults } from './results.js';

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
    usernameContainer.style.display = 'none';
    modeSelectionContainer.style.display = 'none';
    startButtonContainer.style.display = 'none';
    questionCountContainer.style.display = 'none';
    categorySelectionContainer.style.display = 'none';
    console.log("UI elements hidden");

    if (selectedMode === 'single') {
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
    } else if (selectedMode === 'group-participant') {
        console.log("Starting group participant mode");
        joinSelectedSession();
        loadQuestionsParticipant()
            .then(() => {
                console.log("Questions loaded successfully for group participant");
                displayQuestionForGroupParticipant(0);
            })
            .catch(error => {
                console.error("Failed to load questions for group participant:", error);
                // Handle error
            });
    } else if (selectedMode === 'group-questioner') {
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
