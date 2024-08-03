import React, { useEffect } from 'react';

const QuizResult = ({ questions, userAnswers, speakText }) => {
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
  }, []);
  return (
    <div>
      <h2>Quiz Results</h2>
      <p>You scored {score} out of {questions.length}</p>
      {questions.map((question, index) => (
        <div key={index}>
          <p>{question.question}</p>
          <p>Your answer: {question.options[userAnswers[index]]}</p>
          <p>Correct answer: {question.options[question.correctAnswer]}</p>
        </div>
      ))}
    </div>
  );
};

export default QuizResult;
