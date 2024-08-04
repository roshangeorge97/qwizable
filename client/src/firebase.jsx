// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCcw1l425lbNLT2bLQ-MHzBW_hYdlZLfqY",
  authDomain: "qwizable-a9399.firebaseapp.com",
  projectId: "qwizable-a9399",
  storageBucket: "qwizable-a9399.appspot.com",
  messagingSenderId: "630923548842",
  appId: "1:630923548842:web:dd6fc6339e7f5bac5e98d3",
  measurementId: "G-G47N4DV7CS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);