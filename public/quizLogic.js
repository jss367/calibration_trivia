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
