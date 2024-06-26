import {
    questions,
    currentQuestionIndex,
    userAnswers,
    correctAnswers,
    userConfidences,
    score,
    brierScore,
    modeGroupParticipant,
    modeGroupQuestioner
} from './shared.js';
import { submitAnswerToFirestore } from './firestore.js';
import { getCurrentSessionId } from './sessionManagement.js';
import { displayQuestionForGroupParticipant } from './groupParticipant.js';
import { displayResults } from './results.js';

export function getConfidenceInputHTML() {
    console.log('Inside getConfidenceInputHTML');
    return `
      <div>
        <label for="confidence">Confidence:</label>
        <input type="number" id="confidence" class="input-small" min="0" max="100" step="1">%
      </div>
    `;
}

export function nextQuestion(sessionId) {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        displayQuestionForGroupParticipant(currentQuestionIndex);
    } else {
        displayResults();
    }
}

export function submitAnswer() {
    console.log("Inside submitAnswer");
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    const confidenceElement = document.getElementById('confidence');

    let userAnswer = selectedOption ? selectedOption.value : null;
    let userConfidence = confidenceElement ? parseConfidence(confidenceElement.value) : null;

    if (!userAnswer || isNaN(userConfidence)) {
        console.warn('No answer or invalid confidence selected for current question');
        return false;
    }

    updateScores(userAnswer, userConfidence);
    saveAnswer(userAnswer, userConfidence);

    clearInputs(selectedOption, confidenceElement);

    return true;
}

function parseConfidence(value) {
    let confidence = parseInt(value, 10);
    confidence = Math.max(0, Math.min(confidence, 100));
    return Math.round(confidence) / 100;
}

function updateScores(userAnswer, userConfidence) {
    const currentCorrectAnswer = questions[userAnswers.length].correctAnswer;
    if (currentCorrectAnswer === userAnswer) {
        score++;
        brierScore += Math.pow(1 - userConfidence, 2);
    } else {
        brierScore += Math.pow(0 - userConfidence, 2);
    }

    userAnswers.push(userAnswer);
    correctAnswers.push(currentCorrectAnswer);
    userConfidences.push(userConfidence);
}

function saveAnswer(userAnswer, userConfidence) {
    if (modeGroupParticipant.checked || modeGroupQuestioner.checked) {
        const sessionId = getCurrentSessionId();
        const userId = document.getElementById('username').value.trim();
        if (userId && sessionId) {
            submitAnswerToFirestore(sessionId, userId, userAnswer, userConfidence);
        }
    }
}

function clearInputs(selectedOption, confidenceElement) {
    if (selectedOption) selectedOption.checked = false;
    if (confidenceElement) confidenceElement.value = '';
}

export function calculateConfidenceDecileScores(answers) {
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
