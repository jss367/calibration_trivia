const quizContainer = document.getElementById('quiz-container');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
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
}

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

loadQuestions();
