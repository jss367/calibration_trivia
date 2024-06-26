const modeSinglePlayer = document.getElementById('mode-single');

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
            console.error('Error loading questions:', error.message);
        });
}



export function displayQuestion(index) {
    // This is for single player mode

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

export function saveQuestionsToFirestore(sessionId, questionsArray) {
    firebase.firestore().collection('sessions').doc(sessionId).set({
        questions: questionsArray,
        active: true // or any other relevant session data
    })
        .then(() => console.log('Questions saved successfully'))
        .catch(error => console.error('Error saving questions:', error));
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
