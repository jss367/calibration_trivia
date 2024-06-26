// initialization.js
import { loadAvailableSessions } from './sessionManagement.js';

import {
    startButtonContainer,
    sessionIdContainer,
    categorySelectionContainer,
    questionCountContainer,
    sessionIDSelectionContainer,
    usernameContainer,
    nextButton,
    modeSelectionContainer,
} from './shared.js';


export function initialize() {
    console.log("Initializing");
    modeSelectionContainer.addEventListener('change', handleModeSelection);
    document.getElementById('username').addEventListener('input', updateStartButtonState);
    document.getElementById('session-id').addEventListener('input', updateStartButtonState);
    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateStartButtonState);
    });
    updateStartButtonState();

    const savedMode = localStorage.getItem('selectedMode');
    if (savedMode) {
        document.getElementById(`mode-${savedMode}`).checked = true;
        handleModeSelection();
    }

    // Check URL for session ID and user role
    const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    const sessionIdFromURL = pathSegments[0];
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');

    if (sessionIdFromURL) {
        console.log("Session ID from URL:", sessionIdFromURL);
        localStorage.setItem('currentSessionId', sessionIdFromURL);
        if (userRole === 'questioner') {
            console.log("Detected role of questioner");
            displayQuestionerScreen(sessionIdFromURL);
        } else if (userRole === 'responder') {
            console.log("Detected role of responder");
            displayResponderScreen(sessionIdFromURL);
        }
    }
}

export function handleModeSelection() {
    console.log("inside handleModeSelection");
    const mode = document.querySelector('input[name="mode"]:checked').value;
    localStorage.setItem('selectedMode', mode);

    usernameContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
    sessionIDSelectionContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
    sessionIdContainer.style.display = mode === 'group-questioner' ? 'block' : 'none';
    categorySelectionContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';
    questionCountContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';
    startButtonContainer.style.display = 'block';

    updateStartButtonState();

    if (mode === 'group-participant') {
        loadAvailableSessions();
    }
}

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

    const startButton = document.getElementById('start-quiz');
    startButton.disabled = !enableButton;
    startButtonContainer.style.display = enableButton ? 'block' : 'none'; // Show/
}



export function updateNextButton() {
    console.log("inside updateNextButton");
    const sessionIdInput = document.getElementById('session-id').value.trim();
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
    const isAnyCategorySelected = Array.from(categoryCheckboxes).some(checkbox => checkbox.checked);

    nextButton.disabled = !(sessionIdInput.length > 0 && isAnyCategorySelected);
}
