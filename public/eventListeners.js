import {
  categorySelectionContainer,
  modeSelectionContainer,
  nextButton,
  questionCountContainer,
  sessionIDSelectionContainer,
  sessionIdContainer,
  startButtonContainer,
  startQuizButton,
  usernameContainer
} from './initialization.js';
import { handleModeSelection } from './modeHandlers.js';
import { joinSelectedSession, loadAvailableSessions } from './sessionHandlers.js';
import { updateNextButton, updateStartButtonState } from './util.js';

export function setupEventListeners() {
  modeSelectionContainer.addEventListener('change', handleModeSelection);
  document.getElementById('username').addEventListener('input', updateStartButtonState);
  document.getElementById('session-id').addEventListener('input', updateStartButtonState);
  document.querySelectorAll('.category-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateStartButtonState);
  });

  startQuizButton.addEventListener('click', () => {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    // Handle quiz start logic based on the selected mode...
  });

  nextButton.addEventListener('click', () => {
    // Handle the next button click...
  });

  // Event listener for mode selection
  modeSelectionContainer.addEventListener('change', (event) => {
    startButtonContainer.style.display = 'flex';

    if (event.target.value === 'group-questioner') {
      // Group Questioner specific elements
      sessionIdContainer.style.display = 'block';
      categorySelectionContainer.style.display = 'block';
      questionCountContainer.style.display = 'block';
      sessionIDSelectionContainer.style.display = 'none';
      usernameContainer.style.display = 'none';
      document.getElementById('start-quiz').disabled = false;
      startQuizButton.removeEventListener('click', joinSelectedSession);
      nextButton.disabled = true; // Initially disable the Next button

      document.getElementById('session-id').addEventListener('input', updateNextButton);
      document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateNextButton);
      });
    }
    else if (event.target.value === 'group-participant') {
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
      // Single Player specific elements
      sessionIdContainer.style.display = 'none';
      usernameContainer.style.display = 'none'; // Hide the username input field
      questionCountContainer.style.display = 'block';
      categorySelectionContainer.style.display = 'block';
      sessionIDSelectionContainer.style.display = 'none';
      document.getElementById('start-quiz').disabled = false; // Enable start button directly for single player
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
}
