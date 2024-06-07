import { db } from './firebaseConfig.js';
import {
  brierScore,
  categorySelectionContainer,
  correctAnswers,
  currentQuestionIndex,
  modeGroupParticipant,
  modeGroupQuestioner,
  modeSelectionContainer,
  modeSinglePlayer,
  nextButton,
  questionContainer,
  questionCountContainer,
  questions,
  quizContainer,
  score,
  sessionIdContainer,
  startButtonContainer,
  userAnswers,
  userConfidences,
  usernameContainer
} from './initialization.js';
import { getConfidenceInputHTML, getCurrentSessionId, submitAnswerToFirestore } from './util.js';

export function loadSessionQuestions(sessionId) {
  return db.collection('sessions').doc(sessionId).get()
    .then(doc => {
      if (doc.exists) {
        console.log("Fetched document:", doc.data());
        if (doc.data().questions && doc.data().questions.length > 0) {
          questions.length = 0;
          questions.push(...doc.data().questions);
        } else {
          console.log("No questions available in this session!");
          throw new Error("No questions available");
        }
      } else {
        console.log("No such session!");
        throw new Error("No such session");
      }
    })
    .catch(error => {
      console.error("Error loading session questions:", error);
      throw error;
    });
}

export function loadQuestionsSingle() {
  console.log("inside loadQuestionsSingle");
  const questionCount = parseInt(document.getElementById('question-count').value, 10);
  const checkboxes = document.querySelectorAll('.category-checkbox');
  const selectedFiles = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  // Continue only if at least one category is selected
  if (selectedFiles.length === 0) {
    console.log("Please select at least one category."); // Should this be an error?
    return;
  }

  const promises = selectedFiles.map(file => fetch(file).then(response => {
    if (!response.ok) {
      throw new Error(`Network response was not ok for file ${file}`);
    }
    return response.json().catch(err => {
      throw new Error(`Invalid JSON in file ${file}: ${err.message}`);
    });
  }));

  Promise.all(promises)
    .then(loadedQuestionsArrays => {
      // Flatten the array of arrays into a single array
      questions.length = 0;
      questions.push(...[].concat(...loadedQuestionsArrays));

      // Shuffle questions array here
      shuffleArray(questions);

      // Only keep as many questions as the user requested
      questions.length = Math.min(questions.length, questionCount);

      console.log("modeSinglePlayer.checked is ", modeSinglePlayer.checked);
      console.log("modeGroupParticipant.checked is ", modeGroupParticipant.checked);
      console.log("modeGroupQuestioner.checked is ", modeGroupQuestioner.checked);

      // Switch this to just one of the modes
      if (modeSinglePlayer.checked) {
        displayQuestion(currentQuestionIndex);
      }
    })
    .catch((error) => {
      console.error('Error loading questions:', error.message);
    });
}

export function displayQuestion(index) {
  // This is for single player mode

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

  const confidenceInputHTML = getConfidenceInputHTML();

  questionDiv.innerHTML = `
    <h3>Question ${index + 1} of ${questions.length}</h3>
    <h2>${question.question}</h2>
    ${answerInputHTML}
    ${confidenceInputHTML}
  `;

  questionContainer.innerHTML = ''; // Clear previous question
  questionContainer.appendChild(questionDiv); // Append new question

  nextButton.style.display = 'block';
}

export function displayQuestionQuestioner(index) {
  // Implementation for displaying a question for the questioner...
}

export function displayQuestionForGroupParticipant(index) {
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

export function displayQuestionerScreen(sessionId) {
  loadSessionQuestions(sessionId)
    .then(() => {
      // Display the first question
      currentQuestionIndex = 0;
      displayQuestionQuestioner(currentQuestionIndex);

      // Set up questioner-specific UI elements
      quizContainer.style.display = 'block';
      modeSelectionContainer.style.display = 'none';
      startButtonContainer.style.display = 'none';
      questionCountContainer.style.display = 'none';
      categorySelectionContainer.style.display = 'none';
      sessionIdContainer.style.display = 'block'; // Show the session ID
      sessionIdContainer.innerHTML = `<p>Session ID: ${sessionId}</p>`;

      // Show the next button for the questioner to proceed to the next question
      nextButton.style.display = 'block';
      nextButton.disabled = false; // Enable the next button for the questioner
    })
    .catch(error => {
      console.error("Error displaying questioner screen:", error);
    });
}

export function displayResponderScreen(sessionId) {
  loadSessionQuestions(sessionId)
    .then(() => {
      quizContainer.style.display = 'block';
      modeSelectionContainer.style.display = 'none';
      startButtonContainer.style.display = 'none';
      usernameContainer.style.display = 'none'; // Hide username container if it's still visible
      sessionIdContainer.style.display = 'none'; // Hide session ID container if it's still visible

      // Additional setup for responder...
      // Initialize current question index
      currentQuestionIndex = 0;

      // Display the first question
      displayQuestionForGroupParticipant(currentQuestionIndex);

      // Start listening for updates on the current question index from Firestore
      startListeningForQuestionUpdates(sessionId);
    })
    .catch(error => {
      console.error("Error displaying responder screen:", error);
    });
}

export function loadQuestionsParticipant() {
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

export function onQuestionIndexUpdated(sessionData) {
  console.log('Inside onQuestionIndexUpdated');
  if (sessionData.currentQuestionIndex !== undefined && sessionData.currentQuestionIndex !== currentQuestionIndex) {
    // Submit the current answer before moving to the next question
    if (modeGroupParticipant.checked) {
      submitAnswer();
    }
    // Update the current question index
    currentQuestionIndex = sessionData.currentQuestionIndex;
    displayQuestionForGroupParticipant(currentQuestionIndex);
  }
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

function startListeningForQuestionUpdates(sessionId) {
  db.collection('sessions').doc(sessionId).onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.currentQuestionIndex !== undefined && data.currentQuestionIndex !== currentQuestionIndex) {
        onQuestionIndexUpdated(data);
      }
    } else {
      console.error("No such session!");
    }
  });
}

export function nextQuestion(sessionId) {
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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
