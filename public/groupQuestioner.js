

import {
    startButtonContainer,
    sessionIdContainer,
    categorySelectionContainer,
    questionCountContainer,
    nextButton,
    modeSelectionContainer, questionContainer,
    quizContainer,
    questions,
    currentQuestionIndex,

} from './shared.js';
import { displayResults } from './results.js';

// Function for the Questioner to call when ready to move to the next question
export function questionerNextQuestion(sessionId) {
    // Increment the current question index
    currentQuestionIndex++;

    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
        // Update the current question index in the Firebase session
        firebase.firestore().collection('sessions').doc(sessionId).update({
            currentQuestionIndex: currentQuestionIndex
        }).then(() => {
            console.log('Question index updated successfully.');
            displayQuestionQuestioner(currentQuestionIndex);
        }).catch(error => {
            console.error('Error updating question index:', error);
        });
    } else {
        // Handle the end of the quiz
        displayResults();
    }
}


// Function to display the questioner's screen
export function displayQuestionerScreen(sessionId) {
    // Load questions from the session and set up the questioner UI
    console.log("Inside displayQuestionerScreen");
    loadSessionQuestions(sessionId)
        .then(() => {
            console.log("Inside loadSessionQuestions(sessionId)");
            // Display the first question
            currentQuestionIndex = 0;
            displayQuestionQuestioner(currentQuestionIndex);

            // Set up questioner-specific UI elements
            quizContainer.style.display = 'block';
            modeSelectionContainer.style.display = 'none';
            startButtonContainer.style.display = 'none';
            questionCountContainer.style.display = 'none';
            categorySelectionContainer.style.display = 'none';
            sessionIdContainer.style.display = 'block'; // Show the session ID
            sessionIdContainer.innerHTML = `<p>Session ID: ${sessionId}</p>`;

            // Show the next button for the questioner to proceed to the next question
            nextButton.style.display = 'block';
            nextButton.disabled = false; // Enable the next button for the questioner
        })
        .catch(error => {
            console.error("Error displaying questioner screen:", error);
        });
}


export function displayQuestionQuestioner(index) {
    // This is for group questioner mode

    if (!questions[index]) {
        console.error("Question not found for index: ", index);
        return; // Exit the function if the question is not found
    }

    const question = questions[index];

    // Create a new div for the question
    const questionDiv = document.createElement('div');

    // Initialize the answer input HTML
    let answerInputHTML = '';

    answerInputHTML = question.options.map((option, index) => `
    <div>
      <label>${String.fromCharCode(65 + index)}: ${option}</label>
    </div>
  `).join('');

    questionDiv.innerHTML = `
    <h3>Question ${index + 1} of ${questions.length}</h3>
    <h2>${question.question}</h2>
    ${answerInputHTML}
  `;

    questionContainer.innerHTML = ''; // Clear previous question
    questionContainer.appendChild(questionDiv); // Append new question
    quizContainer.style.display = 'block'; // Ensure the quiz container is visible
}
