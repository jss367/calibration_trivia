'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleModeSelection = handleModeSelection;

var _initialization = require('./initialization.js');

var _util = require('./util.js');

function handleModeSelection() {
  var mode = document.querySelector('input[name="mode"]:checked').value;
  localStorage.setItem('selectedMode', mode); // Save the selected mode to local storage

  _initialization.usernameContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
  _initialization.sessionIDSelectionContainer.style.display = mode === 'group-participant' ? 'block' : 'none';
  _initialization.sessionIdContainer.style.display = mode === 'group-questioner' ? 'block' : 'none';
  _initialization.categorySelectionContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';
  _initialization.questionCountContainer.style.display = ['single', 'group-questioner'].includes(mode) ? 'block' : 'none';

  (0, _util.updateStartButtonState)(); // Update start button state based on the new mode
}