"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storage = exports.remoteConfig = exports.performance = exports.messaging = exports.functions = exports.firestore = exports.auth = exports.app = exports.analytics = undefined;

var _analytics = require("firebase/analytics");

var _app = require("firebase/app");

var _auth = require("firebase/auth");

var _firestore = require("firebase/firestore");

var _functions = require("firebase/functions");

var _messaging = require("firebase/messaging");

var _performance = require("firebase/performance");

var _remoteConfig = require("firebase/remote-config");

var _storage = require("firebase/storage");

var firebaseConfig = {
  apiKey: "AIzaSyDTFpB2roR1dV2xDVNDpig6ykuco5iNYCU",
  authDomain: "calibration-trivia.firebaseapp.com",
  projectId: "calibration-trivia",
  storageBucket: "calibration-trivia.appspot.com",
  messagingSenderId: "65056414205",
  appId: "1:65056414205:web:e453dea073898b36f42194",
  measurementId: "G-KLBZBZB995"
}; // src/init.js

var app = (0, _app.initializeApp)(firebaseConfig);
var analytics = (0, _analytics.getAnalytics)(app);
var auth = (0, _auth.getAuth)(app);
var firestore = (0, _firestore.getFirestore)(app);
var functions = (0, _functions.getFunctions)(app);
var messaging = (0, _messaging.getMessaging)(app);
var storage = (0, _storage.getStorage)(app);
var remoteConfig = (0, _remoteConfig.getRemoteConfig)(app);
var performance = (0, _performance.getPerformance)(app);

exports.analytics = analytics;
exports.app = app;
exports.auth = auth;
exports.firestore = firestore;
exports.functions = functions;
exports.messaging = messaging;
exports.performance = performance;
exports.remoteConfig = remoteConfig;
exports.storage = storage;