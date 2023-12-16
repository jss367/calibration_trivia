const quizContainer = document.getElementById('quiz-container');
const questionContainer = document.getElementById('question-container');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
const usernameContainer = document.getElementById('username-container');
const startQuizButton = document.getElementById('start-quiz');
const leaderboardContainer = document.getElementById('leaderboard-container');

// Mode selection elements
const modeSelectionContainer = document.getElementById('mode-selection-container');
const modeSinglePlayer = document.getElementById('mode-single');
const modeGroupParticipant = document.getElementById('mode-group-participant');
const modeGroupQuestioner = document.getElementById('mode-group-questioner');
const questionCountContainer = document.getElementById('question-count-container');
const startButtonContainer = document.getElementById('start-button-container');


// Firebase Firestore initialization
const db = firebase.firestore();
let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let brierScore = 0;
let userAnswers = [];
let correctAnswers = [];
let userConfidences = [];

// Event listener for mode selection
modeSelectionContainer.addEventListener('change', (event) => {
  startQuizButton.style.display = 'flex';
  startButtonContainer.style.display = 'flex';
  if (event.target.value === 'single') {
    questionCountContainer.style.display = 'block';
  } else {
    questionCountContainer.style.display = 'none';
  }
});


startQuizButton.addEventListener('click', () => {
  usernameContainer.style.display = 'none';
  modeSelectionContainer.style.display = 'none';
  startQuizButton.style.display = 'none';
  startButtonContainer.style.display = 'none';
  questionCountContainer.style.display = 'none';
  if (modeSinglePlayer.checked) {
    quizContainer.style.display = 'block';
    
  } 
  loadQuestions();
});


function loadQuestions() {
  console.log("Inside loadQuestions");
  const questionCount = parseInt(document.getElementById('question-count').value, 10);
  const files = ['questions_science.json', 'questions_general.json', 'questions_rationality.json', 'questions_economics.json',
                'questions_music.json'];

  const promises = files.map(file => fetch(file).then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok for file ${file}`);
      }
      return response.json();
    })
  );

  Promise.all(promises)
    .then(loadedQuestionsArrays => {
      console.log("Inside Promise.all");
      // Flatten the array of arrays into a single array
      questions = [].concat(...loadedQuestionsArrays);
      
      // Shuffle questions array here
      shuffleArray(questions);

      // Only keep as many questions as the user requested
      questions = questions.slice(0, questionCount);
      
      console.log("modeSinglePlayer.checked is ", modeSinglePlayer.checked);
      console.log("modeGroupParticipant.checked is ", modeGroupParticipant.checked);
      console.log("modeGroupQuestioner.checked is ", modeGroupQuestioner.checked);


      // displayQuestion(currentQuestionIndex);
      if (modeSinglePlayer.checked) {
        displayQuestion(currentQuestionIndex);
      } else if (modeGroupParticipant.checked) {
        displayQuestionSubmission(currentQuestionIndex)
      } else if (modeGroupQuestioner.checked) {
        displayQuestionText(currentQuestionIndex)
      }
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

function displayQuestionText(index) {
  // This is for group questioner mode
  console.log("Inside function displayQuestionText");

  console.log("Current Index: ", index);
  console.log("Current Question: ", questions[index]);

  if (!questions[index]) {
    console.error("Question not found for index: ", index);
    return; // Exit the function if the question is not found
  }

  const question = questions[index];

  // Create a new div for the question
  const questionDiv = document.createElement('div');

  // Initialize the answer input HTML
  let answerInputHTML = '';

    const options = ['A', 'B', 'C', 'D'];
    // answerInputHTML = question.options.map((option, index) => `
    //   <div>
    //     <input type="radio" id="option-${options[index]}" class="input-radio" name="answer" value="${option}">
    //     <label for="option-${options[index]}">${options[index]}: ${option}</label>
    //   </div>
    // `).join('');

    answerInputHTML = question.options.map((option, index) => `
  <div>
    <label>${String.fromCharCode(65 + index)}: ${option}</label>
  </div>
`).join('');

    questionDiv.innerHTML = `
    <h2>${question.question}</h2>
    ${answerInputHTML}
  `;

  questionContainer.innerHTML = ''; // Clear previous question
  questionContainer.appendChild(questionDiv); // Append new question
  quizContainer.style.display = 'block'; // Ensure the quiz container is visible
  nextButton.style.display = 'block'; // Show the next button
}



function displayQuestionSubmission(index){

  console.log("Current Index: ", index);
  console.log("Current Question: ", questions[index]);

  if (!questions[index]) {
    console.error("Question not found for index: ", index);
    return; // Exit the function if the question is not found
  }

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

function displayQuestion(index) {
  // This is for single player mode

  console.log("Current Index: ", index);
  console.log("Current Question: ", questions[index]);

  if (!questions[index]) {
    console.error("Question not found for index: ", index);
    return; // Exit the function if the question is not found
  }

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
  // Check if it's not Group Questioner mode before submitting an answer
  if (!modeGroupQuestioner.checked) {
    submitAnswer(); // Same function for Single Player and Group Participant
  }

  // Increment the current question index
  currentQuestionIndex++;

  // Check if there are more questions
  if (currentQuestionIndex < questions.length) {
    if (modeSinglePlayer.checked || modeGroupParticipant.checked) {
      displayQuestion(currentQuestionIndex); // Display next question for Single Player and Group Participant
    } else if (modeGroupQuestioner.checked) {
      displayQuestionText(currentQuestionIndex); // Display next question for Group Questioner
    }
  } else {
    displayResults(); // Display results if it's the last question
  }
});



function displayQuestionForGroupParticipant(index) {
  console.log("Current Index: ", index);
  console.log("Current Question: ", questions[index]);

  if (!questions[index]) {
    console.error("Question not found for index: ", index);
    return; // Exit the function if the question is not found
  }

  const question = questions[index];

  // Create a new div for the question
  const questionDiv = document.createElement('div');

  // Generate the answer options HTML
  let answerInputHTML = question.options.map((option, index) => `
    <div>
      <input type="radio" id="option-${index}" class="input-radio" name="answer" value="${option}">
      <label for="option-${index}">${String.fromCharCode(65 + index)}: ${option}</label>
    </div>
  `).join('');

  questionDiv.innerHTML = `
    <h2>Question ${index + 1}: ${question.question}</h2>
    ${answerInputHTML}
  `;

  questionContainer.innerHTML = ''; // Clear previous content
  questionContainer.appendChild(questionDiv); // Append new content
}





function submitAnswer() {
  let userAnswer;
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
