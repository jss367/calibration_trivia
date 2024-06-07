import { db } from './firebaseConfig.js';

export function generateRandomUsername() {
  const prefix = "Player_";
  const randomNum = Math.floor(Math.random() * 10000);
  return prefix + randomNum.toString().padStart(4, '0');
}

export function loadAvailableSessions() {
  db.collection('sessions').where('active', '==', true).get()
    .then(snapshot => {
      const sessionIdSelect = document.getElementById('session-id-select');
      sessionIdSelect.innerHTML = '';
      snapshot.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.id;
        sessionIdSelect.appendChild(option);
      });
    })
    .catch(error => console.error("Error fetching sessions:", error));
}

export function saveQuestionsToFirestore(sessionId, questionsArray) {
  db.collection('sessions').doc(sessionId).set({
    questions: questionsArray,
    active: true
  })
    .then(() => console.log('Questions saved successfully'))
    .catch(error => console.error('Error saving questions:', error));
}

export function joinSelectedSession() {
  const selectedSessionId = document.getElementById('session-id-select').value;
  if (selectedSessionId) {
    localStorage.setItem('currentSessionId', selectedSessionId);
  } else {
    console.error('No session selected.');
  }
}

export function createSession() {
  const sessionId = document.getElementById('session-id').value.trim();
  db.collection('sessions').doc(sessionId).set({
    currentQuestionIndex: 0,
    questions: [],
    active: true
  })
    .then(() => {
      console.log('Session created successfully with ID:', sessionId);
      localStorage.setItem('currentSessionId', sessionId);
    })
    .catch(error => console.error('Error creating session:', error));
}