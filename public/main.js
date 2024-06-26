// main.js
import { initialize, handleModeSelection } from './initialization.js';
import { loadQuestionsSingle, displayQuestion } from './singlePlayer.js';
import { questionerNextQuestion } from './groupQuestioner.js';
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


const appVersion = '1.3.5';
console.log('App Version:', appVersion);


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
        loadQuestionsSingle()
            .then(() => {
                displayQuestion(0);
            })
            .catch(error => {
                console.error("Failed to load questions:", error);
                // Handle error (e.g., show an error message to the user)
            });
    } else if (selectedMode === 'group-participant') {
        joinSelectedSession();
        // Assuming loadQuestionsParticipant returns a promise
        loadQuestionsParticipant()
            .then(() => {
                displayQuestionForGroupParticipant(0);
            })
            .catch(error => {
                console.error("Failed to load participant questions:", error);
                // Handle error
            });
    } else if (selectedMode === 'group-questioner') {
        createSession();
        loadSessionQuestions(getCurrentSessionId())
            .then(() => {
                displayQuestionQuestioner(0);
            })
            .catch(error => {
                console.error("Failed to load questioner questions:", error);
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
