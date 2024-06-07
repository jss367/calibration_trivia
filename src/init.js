// src/init.js

import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging } from "firebase/messaging";
import { getPerformance } from "firebase/performance";
import { getRemoteConfig } from "firebase/remote-config";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDTFpB2roR1dV2xDVNDpig6ykuco5iNYCU",
  authDomain: "calibration-trivia.firebaseapp.com",
  projectId: "calibration-trivia",
  storageBucket: "calibration-trivia.appspot.com",
  messagingSenderId: "65056414205",
  appId: "1:65056414205:web:e453dea073898b36f42194",
  measurementId: "G-KLBZBZB995"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);
const functions = getFunctions(app);
const messaging = getMessaging(app);
const storage = getStorage(app);
const remoteConfig = getRemoteConfig(app);
const performance = getPerformance(app);

export { analytics, app, auth, firestore, functions, messaging, performance, remoteConfig, storage };
