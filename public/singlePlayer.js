
import {
    nextButton,
    quizContainer,
    questions,
    questionContainer
} from './shared.js';


import { getConfidenceInputHTML } from './quizLogic.js';
export function loadQuestionsSingle() {
    return new Promise((resolve, reject) => {
        // Your existing logic to load questions
        const questionCount = parseInt(document.getElementById('question-count').value, 10);
        const checkboxes = document.querySelectorAll('.category-checkbox');
        const selectedFiles = Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        if (selectedFiles.length === 0) {
            console.log("Please select at least one category.");
            reject(new Error("No categories selected"));
            return;
        }

        const promises = selectedFiles.map(file =>
            fetch(file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok for file ${file}`);
                    }
                    return response.json();
                })
                .catch(err => {
                    throw new Error(`Invalid JSON in file ${file}: ${err.message}`);
                })
        );

        Promise.all(promises)
            .then(loadedQuestionsArrays => {
                // Flatten the array of arrays into a single array
                questions = [].concat(...loadedQuestionsArrays);
                shuffleArray(questions);
                questions = questions.slice(0, questionCount);
                resolve();
            })
            .catch(error => {
                console.error("Error loading questions:", error);
                reject(error);
            });
    });
}


export function displayQuestion(index) {
    console.log('Inside displayQuestion with index: ', index);
    console.log('questionContainer:', questionContainer);
    console.log('questionContainer style:', questionContainer.style.display);
    // This is for single player mode

    if (!questions[index]) {
        console.error("Question not found for index: ", index);
        return; // Exit the function if the question is not found
    }

    const question = questions[index];
    console.log('Question is ', question);
    // Create a new div for the question
    const questionDiv = document.createElement('div');
    console.log('questionContainer:', questionContainer);
    // Initialize the answer input HTML
    let answerInputHTML = '';
    console.log('questionContainer style:', questionContainer.style.display);
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

    console.log('questionContainer style:', questionContainer.style.display);
    questionContainer.innerHTML = ''; // Clear previous question
    questionContainer.appendChild(questionDiv); // Append new question
    console.log('questionContainer style:', questionContainer.style.display);
    nextButton.style.display = 'block';
    quizContainer.style.display = 'block';
    console.log('Quiz container display:', quizContainer.style.display);

    console.log('End of displayQuestion')
    console.log('questionContainer:', questionContainer);
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
