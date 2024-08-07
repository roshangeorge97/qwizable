// src/components/Auth.js
import React from 'react';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import './App.css'; // Make sure to create this CSS file

const Auth = () => {
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Welcome to Qwizable</h1>
        <p>Sign in to start your quiz adventure!</p>
        <button className="auth-button google-sign-in" onClick={handleGoogleSignIn}>
          <i className="fab fa-google"></i> Sign In with Google
        </button>
        <button className="auth-button sign-out" onClick={handleSignOut}>
          <i className="fas fa-sign-out-alt"></i> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Auth;