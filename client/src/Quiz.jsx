import React, { useEffect, useState, useRef, useCallback } from 'react';

const Quiz = ({
  question,
  questionIndex,
  totalQuestions,
  speakText,
  startRecording,
  stopRecording,
  sendAudioToServer,
  onNextQuestion,
  isLastQuestion,
  isSpeaking,
  isProcessing
}) => {
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const [answeringEnabled, setAnsweringEnabled] = useState(false);
  const [recording, setRecording] = useState(false);
  const hasSpokenRef = useRef(false);
  const questionRef = useRef(null);

  const speakQuestionOnce = useCallback(async () => {
    if (!hasSpokenRef.current && questionRef.current === question) {
      console.log('Speaking question:', questionIndex + 1);
      hasSpokenRef.current = true;
      const questionText = `Question ${questionIndex + 1} of ${totalQuestions}: ${question.question}. Options: ${question.options.join(', ')}`;
      await speakText(questionText);
      console.log('Finished speaking question:', questionIndex + 1);
      setButtonsEnabled(true);
      setAnsweringEnabled(true);
    }
  }, [question, questionIndex, totalQuestions, speakText]);

  useEffect(() => {
    console.log('Question effect triggered');
    setButtonsEnabled(false);
    setAnsweringEnabled(false);
    hasSpokenRef.current = false;
    questionRef.current = question;

    speakQuestionOnce();

    return () => {
      console.log('Cleaning up question effect');
    };
  }, [question, speakQuestionOnce]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && !recording) {
        setRecording(true);
        startRecording();
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space' && recording) {
        setRecording(false);
        stopRecording();
        setButtonsEnabled(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [recording, startRecording, stopRecording]);

  return (
    <div className='quiz-container'>
      <div className='quiz-content'>
        <h2>Question {questionIndex + 1} of {totalQuestions}</h2>
        <p className='question-text'>{question.question}</p>
        <ul className='options-list'>
          {question.options.map((option, index) => (
            <li key={index}>{option}</li>
          ))}
        </ul>
      </div>
      <div className='quiz-buttons'>
        <p>Hold Space to record your answer</p>
        <button 
          disabled={true}
          style={{ backgroundColor: recording ? '#45a049' : '#4CAF50' }}
        >
          {recording ? 'Recording...' : 'Press Space to Record'}
        </button>
        {!isLastQuestion && (
          <p>Press Enter for next question</p>
        )}
        {isLastQuestion && (
          <p>Press Enter to finish quiz</p>
        )}
        <button 
          onClick={onNextQuestion} 
          disabled={isSpeaking || isProcessing || !buttonsEnabled || recording}
          style={{ backgroundColor: (isSpeaking || isProcessing || !buttonsEnabled || recording) ? '#cccccc' : '#4CAF50' }}
        >
          {isProcessing ? 'Processing...' : isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(Quiz);