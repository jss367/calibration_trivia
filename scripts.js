const quizContainer = document.getElementById('quiz-container');
const submitButton = document.getElementById('submit-button');
const resultsContainer = document.getElementById('results-container');

const questions = [
  {
    question: 'What is the capital of France?',
    correctAnswer: 'Paris',
  },
  // Add more questions here
];

function displayQuestions() {
  questions.forEach((question, index) => {
    const questionElement = document.createElement('div');
    questionElement.innerHTML = `
      <h2>Question ${index + 1}: ${question.question}</h2>
      <input type="text" id="answer-${index}" placeholder="Your answer">
      <input type="number" id="confidence-${index}" min="0" max="100" step="1" value="50">%
    `;
    quizContainer.appendChild(questionElement);
  });
}

displayQuestions();

submitButton.addEventListener('click', () => {
  // We'll implement the submit functionality in the next steps
});

submitButton.addEventListener('click', submitQuiz);

function submitQuiz() {
  let score = 0;
  let brierScore = 0;

  questions.forEach((question, index) => {
    const answerElement = document.getElementById(`answer-${index}`);
    const confidenceElement = document.getElementById(`confidence-${index}`);

    const userAnswer = answerElement.value.trim().toLowerCase();
    const correctAnswer = question.correctAnswer.toLowerCase();
    const userConfidence = parseInt(confidenceElement.value, 10) / 100;

    if (userAnswer === correctAnswer) {
      score++;
      brierScore += Math.pow(1 - userConfidence, 2);
    } else {
      brierScore += Math.pow(0 - userConfidence, 2);
    }
  });

  brierScore /= questions.length;

  displayResults(score, brierScore);
}

function displayResults(score, brierScore) {
  quizContainer.style.display = 'none';
  submitButton.style.display = 'none';

  resultsContainer.innerHTML = `
    <h2>Results</h2>
    <p>Correct answers: ${score} / ${questions.length}</p>
    <p>Brier score: ${brierScore.toFixed(2)}</p>
  `;

  resultsContainer.style.display = 'block';
}
