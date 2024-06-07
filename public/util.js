export function updateStartButtonState() {
  // Attempt to find a checked radio button
  const checkedModeRadioButton = document.querySelector('input[name="mode"]:checked');

  // Use the value if a radio button is checked, otherwise default to an empty string or a default value
  const mode = checkedModeRadioButton ? checkedModeRadioButton.value : '';

  const usernameInput = document.getElementById('username').value.trim();
  const sessionIdInput = document.getElementById('session-id').value.trim();
  const isCategorySelected = Array.from(document.querySelectorAll('.category-checkbox')).some(checkbox => checkbox.checked);

  let enableButton = false;

  // Based on mode, decide if the start button should be enabled
  if (mode === 'single') {
    enableButton = isCategorySelected;
  } else if (mode === 'group-questioner') {
    enableButton = sessionIdInput && isCategorySelected;
  } else if (mode === 'group-participant') {
    enableButton = usernameInput.length > 0;
  }

  document.getElementById('start-quiz').disabled = !enableButton;
}

export function updateNextButton() {
  console.log("inside updateNextButton");
  const sessionIdInput = document.getElementById('session-id').value.trim();
  const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
  const isAnyCategorySelected = Array.from(categoryCheckboxes).some(checkbox => checkbox.checked);

  nextButton.disabled = !(sessionIdInput.length > 0 && isAnyCategorySelected);
}

export function getConfidenceInputHTML() {
  return `
    <div>
      <label for="confidence">Confidence:</label>
      <input type="number" id="confidence" class="input-small" min="0" max="100" step="1">%
    </div>
  `;
}

export function getCurrentSessionId() {
  // Retrieve the session ID from local storage
  return localStorage.getItem('currentSessionId');
}

export function submitAnswerToFirestore(sessionId, userId, answer, confidence) {
  if (!sessionId || !userId) {
    console.error('Session ID or User ID is missing.');
    return;
  }

  const answerData = { answer, confidence, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
  db.collection('sessions').doc(sessionId).collection('answers').doc(userId).set(answerData)
    .then(() => console.log('Answer submitted successfully'))
    .catch(error => console.error("Error submitting answer:", error));
}

export function calculateConfidenceDecileScores(answers) {
  /**
   * The answers that comes in is pulled from the entire database, so it contains answers from all users.
   */
  // Create an array to store scores for each decile
  const decileScores = Array(10).fill(0);
  const decileCounts = Array(10).fill(0);
  const decileCorrectCounts = Array(10).fill(0);

  answers.forEach(answer => {
    const decile = Math.min(Math.floor(answer.userConfidence * 10), 9);
    decileCounts[decile]++;
    if (answer.correctAnswer === answer.userAnswer) {
      decileCorrectCounts[decile]++;
    }
  });

  return decileScores.map((_, index) => ({
    decileRange: `${index * 10}-${(index + 1) * 10}%`,
    score: decileCounts[index] ? decileCorrectCounts[index] / decileCounts[index] : null,
    correct: decileCorrectCounts[index],
    total: decileCounts[index]
  }));
}
