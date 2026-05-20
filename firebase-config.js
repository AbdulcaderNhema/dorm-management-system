import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// // Susi ng iyong NoSQL Database
// const firebaseConfig = {
//     apiKey: "YOUR_API_KEY",
//     authDomain: "YOUR_AUTH_DOMAIN",
//     projectId: "YOUR_PROJECT_ID",
//     storageBucket: "YOUR_STORAGE_BUCKET",
//     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//     appId: "YOUR_APP_ID"
// };

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCp9DoerhTYmVnHFFUbeDikE_6FYmgzGnQ",
  authDomain: "dorm-system-55b8b.firebaseapp.com",
  projectId: "dorm-system-55b8b",
  storageBucket: "dorm-system-55b8b.firebasestorage.app",
  messagingSenderId: "897080807478",
  appId: "1:897080807478:web:fe9e224ee2fa4184ce8897",
  measurementId: "G-04VBNL2XZD"
};


// I-initialize ang Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// I-share natin ito sa `app.js` file sa pamamagitan ng window global object
window.db = db;
window.auth = auth;
window.dbTools = { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot };
window.authTools = { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };