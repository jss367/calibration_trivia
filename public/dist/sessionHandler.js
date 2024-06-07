'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateRandomUsername = generateRandomUsername;
exports.loadAvailableSessions = loadAvailableSessions;
exports.saveQuestionsToFirestore = saveQuestionsToFirestore;
exports.joinSelectedSession = joinSelectedSession;
exports.createSession = createSession;

var _firebaseConfig = require('./firebaseConfig.js');

function generateRandomUsername() {
  var prefix = "Player_";
  var randomNum = Math.floor(Math.random() * 10000);
  return prefix + randomNum.toString().padStart(4, '0');
}

function loadAvailableSessions() {
  _firebaseConfig.db.collection('sessions').where('active', '==', true).get().then(function (snapshot) {
    var sessionIdSelect = document.getElementById('session-id-select');
    sessionIdSelect.innerHTML = '';
    snapshot.forEach(function (doc) {
      var option = document.createElement('option');
      option.value = doc.id;
      option.textContent = doc.id;
      sessionIdSelect.appendChild(option);
    });
  }).catch(function (error) {
    return console.error("Error fetching sessions:", error);
  });
}

function saveQuestionsToFirestore(sessionId, questionsArray) {
  _firebaseConfig.db.collection('sessions').doc(sessionId).set({
    questions: questionsArray,
    active: true
  }).then(function () {
    return console.log('Questions saved successfully');
  }).catch(function (error) {
    return console.error('Error saving questions:', error);
  });
}

function joinSelectedSession() {
  var selectedSessionId = document.getElementById('session-id-select').value;
  if (selectedSessionId) {
    localStorage.setItem('currentSessionId', selectedSessionId);
  } else {
    console.error('No session selected.');
  }
}

function createSession() {
  var sessionId = document.getElementById('session-id').value.trim();
  _firebaseConfig.db.collection('sessions').doc(sessionId).set({
    currentQuestionIndex: 0,
    questions: [],
    active: true
  }).then(function () {
    console.log('Session created successfully with ID:', sessionId);
    localStorage.setItem('currentSessionId', sessionId);
  }).catch(function (error) {
    return console.error('Error creating session:', error);
  });
}