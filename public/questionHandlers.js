import { db } from './firebaseConfig.js';
import {
  categorySelectionContainer,
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
  sessionIdContainer,
  startButtonContainer,
  usernameContainer
} from './initialization.js';
import { getConfidenceInputHTML } from './util.js';

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

export function displayQuestionQuestioner(index) {
  // Implementation for displaying a question for the questioner...
}

export function displayQuestionForGroupParticipant(index) {
  // Implementation for displaying a question for a group participant...
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

// Function to start listening for updates on the current question index from Firestore
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
  // Implementation for submitting an answer...
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function displayQuestion(index) {
  const question = questions[index];

  if (!question) {
    console.error("Question not found for index: ", index);
    return;
  }

  // Create a new div for the question
  const questionDiv = document.createElement('div');

  // Initialize the answer input HTML
  let answerInputHTML = question.options.map((option, index) => `
    <div>
      <input type="radio" id="option-${index}" class="input-radio" name="answer" value="${option}">
      <label for="option-${index}">${String.fromCharCode(65 + index)}: ${option}</label>
    </div>
  `).join('');

  // Include the confidence input HTML
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
