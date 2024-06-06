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
  startButtonContainer
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
  // Implementation for displaying the responder's screen...
}
