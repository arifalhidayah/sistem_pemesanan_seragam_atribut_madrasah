// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDgoeIxejFv656itci-EpcI7zjDxvfUR2s",
  authDomain: "sistem-pemesanan-seragam.firebaseapp.com",
  projectId: "sistem-pemesanan-seragam",
  storageBucket: "sistem-pemesanan-seragam.firebasestorage.app",
  messagingSenderId: "473130643693",
  appId: "1:473130643693:web:c9313470f4faeac4e49ce4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);