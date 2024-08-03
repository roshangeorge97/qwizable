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
  isProcessing,
}) => {
  const [buttonsEnabled, setButtonsEnabled] = useState(false);
  const [answeringEnabled, setAnsweringEnabled] = useState(false);
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

  const handleSayAnswer = () => {
    console.log('Say Answer clicked');
    if (buttonsEnabled && !isSpeaking && !isProcessing) {
      startRecording();
    }
  };

  const handleFinishedAnswering = async () => {
    console.log('Finished Answering clicked');
    if (answeringEnabled && !isSpeaking && !isProcessing) {
      setAnsweringEnabled(false);
      try {
        await stopRecording();
        await sendAudioToServer();
      } catch (error) {
        console.error('Error processing answer:', error);
      }
      setButtonsEnabled(false);
    }
  };

  return (
    <div>
      <h2>Question {questionIndex + 1} of {totalQuestions}</h2>
      <p>{question.question}</p>
      <ul>
        {question.options.map((option, index) => (
          <li key={index}>{option}</li>
        ))}
      </ul>
      <button onClick={handleSayAnswer} disabled={!buttonsEnabled || isSpeaking || isProcessing}>
        Say Answer
      </button>
      <button onClick={handleFinishedAnswering} disabled={!answeringEnabled || isSpeaking || isProcessing}>
        Finished Answering
      </button>
      {!isLastQuestion && (
        <button onClick={onNextQuestion} disabled={isSpeaking || isProcessing || answeringEnabled}>
          {isProcessing ? 'Processing...' : 'Next Question'}
        </button>
      )}
      {isLastQuestion && (
        <button onClick={onNextQuestion} disabled={isSpeaking || isProcessing || answeringEnabled}>
          {isProcessing ? 'Processing...' : 'Finish Quiz'}
        </button>
      )}
    </div>
  );
};

export default React.memo(Quiz);