// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEti8r6yiz2TirDjDItY887Yk5_BffRQc",
  authDomain: "share-cross.firebaseapp.com",
  projectId: "share-cross",
  storageBucket: "share-cross.firebasestorage.app",
  messagingSenderId: "56904338848",
  appId: "1:56904338848:web:444de0bd66d669bcdfe8c5",
  measurementId: "G-0NZXM7SGRK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);