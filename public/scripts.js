const quizContainer = document.getElementById('quiz-container');
const questionContainer = document.getElementById('question-container');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
const usernameContainer = document.getElementById('username-container');
const startQuizButton = document.getElementById('start-quiz');
const leaderboardContainer = document.getElementById('leaderboard-container');

// Firebase Firestore initialization
const db = firebase.firestore();
let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let brierScore = 0;
let userAnswers = [];
let correctAnswers = [];
let userConfidences = [];

startQuizButton.addEventListener('click', () => {
  usernameContainer.style.display = 'none';
  document.getElementById('question-count-container').style.display = 'none';
  quizContainer.style.display = 'block';
  loadQuestions();
});


function loadQuestions() {
  const questionCount = parseInt(document.getElementById('question-count').value, 10);
  const files = ['questions_science.json', 'questions_general.json', 'questions_rationality.json'];

  const promises = files.map(file => fetch(file).then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok for file ${file}`);
      }
      return response.json();
    })
  );

  Promise.all(promises)
    .then(loadedQuestionsArrays => {
      // Flatten the array of arrays into a single array
      questions = [].concat(...loadedQuestionsArrays);
      
      // Only keep as many questions as the user requested
      questions = questions.slice(0, questionCount);
      
      displayQuestion(currentQuestionIndex);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}


function displayQuestion(index) {
  const question = questions[index];

  // Create a new div for the question
  const questionDiv = document.createElement('div');

  // Initialize the answer input HTML
  let answerInputHTML = '';

    const options = ['A', 'B', 'C', 'D'];
    answerInputHTML = question.options.map((option, index) => `
      <div>
        <input type="radio" id="option-${options[index]}" class="input-radio" name="answer" value="${option}">
        <label for="option-${options[index]}">${options[index]}: ${option}</label>
      </div>
    `).join('');

    questionDiv.innerHTML = `
    <h2>${question.question}</h2>
    ${answerInputHTML}
    <input type="number" id="confidence" class="input-small" min="0" max="100" step="1" value="50">%
  `;

  questionContainer.innerHTML = ''; // Clear previous question
  questionContainer.appendChild(questionDiv); // Append new question

  nextButton.style.display = 'block';
}

nextButton.classList.add('button-spacing');

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
  let userAnswer;
  const questionType = questions[currentQuestionIndex].type;
  const currentCorrectAnswers = questions[currentQuestionIndex].correctAnswer.map(answer => answer.toLowerCase())
  const confidenceElement = document.getElementById('confidence');

  let correctAnswer;
  if (questions[currentQuestionIndex].correctAnswer.length > 0) {
    correctAnswer = questions[currentQuestionIndex].correctAnswer[0].toLowerCase();
  }
    const options = ['A', 'B', 'C', 'D'];
    options.forEach(option => {
      const optionElement = document.getElementById(`option-${option}`);
      if (optionElement.checked) {
        userAnswer = optionElement.value.toLowerCase();
      }
    });

  const userConfidence = parseInt(confidenceElement.value, 10) / 100;

  if (currentCorrectAnswers.includes(userAnswer)) {
    score++;
    brierScore += Math.pow(1 - userConfidence, 2);
  } else {
    brierScore += Math.pow(0 - userConfidence, 2);
  }
  // Save user's answer
  userAnswers.push(userAnswer);
  correctAnswers.push(currentCorrectAnswers);
  userConfidences.push(userConfidence);
  const username = document.getElementById('username').value.trim();
  db.collection('answers').add({
    username,
    questionIndex: currentQuestionIndex,
    userAnswer,
    correctAnswer,
    userConfidence,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function calculateConfidenceDecileScores(answers) {
  /**
   * The answers that comes in is pulled from the entire database, so it contains answers from all users.
   */
  // Create an array to store scores for each decile
  console.log("Your values for answers is: ", answers);
  const decileScores = Array(10).fill(0);
  const decileCounts = Array(10).fill(0);

  answers.forEach(answer => {
    // Find the decile for the confidence level (0-10)
    const decile = Math.min(Math.floor(answer.userConfidence * 10), 9);

    decileCounts[decile]++;
    if (answer.correctAnswer.includes(answer.userAnswer)) {
      decileScores[decile]++;
    }
  });

  return decileScores.map((score, index) => ({
    decileRange: `${index * 10}-${(index + 1) * 10}`,
    score: decileCounts[index] ? score / decileCounts[index] : null
  }));
}



function displayResults() {
  /**
   * This should be the individual results, not the group ones
   */
  quizContainer.style.display = 'none';

  brierScore /= questions.length;


  // const answers = snapshot.docs.map(doc => doc.data());
  const answers = userAnswers.map((userAnswer, index) => ({
    userAnswer,
    correctAnswer: correctAnswers[index],
    userConfidence: userConfidences[index],
  }));
  console.log("Your values for answers in displayResults is: ", answers);

  const confidenceDecileScores = calculateConfidenceDecileScores(answers);
  console.log("Your values for confidenceDecileScores is: ", confidenceDecileScores);

  resultsContainer.innerHTML = `
        <h2>Results</h2>
        <p>Correct answers: ${score} / ${questions.length}</p>
        <p>Brier score: ${brierScore.toFixed(2)}</p>
        ${confidenceDecileScores.map(({ decileRange, score }) => `
          <p>When you were ${decileRange}% confident, you were ${score !== null ? `correct ${Math.round(score * 100)}% of the time` : 'did not answer any questions'}.</p>
        `).join('')}
        <button id="show-leaderboard">Show Leaderboard</button>
      `;

  resultsContainer.style.display = 'block';
  displayIndividualResults();

  const showLeaderboardButton = document.getElementById('show-leaderboard');
  showLeaderboardButton.addEventListener('click', () => {
    resultsContainer.style.display = 'none';
    leaderboardContainer.style.display = 'block';
    calculateScores();
  });
}

function displayIndividualResults() {
  for (let i = 0; i < questions.length; i++) {
    const resultPara = document.createElement('p');
    const isCorrect = correctAnswers[i].includes(userAnswers[i]);
    const userConfidence = parseInt(document.getElementById('confidence').value, 10);
    resultPara.style.color = isCorrect ? 'green' : 'red';
    resultPara.textContent = `Question ${i + 1}: Your answer was ${userAnswers[i]} with ${userConfidences[i] * 100}% confidence. The correct answer(s) is/are ${correctAnswers[i].join(", ")}. You ${isCorrect ? 'were correct' : 'were wrong'}.`;
    resultsContainer.appendChild(resultPara);
  }
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
          const { userConfidence } = answer;
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

function sortScores(scores, orderBy = 'brierScore') {
  const scoresCopy = structuredClone(scores);
  const scoreEntries = Object.entries(scoresCopy);
  scoreEntries.sort((a, b) => {
    if (orderBy === 'username') {
      return a[0].localeCompare(b[0]);  // Compare the usernames
    }
    if (orderBy === 'correctAnswers') {
      return b[1].score - a[1].score; // Compare the scores
    }
    return a[1].brierScore - b[1].brierScore;  // Compare the brier scores
  });

  return scoreEntries;
}


let latestScores = {};  // global variable to store latest scores

document.getElementById("score-header").addEventListener('click', function () {
  displayLeaderboard(latestScores, 'correctAnswers');
});

document.getElementById("brier-header").addEventListener('click', function () {
  displayLeaderboard(latestScores, 'brierScore');
});

document.getElementById("username-header").addEventListener('click', function () {
  displayLeaderboard(latestScores, 'username');
});

function displayLeaderboard(scores, orderBy = 'brierScore') {
  latestScores = scores;  // update the global variable
  const sortedScores = sortScores(scores, orderBy);

  const leaderboardBody = document.getElementById("leaderboard-body");
  leaderboardBody.innerHTML = `
    ${sortedScores.map(([username, { score, brierScore }]) => `
      <tr>
        <td>${username}</td>
        <td>${score}</td>
        <td>${brierScore.toFixed(2)}</td>
      </tr>
    `).join('')}
  `;
  leaderboardContainer.style.display = 'block';
}
