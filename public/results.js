
import {
    quizContainer,
    modeGroupQuestioner,
    questions,
    userAnswers,
    correctAnswers,
    userConfidences,
    score,
    brierScore
} from './shared.js';
import { calculateConfidenceDecileScores } from './quizLogic.js';
import { getCurrentSessionId } from './sessionManagement.js';

const resultsContainer = document.getElementById('results-container');

export function displayResults() {
    quizContainer.style.display = 'none';

    if (modeGroupQuestioner.checked) {
        displayLeaderboard(getCurrentSessionId());
    } else {
        brierScore /= questions.length;

        // Determine the label and color based on Brier score
        let scoreLabel, scoreColor;
        if (brierScore <= 0.10) {
            scoreLabel = 'Excellent';
            scoreColor = 'green';
        } else if (brierScore <= 0.20) {
            scoreLabel = 'Good';
            scoreColor = 'blue';
        } else if (brierScore <= 0.30) {
            scoreLabel = 'Fair';
            scoreColor = 'orange';
        } else {
            scoreLabel = 'Poor';
            scoreColor = 'red';
        }

        const answers = userAnswers.map((userAnswer, index) => ({
            userAnswer,
            correctAnswer: correctAnswers[index],
            userConfidence: userConfidences[index],
        }));

        const confidenceDecileScores = calculateConfidenceDecileScores(answers);

        resultsContainer.innerHTML = `
        <h2>Results</h2>
        <p>Correct answers: ${score} / ${questions.length}</p>
        <p style="color:${scoreColor};">Brier score: ${brierScore.toFixed(2)} (${scoreLabel})</p>
        ${confidenceDecileScores.map(({ decileRange, score, correct, total }) => {
            if (total === 0) {
                return `<p>You did not answer any questions with ${decileRange}% confidence.</p>`;
            } else {
                return `<p>When you were ${decileRange}% confident, you were correct ${Math.round(score * 100)}% of the time (${correct}/${total}).</p>`;
            }
        }).join('')}
      `;

        resultsContainer.style.display = 'block';
        displayIndividualResults();
    }
}

export function displayIndividualResults() {
    for (let i = 0; i < questions.length; i++) {
        const resultPara = document.createElement('p');

        // Round the confidence to 2 decimal places
        const confidencePercentage = Math.round(userConfidences[i] * 100);

        if (typeof correctAnswers[i] === 'object') {
            const userAnswerString = userAnswers[i].toString();
            const isCorrect = correctAnswers[i].includes(userAnswerString);
            resultPara.style.color = isCorrect ? 'green' : 'red';
            resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswerString} with ${confidencePercentage}% confidence.<br>The correct answer is ${correctAnswers[i].join(' or ')}.`;
        } else {
            const isCorrect = correctAnswers[i] === userAnswers[i];
            resultPara.style.color = isCorrect ? 'green' : 'red';
            resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswers[i]} with ${confidencePercentage}% confidence.<br>The correct answer is ${correctAnswers[i]}.`;
        }
        resultsContainer.appendChild(resultPara);
    }
}
