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
                            ${positionMessage}`;
        await speakText(resultText);
      }
    };

    saveScoreAndUpdateLeaderboard();
  }, [score, questions.length, speakText]);

  return (
    <div>
      <h2>Quiz Results</h2>
      <p>You scored {score} out of {questions.length}</p>
      {leaderboardPosition && (
        <p>You are at position {leaderboardPosition} on the leaderboard.</p>
      )}
      {pointsToNextPosition !== null && (
        <p>You need {pointsToNextPosition} more points to claim the {leaderboardPosition - 1}th position.</p>
      )}
      {questions.map((question, index) => (
        <div key={index}>
          <p><strong>Question:</strong> {question.question}</p>
          <p><strong>Your answer:</strong> {
            userAnswers[index] !== undefined && userAnswers[index] !== null
              ? question.options[userAnswers[index]]
              : 'No answer provided'
          }</p>
          <p><strong>Correct answer:</strong> {question.options[question.correctAnswer]}</p>
        </div>
      ))}
      <button onClick={onRestart}>Restart Quiz</button>
    </div>
  );
};

export default QuizResult;