import React, { useEffect, useState, useRef } from 'react';

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

  useEffect(() => {
    console.log('Question effect triggered');
    setButtonsEnabled(false);
    setAnsweringEnabled(false);
    hasSpokenRef.current = false;
    questionRef.current = question;

    const speakQuestionOnce = async () => {
      if (!hasSpokenRef.current && questionRef.current === question) {
        console.log('Speaking question:', questionIndex + 1);
        hasSpokenRef.current = true;
        const questionText = `Question ${questionIndex + 1} of ${totalQuestions}: ${question.question}. Options: ${question.options.join(', ')}`;
        await speakText(questionText);
        console.log('Finished speaking question:', questionIndex + 1);
        setButtonsEnabled(true);
        setAnsweringEnabled(true);
      }
    };

    speakQuestionOnce();

    return () => {
      console.log('Cleaning up question effect');
    };
  }, [question, questionIndex, totalQuestions, speakText]);

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
      await stopRecording();
      await sendAudioToServer();
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
      <button onClick={onNextQuestion} disabled={isSpeaking || isProcessing || answeringEnabled}>
        {isProcessing ? 'Processing...' : isLastQuestion ? 'Finish Quiz' : 'Next Question'}
      </button>
    </div>
  );
};

export default Quiz;