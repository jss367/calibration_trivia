import { questions } from './shared.js';

/**
 * Calculate consensus answers for each question using majority vote and confidence-weighted methods
 * @param {Object} querySnapshot - Firestore query snapshot of all user answers
 * @returns {Array} Array of consensus results per question
 */
function calculateConsensus(querySnapshot) {
    // Build per-question vote tallies
    const questionVotes = {}; // { questionIndex: { answer: { count, weightedSum } } }

    querySnapshot.forEach(doc => {
        const userAnswers = doc.data();

        Object.keys(userAnswers).forEach(questionIndex => {
            const answer = userAnswers[questionIndex];
            const questionNum = parseInt(questionIndex);

            if (questionNum >= questions.length) return;

            if (!questionVotes[questionNum]) {
                questionVotes[questionNum] = {};
            }

            const userAnswer = answer.answer.toLowerCase();
            const userConfidence = answer.confidence;

            if (!questionVotes[questionNum][userAnswer]) {
                questionVotes[questionNum][userAnswer] = { count: 0, weightedSum: 0 };
            }

            questionVotes[questionNum][userAnswer].count++;
            questionVotes[questionNum][userAnswer].weightedSum += userConfidence;
        });
    });

    // Calculate consensus for each question
    const consensus = [];
    for (let i = 0; i < questions.length; i++) {
        const votes = questionVotes[i];
        if (!votes || Object.keys(votes).length === 0) {
            consensus.push(null); // No votes for this question
            continue;
        }

        const correctAnswer = questions[i].correctAnswer.toLowerCase();

        // Find majority winner (most votes)
        let majorityAnswer = null;
        let maxCount = 0;
        Object.entries(votes).forEach(([answer, data]) => {
            if (data.count > maxCount) {
                maxCount = data.count;
                majorityAnswer = answer;
            }
        });

        // Find weighted winner (highest sum of confidences)
        let weightedAnswer = null;
        let maxWeight = 0;
        Object.entries(votes).forEach(([answer, data]) => {
            if (data.weightedSum > maxWeight) {
                maxWeight = data.weightedSum;
                weightedAnswer = answer;
            }
        });

        consensus.push({
            questionNum: i + 1,
            correctAnswer,
            majorityAnswer,
            majorityCorrect: majorityAnswer === correctAnswer,
            weightedAnswer,
            weightedCorrect: weightedAnswer === correctAnswer
        });
    }

    return consensus;
}

/**
 * Render the consensus section HTML
 * @param {Array} consensus - Array of consensus results
 * @returns {string} HTML string for consensus section
 */
function renderConsensusHTML(consensus) {
    const validConsensus = consensus.filter(c => c !== null);
    if (validConsensus.length === 0) {
        return '';
    }

    const majorityCorrectCount = validConsensus.filter(c => c.majorityCorrect).length;
    const weightedCorrectCount = validConsensus.filter(c => c.weightedCorrect).length;

    let html = '<div id="consensus-section"><h3>Group Consensus</h3>';

    validConsensus.forEach(c => {
        const majorityMark = c.majorityCorrect ? '✓' : '✗';
        const weightedMark = c.weightedCorrect ? '✓' : '✗';
        const majorityColor = c.majorityCorrect ? 'green' : 'red';
        const weightedColor = c.weightedCorrect ? 'green' : 'red';

        html += `<p>Q${c.questionNum}: <span style="color:${majorityColor}">${c.majorityAnswer} ${majorityMark}</span> (majority) / <span style="color:${weightedColor}">${c.weightedAnswer} ${weightedMark}</span> (weighted)</p>`;
    });

    html += `<p><strong>Summary:</strong> Majority ${majorityCorrectCount}/${validConsensus.length} correct | Weighted ${weightedCorrectCount}/${validConsensus.length} correct</p>`;
    html += '<hr></div>';

    return html;
}

export function displayLeaderboard(sessionId) {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    leaderboardContainer.innerHTML = `
        <h2>Leaderboard</h2>
        <p>Loading...</p>
        <button id="sort-by-correct">Sort by Correct Guesses</button>
        <button id="sort-by-baseline">Sort by Baseline Score</button>
    `;
    leaderboardContainer.style.display = 'block';

    firebase.firestore().collection('sessions').doc(sessionId).collection('answers')
        .get()
        .then(querySnapshot => {
            // Calculate consensus scores
            const consensus = calculateConsensus(querySnapshot);
            const consensusHTML = renderConsensusHTML(consensus);

            const scores = {};
            querySnapshot.forEach(doc => {
                const userId = doc.id;
                const userAnswers = doc.data();

                if (!scores[userId]) {
                    scores[userId] = { correct: 0, total: 0, baselineScore: 0 };
                }

                Object.keys(userAnswers).forEach(questionIndex => {
                    const answer = userAnswers[questionIndex];
                    const questionNum = parseInt(questionIndex);
                    scores[userId].total++;
                    if (questionNum < questions.length) {
                        const correctAnswer = questions[questionNum].correctAnswer.toLowerCase();
                        const userAnswer = answer.answer.toLowerCase();
                        const userConfidence = answer.confidence;

                        if (correctAnswer === userAnswer) {
                            scores[userId].correct++;
                            scores[userId].baselineScore += Math.log(userConfidence);
                        } else {
                            scores[userId].baselineScore += Math.log(1 - userConfidence);
                        }
                    }
                });

                // Normalize Baseline score
                const baselineLogScore = Math.log(0.5);
                scores[userId].baselineScore = 100 * (scores[userId].baselineScore - scores[userId].total * baselineLogScore) / (-scores[userId].total * baselineLogScore);
            });

            // Function to render leaderboard
            function renderLeaderboard(sortedScores) {
                leaderboardContainer.innerHTML = `
                    <h2>Leaderboard</h2>
                    ${consensusHTML}
                    <h3>Individual Scores</h3>
                    <button id="sort-by-correct">Sort by Correct Guesses</button>
                    <button id="sort-by-baseline">Sort by Baseline Score</button>
                `;
                sortedScores.forEach(([userId, score]) => {
                    const scoreElement = document.createElement('p');
                    const percentage = score.total > 0 ? ((score.correct / score.total) * 100).toFixed(2) : '0.00';
                    scoreElement.innerText = `${userId}: ${score.correct} / ${score.total} (${percentage}%) - Baseline Score: ${score.baselineScore.toFixed(2)}`;
                    leaderboardContainer.appendChild(scoreElement);
                });

                document.getElementById('sort-by-correct').addEventListener('click', () => {
                    renderLeaderboard(Object.entries(scores).sort((a, b) => b[1].correct - a[1].correct));
                });

                document.getElementById('sort-by-baseline').addEventListener('click', () => {
                    renderLeaderboard(Object.entries(scores).sort((a, b) => b[1].baselineScore - a[1].baselineScore));
                });
            }

            // Initial render sorted by correct guesses
            renderLeaderboard(Object.entries(scores).sort((a, b) => b[1].correct - a[1].correct));
        })
        .catch(error => {
            console.error("Error getting documents: ", error);
            leaderboardContainer.innerHTML = '<h2>Leaderboard</h2><p>Error loading leaderboard</p>';
        });
}
