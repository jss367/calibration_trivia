
// Function to create a new session
export function createSession() {
    const sessionId = document.getElementById('session-id').value.trim();
    console.log('Creating session with ID:', sessionId);
    return firebase.firestore().collection('sessions').doc(sessionId).set({
        currentQuestionIndex: 0,
        questions: [],
        active: true
    })
        .then(() => {
            console.log('Session created successfully with ID:', sessionId);
            localStorage.setItem('currentSessionId', sessionId);
            console.log('currentSessionId set in localStorage:', sessionId);
            return sessionId;
        })
        .catch(error => {
            console.error('Error creating session:', error);
            throw error;
        });
}


export function generateRandomUsername() {
    const prefix = "Player_";
    const randomNum = Math.floor(Math.random() * 10000); // Random number between 0 and 9999
    return prefix + randomNum.toString().padStart(4, '0'); // Pad with zeros to ensure a uniform length
}


export function getCurrentSessionId() {
    const sessionId = localStorage.getItem('currentSessionId');
    console.log('Retrieved sessionId from localStorage:', sessionId);
    return sessionId;
}

export function loadSessionQuestions(sessionId) {
    console.log("Inside loadSessionQuestions");
    return firebase.firestore().collection('sessions').doc(sessionId).get()
        .then(doc => {
            if (doc.exists) {
                console.log("Fetched document:", doc.data());
                if (doc.data().questions && doc.data().questions.length > 0) {
                    questions = doc.data().questions;
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




export function loadAvailableSessions() {
    firebase.firestore().collection('sessions').where('active', '==', true).get()
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


// This function would be called when the participant selects a session and clicks a "Join Session" button
export function joinSelectedSession() {
    const selectedSessionId = document.getElementById('session-id-select').value;
    if (selectedSessionId) {
        console.log('Joining session with ID:', selectedSessionId);
        localStorage.setItem('currentSessionId', selectedSessionId);
        console.log('currentSessionId set in localStorage:', selectedSessionId);

        // Hide the entire session selection container
        const sessionSelectionContainer = document.getElementById('session-id-selection-container');
        sessionSelectionContainer.style.display = 'none';

        // Optionally, display the selected session ID
        const sessionInfoContainer = document.createElement('div');
        sessionInfoContainer.id = 'session-info-container';
        sessionInfoContainer.innerHTML = `<p>Selected Session: ${selectedSessionId}</p>`;
        sessionSelectionContainer.parentNode.insertBefore(sessionInfoContainer, sessionSelectionContainer.nextSibling);

        return Promise.resolve(selectedSessionId);
    } else {
        console.error('No session selected.');
        return Promise.reject(new Error('No session selected.'));
    }
}
