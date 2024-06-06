import { handleModeSelection } from './modeHandlers.js';
import { updateStartButtonState } from './util.js';

export function setupEventListeners() {
  document.getElementById('mode-selection-container').addEventListener('change', handleModeSelection);
  document.getElementById('username').addEventListener('input', updateStartButtonState);
  document.getElementById('session-id').addEventListener('input', updateStartButtonState);
  document.querySelectorAll('.category-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateStartButtonState);
  });

  const startQuizButton = document.getElementById('start-quiz');
  startQuizButton.addEventListener('click', () => {
    const selectedMode = document.querySelector('input[name="mode"]:checked').value;
    // Handle quiz start logic based on the selected mode...
  });

  const nextButton = document.getElementById('next-button');
  nextButton.addEventListener('click', () => {
    // Handle the next button click...
  });

  // Other event listeners...
}
