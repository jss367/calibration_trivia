import { db } from './firebaseConfig.js';
import {
  brierScore,
  categorySelectionContainer,
  correctAnswers,
  currentQuestionIndex,
  modeGroupParticipant,
  modeGroupQuestioner,
  modeSelectionContainer,
  modeSinglePlayer,
  nextButton,
  questionContainer,
  questionCountContainer,
  questions,
  quizContainer,
  score,
  sessionIdContainer,
  startButtonContainer,
  userAnswers,
  userConfidences,
  usernameContainer
} from './initialization.js';
import { getConfidenceInputHTML, getCurrentSessionId, submitAnswerToFirestore } from './util.js';

export function loadSessionQuestions(sessionId) {
  return db.collection('sessions').doc(sessionId).get()
    .then(doc => {
      if (doc.exists) {
        console.log("Fetched document:", doc.data());
        if (doc.data().questions && doc.data().questions.length > 0) {
          questions.length = 0;
          questions.push(...doc.data().questions);
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

export function loadQuestionsSingle() {
  console.log("inside loadQuestionsSingle");
  const questionCount = parseInt(document.getElementById('question-count').value, 10);
  const checkboxes = document.querySelectorAll('.category-checkbox');
  const selectedFiles = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  if (selectedFiles.length === 0) {
    console.log("Please select at least one category.");
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
      questions.length = 0;
      questions.push(...[].concat(...loadedQuestionsArrays));
      shuffleArray(questions);
      questions.length = Math.min(questions.length, questionCount);

      if (modeSinglePlayer.checked) {
        displayQuestion(currentQuestionIndex);
      }
    })
    .catch((error) => {
      console.error('Error loading questions:', error.message);
    });
}

export function displayQuestion(index) {
  if (!questions[index]) {
    console.error("Question not found for index: ", index);
    return;
  }

  const question = questions[index];
  const questionDiv = document.createElement('div');

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

  questionContainer.innerHTML = '';
  questionContainer.appendChild(questionDiv);

  nextButton.style.display = 'block';
}

export function displayQuestionQuestioner(index) {
  // Implementation for displaying a question for the questioner...
}

export function displayQuestionForGroupParticipant(index) {
  if (!questions[index]) {
    console.error("Question not found for index: ", index);
    return;
  }

  const question = questions[index];
  const questionDiv = document.createElement('div');

  let answerInputHTML = question.options.map((option, index) => `
    <div>
      <input type="radio" id="option-${index}" class="input-radio" name="answer" value="${option}">
      <label for="option-${index}">${String.fromCharCode(65 + index)}: ${option}</label>
    </div>
  `).join('');

  questionDiv.innerHTML = `
    <h3>Question ${index + 1} of ${questions.length}</h3>
    ${answerInputHTML}
    ${getConfidenceInputHTML()}
  `;

  questionContainer.innerHTML = '';
  questionContainer.appendChild(questionDiv);

  quizContainer.style.display = 'block';
  nextButton.style.display = 'block';
}

export function displayQuestionerScreen(sessionId) {
  loadSessionQuestions(sessionId)
    .then(() => {
      currentQuestionIndex = 0;
      displayQuestionQuestioner(currentQuestionIndex);

      quizContainer.style.display = 'block';
      modeSelectionContainer.style.display = 'none';
      startButtonContainer.style.display = 'none';
      questionCountContainer.style.display = 'none';
      categorySelectionContainer.style.display = 'none';
      sessionIdContainer.style.display = 'block';
      sessionIdContainer.innerHTML = `<p>Session ID: ${sessionId}</p>`;

      nextButton.style.display = 'block';
      nextButton.disabled = false;
    })
    .catch(error => {
      console.error("Error displaying questioner screen:", error);
    });
}

export function displayResponderScreen(sessionId) {
  loadSessionQuestions(sessionId)
    .then(() => {
      quizContainer.style.display = 'block';
      modeSelectionContainer.style.display = 'none';
      startButtonContainer.style.display = 'none';
      usernameContainer.style.display = 'none';
      sessionIdContainer.style.display = 'none';

      currentQuestionIndex = 0;
      displayQuestionForGroupParticipant(currentQuestionIndex);

      startListeningForQuestionUpdates(sessionId);
    })
    .catch(error => {
      console.error("Error displaying responder screen:", error);
    });
}

export function loadQuestionsParticipant() {
  const sessionId = getCurrentSessionId();
  if (!sessionId) {
    console.error("No session ID found.");
    return;
  }

  db.collection('sessions').doc(sessionId).get()
    .then(doc => {
      if (doc.exists && doc.data().questions) {
        questions = doc.data().questions;
        currentQuestionIndex = 0;
        displayQuestionForGroupParticipant(currentQuestionIndex);
      } else {
        console.error("No questions available in this session or session does not exist.");
      }
    })
    .catch(error => console.error("Error loading session questions:", error));
}

export function onQuestionIndexUpdated(sessionData) {
  console.log('Inside onQuestionIndexUpdated');
  if (sessionData.currentQuestionIndex !== undefined && sessionData.currentQuestionIndex !== currentQuestionIndex) {
    if (modeGroupParticipant.checked) {
      submitAnswer();
    }
    currentQuestionIndex = sessionData.currentQuestionIndex;
    displayQuestionForGroupParticipant(currentQuestionIndex);
  }
}

function submitAnswer() {
  console.log("Inside submitAnswer");
  const selectedOption = document.querySelector('input[name="answer"]:checked');
  const confidenceElement = document.getElementById('confidence');

  let userAnswer = null;
  let userConfidence = null;

  if (selectedOption) {
    userAnswer = selectedOption.value;
  }

  if (confidenceElement) {
    userConfidence = parseInt(confidenceElement.value, 10);
    userConfidence = Math.max(0, Math.min(userConfidence, 100));
    userConfidence = Math.round(userConfidence) / 100;
  }

  if (!selectedOption || isNaN(userConfidence)) {
    console.warn('No answer or invalid confidence selected for current question');
  } else {
    const currentCorrectAnswer = questions[currentQuestionIndex].correctAnswer;
    if (currentCorrectAnswer === userAnswer) {
      score++;
      brierScore += Math.pow(1 - userConfidence, 2);
    } else {
      brierScore += Math.pow(0 - userConfidence, 2);
    }

    userAnswers.push(userAnswer);
    correctAnswers.push(currentCorrectAnswer);
    userConfidences.push(userConfidence);

    const sessionId = getCurrentSessionId();
    const userId = document.getElementById('username').value.trim();

    if (userId && sessionId) {
      submitAnswerToFirestore(sessionId, userId, userAnswer, userConfidence);
    }

    if (selectedOption) {
      selectedOption.checked = false;
    }
    if (confidenceElement) {
      confidenceElement.value = '';
    }
  }
}

function startListeningForQuestionUpdates(sessionId) {
  db.collection('sessions').doc(sessionId).onSnapshot(doc => {
    if (doc.exists) {
      const data = doc.data();
      if (data.currentQuestionIndex !== undefined && data.currentQuestionIndex !== currentQuestionIndex) {
        onQuestionIndexUpdated(data);
      }
    } else {
      console.error("No such session!");
    }
  });
}

export function nextQuestion(sessionId) {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    displayQuestionForGroupParticipant(currentQuestionIndex);
  } else {
    displayResults();
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
