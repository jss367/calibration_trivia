



function saveQuestionsToFirestore(sessionId, questionsArray) {
  db.collection('sessions').doc(sessionId).set({
    questions: questionsArray,
    active: true // or any other relevant session data
  })
    .then(() => console.log('Questions saved successfully'))
    .catch(error => console.error('Error saving questions:', error));
}

nextButton.classList.add('button-spacing');
nextButton.addEventListener('click', () => {
  console.log("Next button has been clicked");
  console.log("Current Mode:");
  console.log("  Single Player:", modeSinglePlayer.checked);
  console.log("  Group Participant:", modeGroupParticipant.checked);
  console.log("  Group Questioner:", modeGroupQuestioner.checked);
  console.log("Current Question Index:", currentQuestionIndex);
  console.log("Total Questions:", questions.length);
  console.log("User Answers:", userAnswers);
  console.log("Correct Answers:", correctAnswers);
  console.log("User Confidences:", userConfidences);
  console.log("Score:", score);
  console.log("Brier Score:", brierScore);

  // Handling for Group Questioner mode
  if (modeGroupQuestioner.checked) {
    console.log("Handling Group Questioner mode");

    // Increment the current question index
    currentQuestionIndex++;
    console.log("Updated Question Index (Questioner):", currentQuestionIndex);

    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
      displayQuestionQuestioner(currentQuestionIndex); // Display next question for Group Questioner
    } else {
      displayResults(); // Display results if it's the last question
    }
  }
  else if (modeGroupParticipant.checked) {
    console.log("Handling Group Participant mode");
    submitAnswer();
    const sessionId = getCurrentSessionId(); // Retrieve the current session ID for group modes
    console.log("Session ID:", sessionId);
    nextQuestion(sessionId); // Advance to the next question in the session for Group Participant mode
  }
  else {
    console.log("Handling Single Player mode");
    // For Single Player mode, handle answer submission and question navigation
    submitAnswer();

    // Increment the current question index
    currentQuestionIndex++;
    console.log("Updated Question Index (Single Player):", currentQuestionIndex);

    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
      displayQuestion(currentQuestionIndex); // Display next question for Single Player
    } else {
      displayResults(); // Display results if it's the last question
    }
  }
});



function loadQuestionsParticipant() {
  const sessionId = getCurrentSessionId();
  if (!sessionId) {
    console.error("No session ID found.");
    return;
  }

  db.collection('sessions').doc(sessionId).get()
    .then(doc => {
      if (doc.exists && doc.data().questions) {
        questions = doc.data().questions;
        currentQuestionIndex = 0;
        displayQuestionForGroupParticipant(currentQuestionIndex);
      } else {
        console.error("No questions available in this session or session does not exist.");
      }
    })
    .catch(error => console.error("Error loading session questions:", error));
}

function displayQuestionForGroupParticipant(index) {
  if (!questions[index]) {
    console.error("Question not found for index: ", index);
    return; // Exit the function if the question is not found
  }

  const question = questions[index];
  const questionDiv = document.createElement('div');

  let answerInputHTML = question.options.map((option, index) => `
    <div>
      <input type="radio" id="option-${index}" class="input-radio" name="answer" value="${option}">
      <label for="option-${index}">${String.fromCharCode(65 + index)}: ${option}</label>
    </div>
  `).join('');

  questionDiv.innerHTML = `
    <h3>Question ${index + 1} of ${questions.length}</h3>
    ${answerInputHTML}
    ${getConfidenceInputHTML()}
  `;

  questionContainer.innerHTML = ''; // Clear previous content
  questionContainer.appendChild(questionDiv); // Append new content

  // Make sure the quiz container is visible
  quizContainer.style.display = 'block';
  nextButton.style.display = 'block';
}

function submitAnswer() {
  console.log("Inside submitAnswer");
  // Get the selected answer and confidence level
  const selectedOption = document.querySelector('input[name="answer"]:checked');
  const confidenceElement = document.getElementById('confidence');

  let userAnswer = null;
  let userConfidence = null;

  if (selectedOption) {
    userAnswer = selectedOption.value;
  }

  if (confidenceElement) {
    // Ensure confidence is within the 0-100 range
    userConfidence = parseInt(confidenceElement.value, 10);
    userConfidence = Math.max(0, Math.min(userConfidence, 100)); // Clamp between 0 and 100

    // Convert confidence to a percentage and round it
    userConfidence = Math.round(userConfidence) / 100;
  }

  if (!selectedOption || isNaN(userConfidence)) {
    console.warn('No answer or invalid confidence selected for current question');
  } else {
    // Determine if the answer is correct and update the score
    const currentCorrectAnswer = questions[currentQuestionIndex].correctAnswer;
    if (currentCorrectAnswer === userAnswer) {
      score++;
      brierScore += Math.pow(1 - userConfidence, 2);
    } else {
      brierScore += Math.pow(0 - userConfidence, 2);
    }

    // Save the user's answer, the correct answer, and confidence to arrays
    userAnswers.push(userAnswer);
    correctAnswers.push(currentCorrectAnswer);
    userConfidences.push(userConfidence); // Save the rounded confidence score

    const sessionId = getCurrentSessionId();
    const userId = document.getElementById('username').value.trim();

    // In group mode, store the result in Firestore
    if (userId && sessionId) {
      submitAnswerToFirestore(sessionId, userId, userAnswer, userConfidence);
    }

    if (selectedOption) {
      selectedOption.checked = false;
    }
    if (confidenceElement) {
      confidenceElement.value = ''; // Clear the confidence input
    }
  }
}

function getCurrentSessionId() {
  // Retrieve the session ID from local storage
  return localStorage.getItem('currentSessionId');
}

function submitAnswerToFirestore(sessionId, userId, answer, confidence) {
  if (!sessionId || !userId) {
    console.error('Session ID or User ID is missing.');
    return;
  }

  const answerData = { answer, confidence, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
  db.collection('sessions').doc(sessionId).collection('answers').doc(userId).set(answerData)
    .then(() => console.log('Answer submitted successfully'))
    .catch(error => console.error("Error submitting answer:", error));
}

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
