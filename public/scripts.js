const quizContainer = document.getElementById('quiz-container');
const questionContainer = document.getElementById('question-container');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
const usernameContainer = document.getElementById('username-container');
const startQuizButton = document.getElementById('start-quiz');
const leaderboardContainer = document.getElementById('leaderboard-container');
const categorySelectionContainer = document.getElementById('category-selection-container')

const sessionIDSelectionContainer = document.getElementById('session-id-selection-container');
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
  console.log("Inside modeSelectionContainer event listener");
  // startQuizButton.style.display = 'flex';
  startButtonContainer.style.display = 'flex';

  // Handle for Group Questioner mode
  if (event.target.value === 'group-questioner') {
    console.log("Inside group-questioner if statement");
    document.getElementById('session-id-container').style.display = 'block';
    categorySelectionContainer.style.display = 'block';
    questionCountContainer.style.display = 'block';
    usernameContainer.style.display = 'none';
  } else {
    document.getElementById('session-id-container').style.display = 'none';
  }

  // Handle for Group Participant mode
  if (event.target.value === 'group-participant') {
    console.log("Inside group-participant if statement");
    usernameContainer.style.display = 'block';
    sessionIDSelectionContainer.style.display = 'block';
    loadAvailableSessions();
  } else {
    sessionIDSelectionContainer.style.display = 'none';
  }

  // Handle for Single Player mode
  if (event.target.value === 'single') {
    console.log("Inside single if statement");
    usernameContainer.style.display = 'block';
    questionCountContainer.style.display = 'block';
    categorySelectionContainer.style.display = 'block';
  } else {
    questionCountContainer.style.display = 'none';
  }
});

document.getElementById('username').addEventListener('input', function () {
  const usernameInput = this.value.trim();
  const startButton = document.getElementById('start-quiz');

  // Enable the start button only if the username is not empty
  if (usernameInput.length > 0) {
    startButton.disabled = false;
  } else {
    startButton.disabled = true;
  }
});

// Initially disable the start button until a username is entered
document.getElementById('start-quiz').disabled = true;

document.getElementById('join-session').addEventListener('click', () => {
  console.log("Inside join-session event listener");
  const selectedSessionId = document.getElementById('session-id-select').value;

  if (selectedSessionId) {
    // Logic to join the session, e.g., store the session ID locally
    localStorage.setItem('currentSessionId', selectedSessionId);
    loadSessionQuestions(selectedSessionId);
    // Additional logic to join the session goes here
  } else {
    console.log("Please select a session.");
  }
});

function loadSessionQuestions(sessionId) {
  console.log("Inside loadSessionQuestions");
  db.collection('sessions').doc(sessionId).get()
    .then(doc => {
      if (doc.exists) {
        questions = doc.data().questions;
        // Display the first question
        displayQuestionForGroupParticipant(currentQuestionIndex);
      } else {
        console.log("No such session!");
      }
    })
    .catch(error => console.error("Error loading session questions:", error));
}


document.getElementById('set-session-id').addEventListener('click', () => {
  console.log("Inside set-session-id event listener");
  const sessionId = document.getElementById('session-id').value.trim();
  if (sessionId) {
    // Save the session ID to Firestore
    db.collection('sessions').doc(sessionId).set({ active: true })
      .then(() => {
        console.log("Session ID set successfully:", sessionId);
        // Store the session ID locally if needed
        localStorage.setItem('currentSessionId', sessionId);
      })
      .catch(error => console.error("Error setting session ID:", error));
  } else {
    console.log("Please enter a session ID.");
  }
});


function loadAvailableSessions() {
  console.log("Inside loadAvailableSessions");
  db.collection('sessions').where('active', '==', true).get()
    .then(snapshot => {
      const sessionIdSelect = document.getElementById('session-id-select');
      sessionIdSelect.innerHTML = ''; // Clear existing options
      snapshot.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.id;
        sessionIdSelect.appendChild(option);
      });
    })
    .catch(error => console.error("Error fetching sessions:", error));
}



startQuizButton.addEventListener('click', () => {
  usernameContainer.style.display = 'none';
  modeSelectionContainer.style.display = 'none';
  startQuizButton.style.display = 'none';
  startButtonContainer.style.display = 'none';
  questionCountContainer.style.display = 'none';
  categorySelectionContainer.style.display = 'none';
  if (modeSinglePlayer.checked) {
    quizContainer.style.display = 'block';

  }
  loadQuestions();
});


function loadQuestions() {
  console.log("Inside loadQuestions");
  const questionCount = parseInt(document.getElementById('question-count').value, 10);
  const checkboxes = document.querySelectorAll('.category-checkbox');
  const selectedFiles = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  // Continue only if at least one category is selected
  if (selectedFiles.length === 0) {
    console.log("Please select at least one category.");
    return;
  }

  const promises = selectedFiles.map(file => fetch(file).then(response => {
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



function displayQuestionSubmission(index) {

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
  console.log("Inside nextButton event listener");
  // Check if Group Questioner or Group Participant mode is selected
  if (modeGroupQuestioner.checked || modeGroupParticipant.checked) {
    console.log("Inside modeGroupQuestioner.checked || modeGroupParticipant.checked if statement");
    const sessionId = getCurrentSessionId(); // Retrieve the current session ID for group modes
    // Call nextQuestion to advance to the next question in the session for group modes
    nextQuestion(sessionId);
  } else {
    console.log("Inside nextButton event listener else statement");
    // For Single Player mode, no sessionId is required
    // Check if it's not Group Questioner mode before submitting an answer
    submitAnswer(); // Same function for Single Player and Group Participant

    // Increment the current question index
    currentQuestionIndex++;

    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
      displayQuestion(currentQuestionIndex); // Display next question for Single Player
    } else {
      displayResults(); // Display results if it's the last question
    }
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
  console.log("Inside submitAnswer");

  const selectedOption = document.querySelector('input[name="answer"]:checked');
  const userAnswer = selectedOption ? selectedOption.value : null;
  const confidenceElement = document.getElementById('confidence');
  const userConfidence = parseInt(confidenceElement.value, 10) / 100;
  const currentCorrectAnswer = questions[currentQuestionIndex].correctAnswer;

  if (!userAnswer) {
    console.error('No answer selected');
    return; // Exit the function if no answer is selected
  }

  if (!selectedOption || !confidenceElement) {
    console.error('No answer or confidence selected');
    return; // Exit the function if no answer or confidence is selected
  }

  if (userAnswer === undefined || userConfidence === undefined) {
    console.error('Answer or confidence is undefined');
    return;
  }
  // Log values before submitting
  console.log('Submitting answer:', userAnswer, 'Confidence:', userConfidence);


  if (currentCorrectAnswer === userAnswer) {
    score++;
    brierScore += Math.pow(1 - userConfidence, 2);
  } else {
    brierScore += Math.pow(0 - userConfidence, 2);
  }


  // Save user's answer to Firestore
  const sessionId = getCurrentSessionId(); // Retrieve the current session ID
  const userId = document.getElementById('username').value.trim();
  submitAnswerToFirestore(sessionId, userId, userAnswer, userConfidence);

}

function getCurrentSessionId() {
  // Retrieve the session ID from local storage
  return localStorage.getItem('currentSessionId');
}

function submitAnswerToFirestore(sessionId, userId, answer, confidence) {
  console.log("Inside submitAnswerToFirestore");
  console.log('Session ID:', sessionId, 'User ID:', userId);

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


// Function to create a new session
function createSession() {
  const sessionId = generateSessionId(); // Implement this function to generate a unique ID
  db.collection('sessions').doc(sessionId).set({
    currentQuestionIndex: 0,
    participants: {}
  });
  // Store sessionId in a variable or local storage to use later
}


// Function to join a session
function joinSession(sessionId) {
  // Listen to changes in the session data
  db.collection('sessions').doc(sessionId).onSnapshot(doc => {
    const sessionData = doc.data();
    if (sessionData) {
      displayQuestion(sessionData.currentQuestionIndex);
      // Other updates like showing scores or leaderboard
    }
  });
}

function nextQuestion(sessionId) {
  // Increment the current question index
  currentQuestionIndex++;

  // Check if there are more questions
  if (currentQuestionIndex < questions.length) {
    // Update the current question index in the Firebase session
    db.collection('sessions').doc(sessionId).update({
      currentQuestionIndex: currentQuestionIndex
    });
  } else {
    // Handle the end of the quiz
    displayResults();
  }
}

function displayResults() {
  console.log("Inside displayResults");
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
  console.log("Inside displayIndividualResults");
  for (let i = 0; i < questions.length; i++) {
    const resultPara = document.createElement('p');
    console.log("Your values for correctAnswers[i] is: ", correctAnswers[i]);
    console.log("Your values for userAnswers[i] is: ", userAnswers[i]);

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
