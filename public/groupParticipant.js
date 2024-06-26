
import {
    startButtonContainer,
    sessionIdContainer,
    usernameContainer,
    nextButton,
    modeSelectionContainer,
    quizContainer,
    modeGroupParticipant,
    questions,
    currentQuestionIndex, questionContainer

} from './shared.js';

import { getCurrentSessionId } from './sessionManagement.js';
import { getConfidenceInputHTML } from './quizLogic.js';

export function loadQuestionsParticipant() {
    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        console.error("No session ID found.");
        return;
    }

    firebase.firestore().collection('sessions').doc(sessionId).get()
        .then(doc => {
            if (doc.exists && doc.data().questions) {
                questions = doc.data().questions;
                currentQuestionIndex = 0;
                displayQuestionForGroupParticipant(currentQuestionIndex);
            } else {
                console.error("No questions available in this session or session does not exist.");
            }
        })
        .catch(error => console.error("Error loading session questions:", error));
}



export function displayQuestionForGroupParticipant(index) {
    if (!questions[index]) {
        console.error("Question not found for index: ", index);
        return; // Exit the function if the question is not found
    }

    const question = questions[index];
    const questionDiv = document.createElement('div');

    let answerInputHTML = question.options.map((option, index) => `
      <div>
        <input type="radio" id="option-${index}" class="input-radio" name="answer" value="${option}">
        <label for="option-${index}">${String.fromCharCode(65 + index)}: ${option}</label>
      </div>
    `).join('');

    questionDiv.innerHTML = `
      <h3>Question ${index + 1} of ${questions.length}</h3>
      ${answerInputHTML}
      ${getConfidenceInputHTML()}
    `;

    questionContainer.innerHTML = ''; // Clear previous content
    questionContainer.appendChild(questionDiv); // Append new content

    // Make sure the quiz container is visible
    quizContainer.style.display = 'block';
    nextButton.style.display = 'block';
}



// Function to display the responder's screen
export function displayResponderScreen(sessionId) {
    // Load and display questions, setup responder-specific UI
    loadSessionQuestions(sessionId)
        .then(() => {
            quizContainer.style.display = 'block';
            modeSelectionContainer.style.display = 'none';
            startButtonContainer.style.display = 'none';
            usernameContainer.style.display = 'none'; // Hide username container if it's still visible
            sessionIdContainer.style.display = 'none'; // Hide session ID container if it's still visible

            // Additional setup for responder...
            // Initialize current question index
            currentQuestionIndex = 0;

            // Display the first question
            displayQuestionForGroupParticipant(currentQuestionIndex);

            // Start listening for updates on the current question index from Firestore
            startListeningForQuestionUpdates(sessionId);
        })
        .catch(error => {
            console.error("Error displaying responder screen:", error);
        });
}

// Function to start listening for updates on the current question index from Firestore
export function startListeningForQuestionUpdates(sessionId) {
    firebase.firestore().collection('sessions').doc(sessionId).onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.currentQuestionIndex !== undefined && data.currentQuestionIndex !== currentQuestionIndex) {
                onQuestionIndexUpdated(data);
            }
        } else {
            console.error("No such session!");
        }
    });
}


// This function will be triggered for participants when the session's currentQuestionIndex changes
export function onQuestionIndexUpdated(sessionData) {
    console.log('Inside onQuestionIndexUpdated');
    if (sessionData.currentQuestionIndex !== undefined && sessionData.currentQuestionIndex !== currentQuestionIndex) {
        // Submit the current answer before moving to the next question
        if (modeGroupParticipant.checked) {
            submitAnswer();
        }
        // Update the current question index
        currentQuestionIndex = sessionData.currentQuestionIndex;
        displayQuestionForGroupParticipant(currentQuestionIndex);
    }
}
