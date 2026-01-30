import {
    questions,
    currentQuestionIndex,
    userAnswers,
    correctAnswers,
    userConfidences,
    score,
    brierScore,
    baselineScore,
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

    // Validate confidence before parsing
    const rawConfidence = confidenceElement ? parseInt(confidenceElement.value, 10) : NaN;

    if (!userAnswer) {
        alert('Please select an answer.');
        return false;
    }

    if (isNaN(rawConfidence)) {
        alert('Please enter a confidence value.');
        return false;
    }

    if (rawConfidence < 25) {
        alert('Confidence must be at least 25% (since there are 4 answer choices, random guessing gives 25%).');
        return false;
    }

    if (rawConfidence > 100) {
        alert('Confidence cannot exceed 100%.');
        return false;
    }

    let userConfidence = rawConfidence / 100;

    updateScores(userAnswer, userConfidence);
    saveAnswer(userAnswer, userConfidence);

    clearInputs(selectedOption, confidenceElement);

    return true;
}

function updateScores(userAnswer, userConfidence) {
    const currentCorrectAnswer = questions[userAnswers.length].correctAnswer;
    let logScore;
    if (currentCorrectAnswer === userAnswer) {
        logScore = Math.log(userConfidence);
        score++;
        brierScore += Math.pow(1 - userConfidence, 2);
    } else {
        logScore = Math.log(1 - userConfidence);
        brierScore += Math.pow(0 - userConfidence, 2);
    }

    const baselineLogScore = Math.log(0.5);
    const normalizedLogScore = 100 * (logScore - baselineLogScore) / (-baselineLogScore);

    baselineScore += normalizedLogScore;

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
    if (selectedOption) {
        selectedOption.checked = false;
    }
    if (confidenceElement) {
        confidenceElement.value = '';
    }
}


export function calculateConfidenceDecileScores(answers) {
    // Buckets: 25-30%, 30-40%, 40-50%, 50-60%, 60-70%, 70-80%, 80-90%, 90-100%
    const bucketRanges = ['25-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90-100'];
    const bucketCounts = Array(8).fill(0);
    const bucketCorrectCounts = Array(8).fill(0);

    answers.forEach(answer => {
        let bucket;
        if (answer.userConfidence < 0.30) {
            bucket = 0; // 25-30%
        } else {
            bucket = Math.min(Math.floor((answer.userConfidence - 0.30) / 0.10) + 1, 7);
        }
        bucketCounts[bucket]++;
        if (answer.correctAnswer === answer.userAnswer) {
            bucketCorrectCounts[bucket]++;
        }
    });

    return bucketRanges.map((range, index) => ({
        decileRange: `${range}%`,
        score: bucketCounts[index] ? bucketCorrectCounts[index] / bucketCounts[index] : null,
        correct: bucketCorrectCounts[index],
        total: bucketCounts[index]
    }));
}
