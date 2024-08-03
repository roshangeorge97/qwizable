import React from 'react';

const QuizResult = ({ questions, userAnswers }) => {
  const score = userAnswers.reduce((total, answer, index) => {
    return total + (answer === questions[index].correctAnswer ? 1 : 0);
  }, 0);

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