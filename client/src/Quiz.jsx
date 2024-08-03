import React, { useState } from 'react';
import QuizResult from './QuizResult';

const Quiz = ({ questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answerIndex) => {
    setUserAnswers([...userAnswers, answerIndex]);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    return <QuizResult questions={questions} userAnswers={userAnswers} />;
  }

  const question = questions[currentQuestion];

  return (
    <div>
      <h2>Question {currentQuestion + 1}</h2>
      <p>{question.question}</p>
      {question.options.map((option, index) => (
        <button key={index} onClick={() => handleAnswer(index)}>
          {option}
        </button>
      ))}
    </div>
  );
};

export default Quiz;