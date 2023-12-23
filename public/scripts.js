const quizContainer = document.getElementById('quiz-container');
const questionContainer = document.getElementById('question-container');
const nextButton = document.getElementById('next-button');
const resultsContainer = document.getElementById('results-container');
const usernameContainer = document.getElementById('username-container');
const startQuizButton = document.getElementById('start-quiz');
const leaderboardContainer = document.getElementById('leaderboard-container');
const categorySelectionContainer = document.getElementById('category-selection-container')

const sessionIDSelectionContainer = document.getElementById('session-id-selection-container');
const modeSelectionContainer = document.getElementById('mode-selection-container');
const modeSinglePlayer = document.getElementById('mode-single');
const modeGroupParticipant = document.getElementById('mode-group-participant');
const modeGroupQuestioner = document.getElementById('mode-group-questioner');
const questionCountContainer = document.getElementById('question-count-container');
const startButtonContainer = document.getElementById('start-button-container');
const sessionIdContainer = document.getElementById('session-id-container');

const submitButton = document.getElementById('submit-button');


// Firebase Firestore initialization
const db = firebase.firestore();
let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let brierScore = 0;
let userAnswers = [];
let correctAnswers = [];
let userConfidences = [];

// Event listener for mode selection
modeSelectionContainer.addEventListener('change', (event) => {
    console.log("Inside modeSelectionContainer event listener");
    startButtonContainer.style.display = 'flex';

    if (event.target.value === 'group-questioner') {
        console.log("Inside group-questioner if statement");
        // Group Questioner specific elements
        sessionIdContainer.style.display = 'block';
        categorySelectionContainer.style.display = 'block';
        questionCountContainer.style.display = 'block';
        sessionIDSelectionContainer.style.display = 'none';
        usernameContainer.style.display = 'none';
        document.getElementById('start-quiz').disabled = false;
        startQuizButton.removeEventListener('click', joinSelectedSession);
    }
    else if (event.target.value === 'group-participant') {
        console.log("Inside group-participant if statement");
        // Group Participant specific elements
        sessionIdContainer.style.display = 'none';
        usernameContainer.style.display = 'block';
        sessionIDSelectionContainer.style.display = 'block';
        loadAvailableSessions();
        // Hide elements not used in Group Participant mode
        questionCountContainer.style.display = 'none';
        categorySelectionContainer.style.display = 'none';
        startQuizButton.removeEventListener('click', joinSelectedSession); // Remove existing listener if any
        startQuizButton.addEventListener('click', joinSelectedSession);
    }
    else if (event.target.value === 'single') {
        console.log("Inside single if statement");
        // Single Player specific elements
        sessionIdContainer.style.display = 'none';
        usernameContainer.style.display = 'block';
        questionCountContainer.style.display = 'block';
        categorySelectionContainer.style.display = 'block';
        sessionIDSelectionContainer.style.display = 'none';
        // Enable start button only if a username is entered
        document.getElementById('start-quiz').disabled = !document.getElementById('username').value.trim();
        startQuizButton.removeEventListener('click', joinSelectedSession);
    } else {
        // Default case: Hide all specific elements
        questionCountContainer.style.display = 'none';
        categorySelectionContainer.style.display = 'none';
        sessionIDSelectionContainer.style.display = 'none';
        document.getElementById('start-quiz').disabled = true;
        startQuizButton.removeEventListener('click', joinSelectedSession);
    }
});


document.getElementById('username').addEventListener('input', function () {
    const usernameInput = this.value.trim();
    const startButton = document.getElementById('start-quiz');

    // Enable the start button only if the username is not empty or if Group Questioner mode is selected
    if (usernameInput.length > 0 || modeGroupQuestioner.checked) {
        startButton.disabled = false;
    } else {
        startButton.disabled = true;
    }
});

// Initially disable the start button (except for group questioner mode)
document.getElementById('start-quiz').disabled = !modeGroupQuestioner.checked;


function loadSessionQuestions(sessionId) {
    console.log("Inside loadSessionQuestions");
    db.collection('sessions').doc(sessionId).get()
        .then(doc => {
            if (doc.exists) {
                console.log("Fetched document:", doc.data());
                if (doc.data().questions && doc.data().questions.length > 0) {
                    questions = doc.data().questions;
                    // Display the first question
                    displayQuestionForGroupParticipant(currentQuestionIndex);
                } else {
                    console.log("No questions available in this session!");
                }
            } else {
                console.log("No such session!");
            }
        })
        .catch(error => console.error("Error loading session questions:", error));
}


function loadAvailableSessions() {
    console.log("Inside loadAvailableSessions");
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
// Inside the startQuizButton event listener
startQuizButton.addEventListener('click', () => {
    console.log("Inside startQuizButton event listener");

    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    console.log("Selected Mode: ", selectedMode);

    // Hide UI elements not needed once the quiz starts
    usernameContainer.style.display = 'none';
    modeSelectionContainer.style.display = 'none';
    startButtonContainer.style.display = 'none';
    questionCountContainer.style.display = 'none';
    categorySelectionContainer.style.display = 'none';

    if (selectedMode === 'single') {
        console.log("Starting Single Player Mode");
        quizContainer.style.display = 'block';
        loadQuestionsSingle();
    } else if (selectedMode === 'group-participant') {
        console.log("Starting Group Participant Mode");
        const selectedSessionId = document.getElementById('session-id-select').value;
        if (selectedSessionId) {
            localStorage.setItem('currentSessionId', selectedSessionId);
            // joinSessionListener(selectedSessionId);
            // loadSessionQuestions(selectedSessionId);
        } else {
            console.log("Please select a session.");
        }
        loadQuestionsParticipant();
    } else if (selectedMode === 'group-questioner') {
        console.log("Starting Group Questioner Mode");
        const sessionId = document.getElementById('session-id').value.trim();
        if (sessionId) {
            // Save the session ID to Firestore and start the quiz
            db.collection('sessions').doc(sessionId).set({ active: true })
                .then(() => {
                    console.log("Session ID set successfully:", sessionId);
                    localStorage.setItem('currentSessionId', sessionId);

                    // Update UI to display session ID and hide input field
                    sessionIdContainer.innerHTML = `<p>Session ID: ${sessionId}</p>`;

                    quizContainer.style.display = 'none'; // This has the button in it too

                    loadQuestionsQuestioner(); // Load and display questions
                })
                .catch(error => console.error("Error setting session ID:", error));
        } else {
            console.log("Please enter a session ID.");
        }
    }
});



function loadQuestionsQuestioner() {
    console.log("Inside loadQuestionsQuestioner");
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
        return response.json();
    })
    );

    Promise.all(promises)
        .then(loadedQuestionsArrays => {
            console.log("Inside Promise.all");
            // Flatten the array of arrays into a single array

            questions = [].concat(...loadedQuestionsArrays);

            // Shuffle questions array here
            shuffleArray(questions);

            // Only keep as many questions as the user requested
            questions = questions.slice(0, questionCount);

            console.log("modeSinglePlayer.checked is ", modeSinglePlayer.checked);
            console.log("modeGroupParticipant.checked is ", modeGroupParticipant.checked);
            console.log("modeGroupQuestioner.checked is ", modeGroupQuestioner.checked);

            // Switch this to just one of the modes
            if (modeGroupQuestioner.checked) {
                displayQuestionQuestioner(currentQuestionIndex)
                const sessionId = getCurrentSessionId();
                if (sessionId) {
                    saveQuestionsToFirestore(sessionId, questions);
                } else {
                    console.log('Session ID not set for Group Questioner mode');
                }
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}


function loadQuestionsSingle() {
    console.log("Inside loadQuestionsSingle");
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
        return response.json();
    })
    );

    Promise.all(promises)
        .then(loadedQuestionsArrays => {
            console.log("Inside Promise.all");
            // Flatten the array of arrays into a single array

            questions = [].concat(...loadedQuestionsArrays);

            // Shuffle questions array here
            shuffleArray(questions);

            // Only keep as many questions as the user requested
            questions = questions.slice(0, questionCount);

            console.log("modeSinglePlayer.checked is ", modeSinglePlayer.checked);
            console.log("modeGroupParticipant.checked is ", modeGroupParticipant.checked);
            console.log("modeGroupQuestioner.checked is ", modeGroupQuestioner.checked);

            // Switch this to just one of the modes
            if (modeSinglePlayer.checked) {
                displayQuestion(currentQuestionIndex);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function displayQuestionQuestioner(index) {
    // This is for group questioner mode
    console.log("Inside function displayQuestionQuestioner");

    console.log("Current Index: ", index);
    console.log("Current Question: ", questions[index]);

    if (!questions[index]) {
        console.error("Question not found for index: ", index);
        return; // Exit the function if the question is not found
    }

    const question = questions[index];

    // Create a new div for the question
    const questionDiv = document.createElement('div');

    // Initialize the answer input HTML
    let answerInputHTML = '';

    answerInputHTML = question.options.map((option, index) => `
  <div>
    <label>${String.fromCharCode(65 + index)}: ${option}</label>
  </div>
`).join('');

    questionDiv.innerHTML = `
    <h2>${question.question}</h2>
    ${answerInputHTML}
  `;

    questionContainer.innerHTML = ''; // Clear previous question
    questionContainer.appendChild(questionDiv); // Append new question
    quizContainer.style.display = 'block'; // Ensure the quiz container is visible
}


// Function for the Questioner to call when ready to move to the next question
function questionerNextQuestion(sessionId) {
    console.log("Inside questionerNextQuestion with sessionId: ", sessionId);
    // Increment the current question index
    currentQuestionIndex++;
    console.log("Current Question Index: ", currentQuestionIndex);

    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
        // Update the current question index in the Firebase session
        db.collection('sessions').doc(sessionId).update({
            currentQuestionIndex: currentQuestionIndex
        }).then(() => {
            console.log('Question index updated successfully.');
            // You may want to notify participants to wait for the next question
        }).catch(error => {
            console.error('Error updating question index:', error);
        });
    } else {
        // Handle the end of the quiz
        displayResults();
    }
}


// This function will be triggered for participants when the session's currentQuestionIndex changes
function onQuestionIndexUpdated(sessionData) {
    console.log("Inside onQuestionIndexUpdated with sessionData: ", sessionData);
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



// This function would be called when the participant selects a session and clicks a "Join Session" button
function joinSelectedSession() {
    console.log("Inside joinSelectedSession");
    const selectedSessionId = document.getElementById('session-id-select').value;
    if (selectedSessionId) {
        localStorage.setItem('currentSessionId', selectedSessionId); // Save to local storage or a variable
        // joinSessionListener(selectedSessionId); // Start listening for updates on the selected session
    } else {
        console.error('No session selected.');
    }
}



// Later on, you can retrieve the session ID like this:
function getCurrentSessionId() {
    console.log("Inside getCurrentSessionId");
    // Replace this with however you're storing the session ID, e.g., local storage or a global variable
    return localStorage.getItem('currentSessionId');
}


function getConfidenceInputHTML() {
    return `
      <div>
        <label for="confidence">Confidence:</label>
        <input type="number" id="confidence" class="input-small" min="0" max="100" step="1">%
      </div>
    `;
}


function displayQuestion(index) {
    // This is for single player mode

    console.log("Current Index: ", index);
    console.log("Current Question: ", questions[index]);

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

    questionDiv.innerHTML = `
    <h2>${question.question}</h2>
    ${answerInputHTML}
    <input type="number" id="confidence" class="input-small" min="0" max="100" step="1" value="50">%
  `;

    questionContainer.innerHTML = ''; // Clear previous question
    questionContainer.appendChild(questionDiv); // Append new question

    nextButton.style.display = 'block';
}

function saveQuestionsToFirestore(sessionId, questionsArray) {
    console.log("Inside saveQuestionsToFirestore");
    db.collection('sessions').doc(sessionId).set({
        questions: questionsArray,
        active: true // or any other relevant session data
    })
        .then(() => console.log('Questions saved successfully'))
        .catch(error => console.error('Error saving questions:', error));
}


nextButton.classList.add('button-spacing');

nextButton.addEventListener('click', () => {
    console.log("Inside nextButton event listener");

    // Handling for Group Questioner mode
    if (modeGroupQuestioner.checked) {
        console.log("Handling Group Questioner mode");
        console.log("THIS SHOULD NOT HAPPEN");

        // Increment the current question index
        currentQuestionIndex++;

        // Check if there are more questions
        if (currentQuestionIndex < questions.length) {
            displayQuestionQuestioner(currentQuestionIndex); // Display next question for Group Questioner
        } else {
            displayResults(); // Display results if it's the last question
        }
    }
    else if (modeGroupParticipant.checked) {
        submitAnswer();
        const sessionId = getCurrentSessionId(); // Retrieve the current session ID for group modes
        nextQuestion(sessionId); // Advance to the next question in the session for Group Participant mode
    }
    else {
        // For Single Player mode, handle answer submission and question navigation
        submitAnswer();

        // Increment the current question index
        currentQuestionIndex++;

        // Check if there are more questions
        if (currentQuestionIndex < questions.length) {
            displayQuestion(currentQuestionIndex); // Display next question for Single Player
        } else {
            displayResults(); // Display results if it's the last question
        }
    }
});


submitButton.addEventListener('click', () => {
    submitAnswer();
});

function loadQuestionsParticipant() {
    console.log("Inside loadQuestionsParticipant");

    const sessionId = getCurrentSessionId();
    if (!sessionId) {
        console.error("No session ID found.");
        return;
    }

    db.collection('sessions').doc(sessionId).get()
        .then(doc => {
            if (doc.exists && doc.data().questions) {
                console.log("Fetched session questions:", doc.data().questions);
                questions = doc.data().questions;
                currentQuestionIndex = 0;
                displayQuestionForGroupParticipant(currentQuestionIndex);
            } else {
                console.error("No questions available in this session or session does not exist.");
            }
        })
        .catch(error => console.error("Error loading session questions:", error));
}




function displayQuestionForGroupParticipant(index) {
    console.log("Inside displayQuestionForGroupParticipant");

    console.log("Current Index: ", index);
    console.log("Current Question: ", questions[index]);

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

    // Add confidence input
    questionDiv.innerHTML = `
    ${answerInputHTML}
    ${getConfidenceInputHTML()}
  `;

    questionContainer.innerHTML = ''; // Clear previous content
    questionContainer.appendChild(questionDiv); // Append new content

    // Make sure the quiz container is visible
    quizContainer.style.display = 'block';
    nextButton.style.display = 'block';
}






function submitAnswer() {
    console.log("Inside submitAnswer");

    // Get the selected answer and confidence level
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    const userAnswer = selectedOption ? selectedOption.value : null;
    const confidenceElement = document.getElementById('confidence');
    const userConfidence = parseInt(confidenceElement.value, 10) / 100;

    // Log the scenario where no answer or confidence is selected
    if (!selectedOption || !confidenceElement) {
        console.warn('No answer or confidence selected for current question');
    } else {
        // Log values before submitting
        console.log('Submitting answer:', userAnswer, 'Confidence:', userConfidence);
    }

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
    userConfidences.push(userConfidence);

    // Save the user's answer to Firestore
    const sessionId = getCurrentSessionId(); // Retrieve the current session ID
    const userId = document.getElementById('username').value.trim();
    if (userId && sessionId) {
        submitAnswerToFirestore(sessionId, userId, userAnswer, userConfidence);
        submitButton.style.display = 'none';
    } else {
        console.error('Session ID or User ID is missing');
    }

    // Reset the answer selection for the next question
    if (selectedOption) {
        selectedOption.checked = false;
    }
    document.getElementById('confidence').value = 50; // Reset confidence to default
}


function getCurrentSessionId() {
    // Retrieve the session ID from local storage
    return localStorage.getItem('currentSessionId');
}

function submitAnswerToFirestore(sessionId, userId, answer, confidence) {
    console.log("Inside submitAnswerToFirestore");
    console.log('Session ID:', sessionId, 'User ID:', userId);

    if (!sessionId || !userId) {
        console.error('Session ID or User ID is missing.');
        return;
    }

    const answerData = { answer, confidence, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    db.collection('sessions').doc(sessionId).collection('answers').doc(userId).set(answerData)
        .then(() => console.log('Answer submitted successfully'))
        .catch(error => console.error("Error submitting answer:", error));
}

function calculateConfidenceDecileScores(answers) {
    /**
     * The answers that comes in is pulled from the entire database, so it contains answers from all users.
     */
    // Create an array to store scores for each decile
    console.log("Your values for answers is: ", answers);
    const decileScores = Array(10).fill(0);
    const decileCounts = Array(10).fill(0);

    answers.forEach(answer => {
        // Find the decile for the confidence level (0-10)
        const decile = Math.min(Math.floor(answer.userConfidence * 10), 9);

        decileCounts[decile]++;
        if (answer.correctAnswer.includes(answer.userAnswer)) {
            decileScores[decile]++;
        }
    });

    return decileScores.map((score, index) => ({
        decileRange: `${index * 10}-${(index + 1) * 10}`,
        score: decileCounts[index] ? score / decileCounts[index] : null
    }));
}


// Function to create a new session
function createSession() {
    console.log("Inside createSession");
    const sessionId = document.getElementById('session-id').value.trim();
    db.collection('sessions').doc(sessionId).set({
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


function nextQuestion(sessionId) {
    console.log("Inside nextQuestion with sessionId: ", sessionId);
    // Increment the current question index
    console.log("Current Question Index before updating: ", currentQuestionIndex);
    currentQuestionIndex++;
    console.log("Current Question Index after updating: ", currentQuestionIndex);
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

function displayResults() {
    console.log("Inside displayResults");

    // Hide quiz container
    quizContainer.style.display = 'none';

    if (modeGroupQuestioner.checked) {
        // For Group Questioner, only display the leaderboard
        displayLeaderboard(getCurrentSessionId());
    } else {
        // Calculate and display individual results for participants
        brierScore /= questions.length;

        const answers = userAnswers.map((userAnswer, index) => ({
            userAnswer,
            correctAnswer: correctAnswers[index],
            userConfidence: userConfidences[index],
        }));
        console.log("Your values for answers in displayResults is: ", answers);

        const confidenceDecileScores = calculateConfidenceDecileScores(answers);
        console.log("Your values for confidenceDecileScores is: ", confidenceDecileScores);

        resultsContainer.innerHTML = `
      <h2>Results</h2>
      <p>Correct answers: ${score} / ${questions.length}</p>
      <p>Brier score: ${brierScore.toFixed(2)}</p>
      ${confidenceDecileScores.map(({ decileRange, score }) => {
            if (score === null) {
                return `<p>You did not answer any questions with ${decileRange}% confidence.</p>`;
            } else {
                return `<p>When you were ${decileRange}% confident, you were correct ${Math.round(score * 100)}% of the time.</p>`;
            }
        }).join('')}
    `;

        resultsContainer.style.display = 'block';
        displayIndividualResults();
    }
}


function displayIndividualResults() {
    console.log("Inside displayIndividualResults");
    for (let i = 0; i < questions.length; i++) {
        const resultPara = document.createElement('p');
        console.log("Your values for correctAnswers[i] is: ", correctAnswers[i]);
        console.log("Your values for userAnswers[i] is: ", userAnswers[i]);

        if (typeof correctAnswers[i] === 'object') {
            console.log("It was an object: ", correctAnswers[i])
            const userAnswerString = userAnswers[i].toString(); // Convert user's answer to string
            const isCorrect = correctAnswers[i].includes(userAnswerString);
            resultPara.style.color = isCorrect ? 'green' : 'red';
            resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswerString} with ${userConfidences[i] * 100}% confidence.<br>The correct answer is ${correctAnswers[i]}. You ${isCorrect ? 'were correct' : 'were wrong'}.`;

        } else {
            console.log("It was an string: ", correctAnswers[i])

            const isCorrect = correctAnswers[i] === userAnswers[i];
            resultPara.style.color = isCorrect ? 'green' : 'red';
            resultPara.innerHTML = `Question ${i + 1}: ${questions[i].question}<br>Your answer was ${userAnswers[i]} with ${userConfidences[i] * 100}% confidence.<br>The correct answer is ${correctAnswers[i]}. You ${isCorrect ? 'were correct' : 'were wrong'}.`;
        }
        resultsContainer.appendChild(resultPara);
    }
}


function displayLeaderboard(sessionId) {
    console.log("Displaying leaderboard for session:", sessionId);

    db.collection('sessions').doc(sessionId).collection('answers')
        .get()
        .then(querySnapshot => {
            const scores = {};
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const userId = doc.id;
                // Assuming 'answer' and 'confidence' are stored in each doc
                if (!scores[userId]) {
                    scores[userId] = { correct: 0, total: 0 };
                }
                const isCorrect = questions[scores[userId].total].correctAnswer === data.answer;
                if (isCorrect) {
                    scores[userId].correct++;
                }
                scores[userId].total++;
            });

            // Display the leaderboard
            const leaderboardDiv = document.getElementById('leaderboard-container');
            leaderboardDiv.innerHTML = '<h2>Leaderboard</h2>';
            Object.keys(scores).forEach(userId => {
                const score = scores[userId];
                const scoreElement = document.createElement('p');
                scoreElement.innerText = `${userId}: ${score.correct} / ${score.total}`;
                leaderboardDiv.appendChild(scoreElement);
            });
            leaderboardDiv.style.display = 'block';
        })
        .catch(error => {
            console.error("Error getting documents: ", error);
        });
}
