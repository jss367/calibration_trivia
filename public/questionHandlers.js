import { db } from './firebaseConfig.js';

let currentQuestionIndex = 0;
let questions = [];

export function loadSessionQuestions(sessionId) {
  return db.collection('sessions').doc(sessionId).get()
    .then(doc => {
      if (doc.exists) {
        questions = doc.data().questions;
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
