
import {
    questions,
    currentQuestionIndex,
    userAnswers,
    correctAnswers,
    userConfidences,
    score,
    brierScore
} from './shared.js';
import { submitAnswerToFirestore } from './firestore.js';
import { getCurrentSessionId } from './sessionManagement.js';
import { displayQuestionForGroupParticipant } from './groupParticipant.js';

export function getConfidenceInputHTML() {
    console.log('Inside getConfidenceInputHTML')
    return `
      <div>
        <label for="confidence">Confidence:</label>
        <input type="number" id="confidence" class="input-small" min="0" max="100" step="1">%
      </div>
    `;
}


export function nextQuestion(sessionId) {
    // Increment the current question index
    currentQuestionIndex++;
    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
        displayQuestionForGroupParticipant(currentQuestionIndex);
    } else {
        // Handle the end of the quiz
        displayResults();
    }
}

export function submitAnswer() {
    console.log("Inside submitAnswer");
    // Get the selected answer and confidence level
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    const confidenceElement = document.getElementById('confidence');

    let userAnswer = null;
    let userConfidence = null;

    if (selectedOption) {
        userAnswer = selectedOption.value;
    }

    if (confidenceElement) {
        // Ensure confidence is within the 0-100 range
        userConfidence = parseInt(confidenceElement.value, 10);
        userConfidence = Math.max(0, Math.min(userConfidence, 100)); // Clamp between 0 and 100

        // Convert confidence to a percentage and round it
        userConfidence = Math.round(userConfidence) / 100;
    }

    if (!selectedOption || isNaN(userConfidence)) {
        console.warn('No answer or invalid confidence selected for current question');
    } else {
        // Determine if the answer is correct and update the score
        const currentCorrectAnswer = questions[currentQuestionIndex].correctAnswer;
        if (currentCorrectAnswer === userAnswer) {
            score++;
            brierScore += Math.pow(1 - userConfidence, 2);
        } else {
            brierScore += Math.pow(0 - userConfidence, 2);
        }

        // Save the user's answer, the correct answer, and confidence to arrays
        userAnswers.push(userAnswer);
        correctAnswers.push(currentCorrectAnswer);
        userConfidences.push(userConfidence); // Save the rounded confidence score

        const sessionId = getCurrentSessionId();
        const userId = document.getElementById('username').value.trim();

        // In group mode, store the result in Firestore
        if (userId && sessionId) {
            submitAnswerToFirestore(sessionId, userId, userAnswer, userConfidence);
        }

        if (selectedOption) {
            selectedOption.checked = false;
        }
        if (confidenceElement) {
            confidenceElement.value = ''; // Clear the confidence input
        }
    }
}

export function calculateConfidenceDecileScores(answers) {
    /**
     * The answers that comes in is pulled from the entire database, so it contains answers from all users.
     */
    // Create an array to store scores for each decile
    const decileScores = Array(10).fill(0);
    const decileCounts = Array(10).fill(0);
    const decileCorrectCounts = Array(10).fill(0);

    answers.forEach(answer => {
        const decile = Math.min(Math.floor(answer.userConfidence * 10), 9);
        decileCounts[decile]++;
        if (answer.correctAnswer === answer.userAnswer) {
            decileCorrectCounts[decile]++;
        }
    });

    return decileScores.map((_, index) => ({
        decileRange: `${index * 10}-${(index + 1) * 10}%`,
        score: decileCounts[index] ? decileCorrectCounts[index] / decileCounts[index] : null,
        correct: decileCorrectCounts[index],
        total: decileCounts[index]
    }));
}
