import { questions } from './shared.js';

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
