import {
    questionContainer,
    quizContainer,
    questions,
    currentQuestionIndex,
} from './shared.js';
import { displayResults } from './results.js';
import { getCurrentSessionId, loadSessionQuestions } from './sessionManagement.js';

export function questionerPreviousQuestion(sessionId) {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;

        firebase.firestore().collection('sessions').doc(sessionId).update({
            currentQuestionIndex: currentQuestionIndex
        }).then(() => {
            console.log('Question index updated successfully (back).');
            displayQuestionQuestioner(currentQuestionIndex);
            updateBackButtonVisibility();
        }).catch(error => {
            console.error('Error updating question index:', error);
        });
    }
}

function updateBackButtonVisibility() {
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
    }
}

export function questionerNextQuestion(sessionId) {
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        firebase.firestore().collection('sessions').doc(sessionId).update({
            currentQuestionIndex: currentQuestionIndex
        }).then(() => {
            console.log('Question index updated successfully.');
            displayQuestionQuestioner(currentQuestionIndex);
            updateBackButtonVisibility();
        }).catch(error => {
            console.error('Error updating question index:', error);
        });
    } else {
        displayResults();
    }
}

export function displayQuestionerScreen(sessionId) {
    console.log("Inside displayQuestionerScreen for session:", sessionId);
    // Hide unnecessary UI elements
    document.getElementById('mode-selection-container').style.display = 'none';
    document.getElementById('start-button-container').style.display = 'none';
    // Show questioner-specific UI elements
    document.getElementById('quiz-container').style.display = 'block';
    // Display the first question
    displayQuestionQuestioner(0, sessionId);
    // Show the next button
    const nextButton = document.getElementById('next-button');
    nextButton.style.display = 'block';
    nextButton.disabled = false;
}

function shareSession() {
    const sessionId = getCurrentSessionId();
    const shareUrl = `${window.location.origin}/${sessionId}?role=participant`;
    const shareText = `Join my Calibration Trivia session! Session ID: ${sessionId}`;

    if (navigator.share) {
        navigator.share({
            title: 'Join Calibration Trivia Session',
            text: shareText,
            url: shareUrl,
        }).then(() => {
            console.log('Session shared successfully');
        }).catch((error) => {
            console.log('Error sharing session:', error);
            fallbackShare(shareUrl);
        });
    } else {
        fallbackShare(shareUrl);
    }
}

function fallbackShare(shareUrl) {
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Session link copied to clipboard!');
    }).catch((error) => {
        console.error('Failed to copy session link:', error);
        alert('Failed to copy session link. Please copy this URL manually: ' + shareUrl);
    });
}

export function displayQuestionQuestioner(index) {
    if (!questions[index]) {
        console.error("Question not found for index: ", index);
        return;
    }

    const question = questions[index];
    const questionDiv = document.createElement('div');

    let answerInputHTML = question.options.map((option, index) => `
    <div>
      <label>${String.fromCharCode(65 + index)}: ${option}</label>
    </div>
  `).join('');

    questionDiv.innerHTML = `
    <h3>Question ${index + 1} of ${questions.length}</h3>
    <h2>${question.question}</h2>
    ${answerInputHTML}
  `;

    questionContainer.innerHTML = '';
    questionContainer.appendChild(questionDiv);
    quizContainer.style.display = 'block';
}
