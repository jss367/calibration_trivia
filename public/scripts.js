


function calculateConfidenceDecileScores(answers) {
  /**
   * The answers that comes in is pulled from the entire database, so it contains answers from all users.
   */
  // Create an array to store scores for each decile
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

// Function to create a new session
function createSession() {
  const sessionId = document.getElementById('session-id').value.trim();
  db.collection('sessions').doc(sessionId).set({
    currentQuestionIndex: 0,
    questions: [],
    active: true
  })
    .then(() => {
      console.log('Session created successfully with ID:', sessionId);
      // Store sessionId in a variable or local storage to use later
      localStorage.setItem('currentSessionId', sessionId);
    })
    .catch(error => console.error('Error creating session:', error));
}

function nextQuestion(sessionId) {
  // Increment the current question index
  currentQuestionIndex++;
  // Check if there are more questions
  if (currentQuestionIndex < questions.length) {
    // Update the current question index in the Firebase session
    // db.collection('sessions').doc(sessionId).update({
    // currentQuestionIndex: currentQuestionIndex
    // });
    displayQuestionForGroupParticipant(currentQuestionIndex);
  } else {
    // Handle the end of the quiz
    displayResults();
  }
}

function displayResults() {
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

function displayIndividualResults() {
  for (let i = 0; i < questions.length; i++) {
    const resultPara = document.createElement('p');

    if (typeof correctAnswers[i] === 'object') {
      const userAnswerString = userAnswers[i].toString(); // Convert user's answer to string
      const isCorrect = correctAnswers[i].includes(userAnswerString);
      resultPara.style.color = isCorrect ? 'green' : 'red';
      resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswerString} with ${userConfidences[i] * 100}% confidence.<br>The correct answer is ${correctAnswers[i]}.`;

    } else {
      const isCorrect = correctAnswers[i] === userAnswers[i];
      resultPara.style.color = isCorrect ? 'green' : 'red';
      resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswers[i]} with ${userConfidences[i] * 100}% confidence.<br>The correct answer is ${correctAnswers[i]}.`;
    }
    resultsContainer.appendChild(resultPara);
  }
}

function displayLeaderboard(sessionId) {
  db.collection('sessions').doc(sessionId).collection('answers')
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

// Call initialize after the DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
