import { questions } from './shared.js';

export function displayLeaderboard(sessionId) {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    leaderboardContainer.innerHTML = '<h2>Leaderboard</h2><p>Loading...</p>';
    leaderboardContainer.style.display = 'block';

    firebase.firestore().collection('sessions').doc(sessionId).collection('answers')
        .get()
        .then(querySnapshot => {
            const scores = {};
            querySnapshot.forEach(doc => {
                const userId = doc.id;
                const userAnswers = doc.data();

                if (!scores[userId]) {
                    scores[userId] = { correct: 0, total: 0 };
                }

                Object.keys(userAnswers).forEach(questionIndex => {
                    const answer = userAnswers[questionIndex];
                    scores[userId].total++;
                    if (parseInt(questionIndex) < questions.length &&
                        questions[parseInt(questionIndex)].correctAnswer === answer.answer) {
                        scores[userId].correct++;
                    }
                });
            });

            // Sort scores
            const sortedScores = Object.entries(scores).sort((a, b) =>
                (b[1].correct / b[1].total) - (a[1].correct / a[1].total)
            );

            // Display the leaderboard
            leaderboardContainer.innerHTML = '<h2>Leaderboard</h2>';
            sortedScores.forEach(([userId, score]) => {
                const scoreElement = document.createElement('p');
                const percentage = score.total > 0 ? ((score.correct / score.total) * 100).toFixed(2) : '0.00';
                scoreElement.innerText = `${userId}: ${score.correct} / ${score.total} (${percentage}%)`;
                leaderboardContainer.appendChild(scoreElement);
            });
        })
        .catch(error => {
            console.error("Error getting documents: ", error);
            leaderboardContainer.innerHTML = '<h2>Leaderboard</h2><p>Error loading leaderboard</p>';
        });
}
