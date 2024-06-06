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
