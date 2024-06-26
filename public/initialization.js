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
import { displayQuestionerScreen } from './groupQuestioner.js';

export function initialize() {
    console.log("Initializing");
    setupEventListeners();
    restoreSavedMode();
    handleURLParameters();
}

function setupEventListeners() {
    console.log("Inside setupEventListeners")
    modeSelectionContainer.addEventListener('change', handleModeSelection);
    document.getElementById('username').addEventListener('input', updateStartButtonState);
    document.getElementById('session-id').addEventListener('input', updateStartButtonState);
    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updateStartButtonState);
    });
    updateStartButtonState();
}

function restoreSavedMode() {
    console.log("Inside restoreSavedMode")
    const savedMode = localStorage.getItem('selectedMode');
    if (savedMode) {
        document.getElementById(`mode-${savedMode}`).checked = true;
        handleModeSelection();
    }
}

function handleURLParameters() {
    console.log("Inside handleURLParameters");
    const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    console.log("pathSegments: ", pathSegments);
    const sessionIdFromURL = pathSegments[0];
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');

    if (sessionIdFromURL) {
        console.log("Session ID from URL:", sessionIdFromURL);
        localStorage.setItem('currentSessionId', sessionIdFromURL);

        if (userRole === 'questioner') {
            console.log("Detected role of questioner");
            handleQuestionerRejoin(sessionIdFromURL);
        } else if (userRole === 'participant') {
            console.log("Detected role of participant");
            handleParticipantJoin(sessionIdFromURL);
        }
    }
}

export function setupShareButton(sessionId) {
    const sessionIdContainer = document.getElementById('session-id-container');
    sessionIdContainer.innerHTML = `
        <p>Session ID: ${sessionId}</p>
        <button id="share-session">Share Session</button>
    `;

    document.getElementById('share-session').addEventListener('click', () => shareSession(sessionId));
}

function shareSession(sessionId) {
    const shareUrl = `${window.location.origin}/${sessionId}?role=participant`;
    const shareText = `Join my Calibration Trivia session! Session ID: ${sessionId}`;

    if (navigator.share) {
        navigator.share({
            title: 'Join Calibration Trivia Session',
            text: shareText,
            url: shareUrl,
        }).then(() => {
            console.log('Session shared successfully');
        }).catch((error) => {
            console.log('Error sharing session:', error);
            fallbackShare(shareUrl);
        });
    } else {
        fallbackShare(shareUrl);
    }
}

function fallbackShare(shareUrl) {
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Session link copied to clipboard!');
    }).catch((error) => {
        console.error('Failed to copy session link:', error);
        alert('Failed to copy session link. Please copy this URL manually: ' + shareUrl);
    });
}

function handleQuestionerRejoin(sessionId) {
    // Logic for questioner rejoining an existing session
    // This might involve loading the current state of the quiz
    // and displaying the appropriate screen
    loadSessionQuestions(sessionId)
        .then(() => displayQuestionerScreen(sessionId))
        .catch(error => {
            console.error("Error rejoining questioner session:", error);
            // Handle error (e.g., show an error message, reset to initial state)
        });
}

function handleParticipantJoin(sessionId) {
    // Logic for participant joining a session
    loadSessionQuestions(sessionId)
        .then(() => displayParticipantScreen(sessionId))
        .catch(error => {
            console.error("Error joining participant session:", error);
            // Handle error (e.g., show an error message, reset to initial state)
        });
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
    console.log("Inside updateStartButtonState")
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
