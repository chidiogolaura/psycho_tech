// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0_LidVARyH7NqbwXbkOWghZ5HqtDLEm8",
  authDomain: "psychotech-app.firebaseapp.com",
  projectId: "psychotech-app",
  storageBucket: "psychotech-app.firebasestorage.app",
  messagingSenderId: "270730829554",
  appId: "1:270730829554:web:ebf10a4344c4beaccbfa6b",
  measurementId: "G-YDE2GKSNYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth=getAuth()
export const db = getFirestore(app)
export default app