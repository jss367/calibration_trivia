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
  const files = ['questions_science.json', 'questions_general.json', 'questions_rationality.json', 'questions_economics.json'];

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
      
      // Shuffle questions array here
      shuffleArray(questions);

      // Only keep as many questions as the user requested
      questions = questions.slice(0, questionCount);
      
      displayQuestion(currentQuestionIndex);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
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
  const currentCorrectAnswer = questions[currentQuestionIndex].correctAnswer;
  const confidenceElement = document.getElementById('confidence');

  let correctAnswer;
  if (questions[currentQuestionIndex].correctAnswer.length > 0) {
    correctAnswer = questions[currentQuestionIndex].correctAnswer;
  }
    const options = ['A', 'B', 'C', 'D'];
    options.forEach(option => {
      const optionElement = document.getElementById(`option-${option}`);
      if (optionElement.checked) {
        userAnswer = optionElement.value;
      }
    });

  const userConfidence = parseInt(confidenceElement.value, 10) / 100;

  if (currentCorrectAnswer === userAnswer) {
    score++;
    brierScore += Math.pow(1 - userConfidence, 2);
  } else {
    brierScore += Math.pow(0 - userConfidence, 2);
  }
  // Save user's answer
  userAnswers.push(userAnswer);
  correctAnswers.push(currentCorrectAnswer);
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
      `;

  resultsContainer.style.display = 'block';
  displayIndividualResults();

}

function displayIndividualResults() {
  for (let i = 0; i < questions.length; i++) {
    const resultPara = document.createElement('p');

    if (typeof correctAnswers[i] === 'object') {
      console.log("It was an object: ", correctAnswers[i])
      const userAnswerString = userAnswers[i].toString(); // Convert user's answer to string
      const isCorrect = correctAnswers[i].includes(userAnswerString);
      resultPara.style.color = isCorrect ? 'green' : 'red';
      resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswerString} with ${userConfidences[i] * 100}% confidence.<br>The correct answer is ${correctAnswers[i]}. You ${isCorrect ? 'were correct' : 'were wrong'}.`;

    } else {
      console.log("It was an string: ", correctAnswers[i])
      const isCorrect = correctAnswers[i] === userAnswers[i];
      resultPara.style.color = isCorrect ? 'green' : 'red';
      resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswers[i]} with ${userConfidences[i] * 100}% confidence.<br>The correct answer is ${correctAnswers[i]}. You ${isCorrect ? 'were correct' : 'were wrong'}.`;

    }

    resultsContainer.appendChild(resultPara);
  }
}
