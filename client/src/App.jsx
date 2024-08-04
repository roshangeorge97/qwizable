import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Auth from './Auth';
import QuizGenerator from './QuizGenerator';

function App() {
  const [user, loading, error] = useAuthState(auth);

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
          <QuizGenerator />
        </>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;