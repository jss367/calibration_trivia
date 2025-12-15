import {
    quizContainer,
    modeGroupQuestioner,
    modeGroupParticipant,
    questions,
    userAnswers,
    correctAnswers,
    userConfidences,
    score,
    brierScore,
    baselineScore
} from './shared.js';
import { calculateConfidenceDecileScores } from './quizLogic.js';
import { renderCalibrationGraph } from './calibrationGraph.js';
import { getCurrentSessionId } from './sessionManagement.js';
import { displayLeaderboard } from './leaderboard.js';

const resultsContainer = document.getElementById('results-container');

export function displayResults() {
    quizContainer.style.display = 'none';
    resultsContainer.style.display = 'block';

    let resultsHTML = '<h2>Results</h2>';

    if (modeGroupQuestioner.checked) {
        resultsHTML += '<p>Thank you for hosting the quiz!</p>';
    } else {
        brierScore /= questions.length;
        baselineScore /= questions.length;

        // Determine the label and color based on Baseline score
        let scoreLabel, scoreColor;
        if (baselineScore >= 75) {
            scoreLabel = 'Excellent';
            scoreColor = 'green';
        } else if (baselineScore >= 50) {
            scoreLabel = 'Good';
            scoreColor = 'blue';
        } else if (baselineScore >= 25) {
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

        resultsHTML += `
        <p>Correct answers: ${score} / ${questions.length}</p>
        <p>Brier score: ${brierScore.toFixed(2)}</p>
        <p style="color:${scoreColor};">Baseline score: ${baselineScore.toFixed(2)} (${scoreLabel})</p>
        ${confidenceDecileScores.map(({ decileRange, score, correct, total }) => {
            if (total === 0) {
                return `<p>You did not answer any questions with ${decileRange}% confidence.</p>`;
            } else {
                return `<p>When you were ${decileRange}% confident, you were correct ${Math.round(score * 100)}% of the time (${correct}/${total}).</p>`;
            }
        }).join('')}
        `;
    }

    // Only add the leaderboard button for group modes
    if (modeGroupQuestioner.checked || modeGroupParticipant.checked) {
        resultsHTML += '<button id="show-leaderboard">Show Leaderboard</button>';
    }

    resultsContainer.innerHTML = resultsHTML;

    // Render calibration graph at top of results (only for non-questioner modes)
    if (!modeGroupQuestioner.checked) {
        renderCalibrationGraph(confidenceDecileScores);
    }

    // Set up the leaderboard button click event only for group modes
    if (modeGroupQuestioner.checked || modeGroupParticipant.checked) {
        document.getElementById('show-leaderboard').onclick = () => displayLeaderboard(getCurrentSessionId());
    }

    if (!modeGroupQuestioner.checked) {
        displayIndividualResults();
    }
}

export function displayIndividualResults() {
    for (let i = 0; i < questions.length; i++) {
        const resultPara = document.createElement('p');

        // Round the confidence to whole number percentage
        const confidencePercentage = Math.round(userConfidences[i] * 100);

        if (Array.isArray(correctAnswers[i])) {
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
