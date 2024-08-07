import React, { useEffect, useState } from 'react';
import { doc, setDoc, increment, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';

const QuizResult = ({ questions, userAnswers, speakText, onRestart }) => {
  const [leaderboardPosition, setLeaderboardPosition] = useState(null);
  const [pointsToNextPosition, setPointsToNextPosition] = useState(null);

  const score = userAnswers.reduce((total, answer, index) => {
    return total + (answer === questions[index].correctAnswer ? 1 : 0);
  }, 0);

  useEffect(() => {
    const saveScoreAndUpdateLeaderboard = async () => {
      const user = auth.currentUser;
      if (user) {
        // Save the score
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          totalPoints: increment(score)
        }, { merge: true });
    
        // Fetch updated leaderboard
        const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'));
        const querySnapshot = await getDocs(q);
        const leaderboard = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    
        // Find user's position and points to next position
        const userPosition = leaderboard.findIndex(entry => entry.id === user.uid);
        setLeaderboardPosition(userPosition + 1);
    
        let pointsNeeded = 0;
        let positionMessage = '';
    
        if (userPosition > 0) {
          pointsNeeded = leaderboard[userPosition - 1].totalPoints - leaderboard[userPosition].totalPoints;
          setPointsToNextPosition(pointsNeeded);
          positionMessage = `You need ${pointsNeeded} more points to claim the ${userPosition}th position.`;
        } else {
          positionMessage = 'Congratulations! You are at the top of the leaderboard!';
        }
    
        // Speak the result
        const resultText = `You have scored ${score} out of ${questions.length}. 
        You are at position ${userPosition + 1} on the leaderboard.
        ${positionMessage}
        Press enter to restart the quiz.`;
        await speakText(resultText);
      }
    };

    saveScoreAndUpdateLeaderboard();

        // Add event listener for Enter key
        const handleKeyPress = (event) => {
          if (event.key === 'Enter') {
            onRestart();
          }
        };
    
        window.addEventListener('keypress', handleKeyPress);
    
        // Clean up event listener
        return () => {
          window.removeEventListener('keypress', handleKeyPress);
        };
      }, [score, questions.length, speakText, onRestart]);

      return (
        <div className="result-container">
          <div className="result-summary">
            <h2>Quiz Results</h2>
            <p className="score">Score: {score} / {questions.length}</p>
            {leaderboardPosition && (
              <p className="leaderboard-position">Leaderboard Position: {leaderboardPosition}</p>
            )}
            <button onClick={onRestart} className="restart-button">Restart Quiz</button>
          </div>
          <div className="questions-review">
            {questions.map((question, index) => (
              <div key={index} className="question-review">
                <p className="question-text"><strong>Q{index + 1}:</strong> {question.question.substring(0, 30)}...</p>
                <p className="user-answer">
                  Your: {
                    userAnswers[index] !== undefined && userAnswers[index] !== null
                      ? question.options[userAnswers[index]].substring(0, 20)
                      : 'No answer'
                  }...
                </p>
                <p className="correct-answer">
                  Correct: {question.options[question.correctAnswer].substring(0, 20)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    };
    
    export default QuizResult;