import {
  categorySelectionContainer,
  questionCountContainer,
  sessionIDSelectionContainer,
  sessionIdContainer,
  usernameContainer
} from './initialization.js';
import { updateStartButtonState } from './util.js';

export function handleModeSelection() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  localStorage.setItem('selectedMode', mode);

  usernameContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
  sessionIDSelectionContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
  sessionIdContainer.style.display = mode === 'group-questioner' ? 'block' : 'none';
  categorySelectionContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';
  questionCountContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';

  updateStartButtonState(); // Update start button state based on the new mode
}
