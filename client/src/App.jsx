import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Auth from './Auth';
import QuizGenerator from './QuizGenerator';
import Leaderboard from './Leaderboard';
import './App.css';

function App() {
  const [user, loading, error] = useAuthState(auth);
  const [currentView, setCurrentView] = useState('quiz');

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="App">
      {user ? (
        <>
          <p>Welcome, {user.email}!</p>
          <nav className='nav-buttons'>
            <button onClick={() => setCurrentView('quiz')}>Quiz</button>
            <button onClick={() => setCurrentView('leaderboard')}>Leaderboard</button>
          </nav>
          {currentView === 'quiz' ? <QuizGenerator /> : <Leaderboard />}
        </>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;