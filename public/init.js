// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTFpB2roR1dV2xDVNDpig6ykuco5iNYCU",
  authDomain: "calibration-trivia.firebaseapp.com",
  projectId: "calibration-trivia",
  storageBucket: "calibration-trivia.appspot.com",
  messagingSenderId: "65056414205",
  appId: "1:65056414205:web:e453dea073898b36f42194",
  measurementId: "G-KLBZBZB995"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
console.log('Firebase app initialized:', app);

const analytics = firebase.analytics(app);
const db = firebase.firestore(app);
const auth = firebase.auth(app);
const database = firebase.database(app);
const storage = firebase.storage(app);
const messaging = firebase.messaging(app);
const functions = firebase.functions(app);
const performance = firebase.performance(app);
const remoteConfig = firebase.remoteConfig(app);

console.log('Firebase services initialized:', { analytics, auth, database, db, functions, messaging, performance, remoteConfig, storage });
