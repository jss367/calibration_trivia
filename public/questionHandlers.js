import { db } from './firebaseConfig.js';
import {
  categorySelectionContainer,
  currentQuestionIndex,
  modeSelectionContainer,
  nextButton,
  questionCountContainer,
  questions,
  quizContainer,
  sessionIdContainer,
  startButtonContainer,
  usernameContainer
} from './initialization.js';

export function loadSessionQuestions(sessionId) {
  return db.collection('sessions').doc(sessionId).get()
    .then(doc => {
      if (doc.exists) {
        questions.length = 0;
        questions.push(...doc.data().questions);
        if (questions.length > 0) {
          return questions;
        } else {
          throw new Error("No questions available");
        }
      } else {
        throw new Error("No such session");
      }
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

function onQuestionIndexUpdated(data) {
  if (data.currentQuestionIndex !== undefined && data.currentQuestionIndex !== currentQuestionIndex) {
    currentQuestionIndex = data.currentQuestionIndex;
    displayQuestionForGroupParticipant(currentQuestionIndex);
  }
}
