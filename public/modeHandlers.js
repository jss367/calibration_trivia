import { updateStartButtonState } from './util.js';

export function handleModeSelection() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  localStorage.setItem('selectedMode', mode);

  const usernameContainer = document.getElementById('username-container');
  const sessionIDSelectionContainer = document.getElementById('session-id-selection-container');
  const sessionIdContainer = document.getElementById('session-id-container');
  const categorySelectionContainer = document.getElementById('category-selection-container');
  const questionCountContainer = document.getElementById('question-count-container');

  usernameContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
  sessionIDSelectionContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
  sessionIdContainer.style.display = mode === 'group-questioner' ? 'block' : 'none';
  categorySelectionContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';
  questionCountContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';

  updateStartButtonState(); // Update start button state based on the new mode
}
