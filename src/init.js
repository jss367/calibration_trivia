// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// The docs say I can leave the apiKey here:
// Usually, you need to fastidiously guard API keys (for example, by using a vault service or setting the keys as environment variables); however, API keys for Firebase services are ok to include in code or checked-in config files.
// https://firebase.google.com/docs/projects/api-keys
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
