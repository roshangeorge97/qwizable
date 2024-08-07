import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Auth from './Auth';
import QuizGenerator from './QuizGenerator';
import Leaderboard from './Leaderboard';
import { signOut } from 'firebase/auth';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('quiz');
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const [user, loading, error] = useAuthState(auth);
  return (
    <div className="App">
      {user ? (
        <>
        <header>
        <h1>Qwizable😎</h1>
        <nav>
          <button onClick={() => setCurrentView('quiz')}>Quiz</button>
          <button onClick={() => setCurrentView('leaderboard')}>Leaderboard</button>
          <button className="sign-out" onClick={handleSignOut}>Sign Out</button>
        </nav>
      </header>
      <div className="content">
        {currentView === 'quiz' ? <QuizGenerator /> : <Leaderboard />}
      </div>
      </>
      ) : (<Auth />)}
    </div> 
  );
}

export default App;