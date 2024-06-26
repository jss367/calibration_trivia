// eventHandlers.js

import {
    startButtonContainer,
    sessionIdContainer,
    categorySelectionContainer,
    questionCountContainer,
    sessionIDSelectionContainer,
    usernameContainer,
    startQuizButton,
    nextButton,
    modeSelectionContainer,
    quizContainer,
    modeSinglePlayer,
    modeGroupParticipant,
    modeGroupQuestioner,
    questions,
    currentQuestionIndex,
    userAnswers,
    correctAnswers,
    userConfidences,
    score,
    brierScore
} from './shared.js';

import { updateNextButton, loadAvailableSessions } from './initialization.js';
import { joinSelectedSession, getCurrentSessionId } from './sessionManagement.js';
import { loadQuestionsSingle, displayQuestionSinglePlayer } from './singlePlayer.js';
import { displayQuestionQuestioner } from './groupQuestioner.js';
import { submitAnswer, nextQuestion } from './quizLogic.js';
import { displayResults } from './results.js';
import { shuffleArray } from './utilities.js';

// Event listener for mode selection
export function initModeSelectionListener() {
    modeSelectionContainer.addEventListener('change', (event) => {
        startButtonContainer.style.display = 'flex';

        if (event.target.value === 'group-questioner') {
            // Group Questioner specific elements
            sessionIdContainer.style.display = 'block';
            categorySelectionContainer.style.display = 'block';
            questionCountContainer.style.display = 'block';
            sessionIDSelectionContainer.style.display = 'none';
            usernameContainer.style.display = 'none';
            document.getElementById('start-quiz').disabled = false;
            startQuizButton.removeEventListener('click', joinSelectedSession);
            nextButton.disabled = true; // Initially disable the Next button

            document.getElementById('session-id').addEventListener('input', updateNextButton);
            document.querySelectorAll('.category-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateNextButton);
            });
        }
        else if (event.target.value === 'group-participant') {
            // Group Participant specific elements
            sessionIdContainer.style.display = 'none';
            usernameContainer.style.display = 'block';
            sessionIDSelectionContainer.style.display = 'block';
            loadAvailableSessions();
            // Hide elements not used in Group Participant mode
            questionCountContainer.style.display = 'none';
            categorySelectionContainer.style.display = 'none';
            startQuizButton.removeEventListener('click', joinSelectedSession); // Remove existing listener if any
            startQuizButton.addEventListener('click', joinSelectedSession);
        }
        else if (event.target.value === 'single') {
            // Single Player specific elements
            sessionIdContainer.style.display = 'none';
            usernameContainer.style.display = 'none'; // Hide the username input field
            questionCountContainer.style.display = 'block';
            categorySelectionContainer.style.display = 'block';
            sessionIDSelectionContainer.style.display = 'none';
            document.getElementById('start-quiz').disabled = false; // Enable start button directly for single player
            startQuizButton.removeEventListener('click', joinSelectedSession);
        } else {
            // Default case: Hide all specific elements
            questionCountContainer.style.display = 'none';
            categorySelectionContainer.style.display = 'none';
            sessionIDSelectionContainer.style.display = 'none';
            document.getElementById('start-quiz').disabled = true;
            startQuizButton.removeEventListener('click', joinSelectedSession);
        }
    });
}

// Start Quiz button event listener
export function initStartQuizListener() {
    startQuizButton.addEventListener('click', () => {
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        console.log("Selected Mode: ", selectedMode);

        // Hide UI elements not needed once the quiz starts
        usernameContainer.style.display = 'none';
        modeSelectionContainer.style.display = 'none';
        startButtonContainer.style.display = 'none';
        questionCountContainer.style.display = 'none';
        categorySelectionContainer.style.display = 'none';

        if (selectedMode === 'single') {
            console.log("Starting Single Player Mode");
            const randomUsername = generateRandomUsername();
            localStorage.setItem('username', randomUsername);
            quizContainer.style.display = 'block';
            loadQuestionsSingle();
        } else if (selectedMode === 'group-participant') {
            console.log("Starting Group Participant Mode");
            const selectedSessionId = document.getElementById('session-id-select').value;
            if (selectedSessionId) {
                localStorage.setItem('currentSessionId', selectedSessionId);
                window.location.href = `/${selectedSessionId}?role=responder`; // Redirect to the session URL with role
            } else {
                console.log("Please select a session.");
            }
        } else if (selectedMode === 'group-questioner') {
            console.log("Starting Group Questioner Mode");
            const sessionId = document.getElementById('session-id').value.trim();
            if (sessionId) {
                // Save the session ID to Firestore and start the quiz
                const questionCount = parseInt(document.getElementById('question-count').value, 10);
                const checkboxes = document.querySelectorAll('.category-checkbox');
                const selectedFiles = Array.from(checkboxes)
                    .filter(checkbox => checkbox.checked)
                    .map(checkbox => checkbox.value);

                if (selectedFiles.length === 0) {
                    console.log("Please select at least one category.");
                    return;
                }

                const promises = selectedFiles.map(file => fetch(file).then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok for file ${file}`);
                    }
                    return response.json().catch(err => {
                        throw new Error(`Invalid JSON in file ${file}: ${err.message}`);
                    });
                }));

                Promise.all(promises)
                    .then(loadedQuestionsArrays => {
                        // Flatten the array of arrays into a single array
                        questions = [].concat(...loadedQuestionsArrays);
                        shuffleArray(questions);
                        questions = questions.slice(0, questionCount);

                        return firebase.firestore().collection('sessions').doc(sessionId).set({
                            questions: questions,
                            active: true,
                            currentQuestionIndex: 0
                        });
                    })
                    .then(() => {
                        console.log("Session ID set successfully:", sessionId);
                        localStorage.setItem('currentSessionId', sessionId);
                        window.location.href = `/${sessionId}?role=questioner`; // Redirect to the session URL with role
                    })
                    .catch(error => console.error("Error setting session ID or loading questions:", error));
            } else {
                console.log("Please enter a session ID.");
            }
        }
    });
}

// Next button event listener
export function initNextButtonListener() {
    nextButton.addEventListener('click', () => {
        console.log("Next button has been clicked");
        console.log("Current Mode:");
        console.log("  Single Player:", modeSinglePlayer.checked);
        console.log("  Group Participant:", modeGroupParticipant.checked);
        console.log("  Group Questioner:", modeGroupQuestioner.checked);
        console.log("Current Question Index:", currentQuestionIndex);
        console.log("Total Questions:", questions.length);
        console.log("User Answers:", userAnswers);
        console.log("Correct Answers:", correctAnswers);
        console.log("User Confidences:", userConfidences);
        console.log("Score:", score);
        console.log("Brier Score:", brierScore);

        // Handling for Group Questioner mode
        if (modeGroupQuestioner.checked) {
            console.log("Handling Group Questioner mode");

            // Increment the current question index
            currentQuestionIndex++;
            console.log("Updated Question Index (Questioner):", currentQuestionIndex);

            // Check if there are more questions
            if (currentQuestionIndex < questions.length) {
                displayQuestionQuestioner(currentQuestionIndex); // Display next question for Group Questioner
            } else {
                displayResults(); // Display results if it's the last question
            }
        }
        else if (modeGroupParticipant.checked) {
            console.log("Handling Group Participant mode");
            submitAnswer();
            const sessionId = getCurrentSessionId(); // Retrieve the current session ID for group modes
            console.log("Session ID:", sessionId);
            nextQuestion(sessionId); // Advance to the next question in the session for Group Participant mode
        }
        else {
            console.log("Handling Single Player mode");
            // For Single Player mode, handle answer submission and question navigation
            submitAnswer();

            // Increment the current question index
            currentQuestionIndex++;
            console.log("Updated Question Index (Single Player):", currentQuestionIndex);

            // Check if there are more questions
            if (currentQuestionIndex < questions.length) {
                displayQuestionSinglePlayer(currentQuestionIndex); // Display next question for Single Player
            } else {
                displayResults(); // Display results if it's the last question
            }
        }
    });
}
