import { db } from './firebaseConfig.js';

export function generateRandomUsername() {
  const prefix = "Player_";
  const randomNum = Math.floor(Math.random() * 10000); // Random number between 0 and 9999
  return prefix + randomNum.toString().padStart(4, '0'); // Pad with zeros to ensure a uniform length
}

export function loadAvailableSessions() {
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

export function joinSelectedSession() {
  const selectedSessionId = document.getElementById('session-id-select').value;
  if (selectedSessionId) {
    localStorage.setItem('currentSessionId', selectedSessionId); // Save to local storage or a variable
    // joinSessionListener(selectedSessionId); // Start listening for updates on the selected session
  } else {
    console.error('No session selected.');
  }
}
