
// Function to create a new session
export function createSession() {
    const sessionId = document.getElementById('session-id').value.trim();
    firebase.firestore().collection('sessions').doc(sessionId).set({
        currentQuestionIndex: 0,
        questions: [],
        active: true
    })
        .then(() => {
            console.log('Session created successfully with ID:', sessionId);
            // Store sessionId in a variable or local storage to use later
            localStorage.setItem('currentSessionId', sessionId);
        })
        .catch(error => console.error('Error creating session:', error));
}


export function generateRandomUsername() {
    const prefix = "Player_";
    const randomNum = Math.floor(Math.random() * 10000); // Random number between 0 and 9999
    return prefix + randomNum.toString().padStart(4, '0'); // Pad with zeros to ensure a uniform length
}




export function getCurrentSessionId() {
    // Retrieve the session ID from local storage
    return localStorage.getItem('currentSessionId');
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
        localStorage.setItem('currentSessionId', selectedSessionId); // Save to local storage or a variable
        // joinSessionListener(selectedSessionId); // Start listening for updates on the selected session
    } else {
        console.error('No session selected.');
    }
}
