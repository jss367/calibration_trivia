import { db } from './firebaseConfig.js';
import {
  questions
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
