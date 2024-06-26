
import {
    questions,
} from './shared.js';

const leaderboardContainer = document.getElementById('leaderboard-container');

export function displayLeaderboard(sessionId) {
    firebase.firestore().collection('sessions').doc(sessionId).collection('answers')
        .get()
        .then(querySnapshot => {
            const scores = {};
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const userId = doc.id;
                // Assuming 'answer' and 'confidence' are stored in each doc
                if (!scores[userId]) {
                    scores[userId] = { correct: 0, total: 0 };
                }
                const isCorrect = questions[scores[userId].total].correctAnswer === data.answer;
                if (isCorrect) {
                    scores[userId].correct++;
                }
                scores[userId].total++;
            });

            // Display the leaderboard
            const leaderboardDiv = document.getElementById('leaderboard-container');
            leaderboardDiv.innerHTML = '<h2>Leaderboard</h2>';
            Object.keys(scores).forEach(userId => {
                const score = scores[userId];
                const scoreElement = document.createElement('p');
                scoreElement.innerText = `${userId}: ${score.correct} / ${score.total}`;
                leaderboardDiv.appendChild(scoreElement);
            });
            leaderboardDiv.style.display = 'block';
        })
        .catch(error => {
            console.error("Error getting documents: ", error);
        });
}
