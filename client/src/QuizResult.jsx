import React, { useEffect } from 'react';

const QuizResult = ({ questions, userAnswers, speakText, onRestart }) => {
  const score = userAnswers.reduce((total, answer, index) => {
    return total + (answer === questions[index].correctAnswer ? 1 : 0);
  }, 0);

  useEffect(() => {
    console.log('QuizResult component mounted');
    const readResult = async () => {
      console.log('Speaking quiz result...');
      await speakText(`You have scored ${score} out of ${questions.length}`);
      console.log('Finished speaking quiz result');
    };
    readResult();
  }, [score, questions.length, speakText]);

  return (
    <div>
      <h2>Quiz Results</h2>
      <p>You scored {score} out of {questions.length}</p>
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