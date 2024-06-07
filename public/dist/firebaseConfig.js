"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.db = exports.analytics = undefined;

var _analytics = require("firebase/analytics");

var _app = require("firebase/app");

var _firestore = require("firebase/firestore");

// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyDTFpB2roR1dV2xDVNDpig6ykuco5iNYCU",
  authDomain: "calibration-trivia.firebaseapp.com",
  projectId: "calibration-trivia",
  storageBucket: "calibration-trivia.appspot.com",
  messagingSenderId: "65056414205",
  appId: "1:65056414205:web:e453dea073898b36f42194",
  measurementId: "G-KLBZBZB995"
};

// Initialize Firebase
var app = (0, _app.initializeApp)(firebaseConfig);
var analytics = (0, _analytics.getAnalytics)(app);
var db = (0, _firestore.getFirestore)(app);

exports.analytics = analytics;
exports.db = db;