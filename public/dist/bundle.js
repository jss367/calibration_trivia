(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _constants = require('./constants.js');

var _initialization = require('./initialization.js');

console.log('App Version:', _constants.appVersion);

document.addEventListener('DOMContentLoaded', _initialization.initialize);
},{"./constants.js":2,"./initialization.js":3}],2:[function(require,module,exports){
'use strict';

var appVersion = '1.2.2';
},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Exporting an object to hold the state
var state = exports.state = {
  currentQuestionIndex: 0,
  questions: [],
  score: 0,
  userAnswers: [],
  correctAnswers: [],
  userConfidences: []
};

var brierScore = exports.brierScore = 0; // Change const to let


// Other DOM elements and constants
var quizContainer = exports.quizContainer = document.getElementById('quiz-container');
var questionContainer = exports.questionContainer = document.getElementById('question-container');
var nextButton = exports.nextButton = document.getElementById('next-button');
var resultsContainer = exports.resultsContainer = document.getElementById('results-container');
var usernameContainer = exports.usernameContainer = document.getElementById('username-container');
var startQuizButton = exports.startQuizButton = document.getElementById('start-quiz');
var leaderboardContainer = exports.leaderboardContainer = document.getElementById('leaderboard-container');
var categorySelectionContainer = exports.categorySelectionContainer = document.getElementById('category-selection-container');
var sessionIDSelectionContainer = exports.sessionIDSelectionContainer = document.getElementById('session-id-selection-container');
var modeSelectionContainer = exports.modeSelectionContainer = document.getElementById('mode-selection-container');
var modeSinglePlayer = exports.modeSinglePlayer = document.getElementById('mode-single');
var modeGroupParticipant = exports.modeGroupParticipant = document.getElementById('mode-group-participant');
var modeGroupQuestioner = exports.modeGroupQuestioner = document.getElementById('mode-group-questioner');
var questionCountContainer = exports.questionCountContainer = document.getElementById('question-count-container');
var startButtonContainer = exports.startButtonContainer = document.getElementById('start-button-container');
var sessionIdContainer = exports.sessionIdContainer = document.getElementById('session-id-container');
},{}]},{},[1]);