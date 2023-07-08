const quizContainer = document.getElementById('quiz-container');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
// Firebase Firestore initialization
const db = firebase.firestore();
let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let brierScore = 0;

function loadQuestions() {
  return fetch('questions.json')
    .then(response => response.json())
    .then(loadedQuestions => {
      questions = loadedQuestions;
      displayQuestion(currentQuestionIndex);
    });
}

function displayQuestion(index) {
  const question = questions[index];
  quizContainer.innerHTML = `
    <input type="text" id="answer" placeholder="Your answer">
    <input type="number" id="confidence" min="0" max="100" step="1" value="50">%
  `;
  nextButton.style.display = 'block';
}

nextButton.addEventListener('click', () => {
  submitAnswer();
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    displayQuestion(currentQuestionIndex);
  } else {
    displayResults();
  }
});

function submitAnswer() {
  const answerElement = document.getElementById('answer');
  const confidenceElement = document.getElementById('confidence');

  const userAnswer = answerElement.value.trim().toLowerCase();
  const correctAnswer = questions[currentQuestionIndex].correctAnswer.toLowerCase();
  const userConfidence = parseInt(confidenceElement.value, 10) / 100;

  if (userAnswer === correctAnswer) {
    score++;
    brierScore += Math.pow(1 - userConfidence, 2);
  } else {
    brierScore += Math.pow(0 - userConfidence, 2);
  }
  // Save user's answer
  const username = document.getElementById('username').value.trim();
  db.collection('answers').add({
    username,
    questionIndex: currentQuestionIndex,
    userAnswer,
    correctAnswer,
    userConfidence,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
})
};

function displayResults() {
  quizContainer.style.display = 'none';
  nextButton.style.display = 'none';

  brierScore /= questions.length;

  resultsContainer.innerHTML = `
    <h2>Results</h2>
    <p>Correct answers: ${score} / ${questions.length}</p>
    <p>Brier score: ${brierScore.toFixed(2)}</p>
  `;

  resultsContainer.style.display = 'block';
}

function calculateScores() {
  return db.collection('answers').get()
    .then(snapshot => {
      const answers = snapshot.docs.map(doc => doc.data());
      const users = {};

      // Group answers by user
      answers.forEach(answer => {
        if (!(answer.username in users)) {
          users[answer.username] = [];
        }
        users[answer.username].push(answer);
      });

      // Calculate each user's score
      const scores = {};
      for (const username in users) {
        let score = 0;
        let brierScore = 0;
        users[username].forEach(answer => {
          const userConfidence = answer.userConfidence;
          if (answer.userAnswer === answer.correctAnswer) {
            score++;
            brierScore += Math.pow(1 - userConfidence, 2);
          } else {
            brierScore += Math.pow(0 - userConfidence, 2);
          }
        });
        scores[username] = {
          score,
          brierScore: brierScore / users[username].length,
        };
      }

      return scores;
    });
}

function displayLeaderboard(scores) {
  const leaderboardContainer = document.getElementById('leaderboard-container');
  leaderboardContainer.innerHTML = `
    <h2>Leaderboard</h2>
    ${Object.entries(scores).map(([username, {score, brierScore}]) => `
      <p>${username}: ${score} correct, Brier score ${brierScore.toFixed(2)}</p>
    `).join('')}
  `;
  leaderboardContainer.style.display = 'block';
}

// Display the leaderboard after the results
calculateScores().then(displayLeaderboard);


loadQuestions();
