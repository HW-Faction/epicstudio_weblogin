// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbgMiunX_Mu--7hzKcuEUlJdJGL0hrZJA",
  authDomain: "epic-studio---ids.firebaseapp.com",
  projectId: "epic-studio---ids",
  storageBucket: "epic-studio---ids.firebasestorage.app",
  messagingSenderId: "221302444858",
  appId: "1:221302444858:web:0709edcda20dc425ebf603",
  measurementId: "G-Q3K3X453MC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);