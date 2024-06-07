import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  // Your firebase config
};

firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
