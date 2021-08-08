import { createContext } from 'react';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

const firebaseApp = firebase.initializeApp({
  apiKey: "AIzaSyBKg2mWg_1xFD2KERbF_S-kwbLk3Ntm5bo",
  authDomain: "sebastienchagnon.firebaseapp.com",
  databaseURL: "https://sebastienchagnon.firebaseio.com",
  projectId: "sebastienchagnon",
  storageBucket: "sebastienchagnon.appspot.com",
  messagingSenderId: "1075890477134",
  appId: "1:1075890477134:web:1a98f70dacd3c494a80b1f",
  measurementId: "G-RMNN4E64C9"
});

const db = firebaseApp.firestore();
db.settings({ ignoreUndefinedProperties: true });
if (window.location.hostname === 'localhost') {
  // db.useEmulator('localhost', 8080);
}

const auth = firebaseApp.auth();

type FirebaseContext = {
  db: firebase.firestore.Firestore,
  auth: firebase.auth.Auth,
}

const Firebase = createContext<FirebaseContext>({ db, auth });

export default Firebase;
