import React, { useState, useRef, useEffect, useCallback } from 'react';
import OpenAI from "openai";
import Quiz from './Quiz';
import QuizResult from './QuizResult';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';


const QuizGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isAnsweringComplete, setIsAnsweringComplete] = useState(false); // New state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isListeningForPrompt, setIsListeningForPrompt] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const startListeningForPrompt = async () => {
    setIsListeningForPrompt(true);
    await startRecording();
  };

  const stopListeningForPrompt = async () => {
    setIsListeningForPrompt(false);
    await stopRecording(true);  // Pass true to indicate it's for the prompt
  };

  const handlePromptTranscription = (transcription) => {
    console.log('Transcribed prompt:', transcription);
    setPrompt(transcription);
    generateQuiz(transcription);  // Pass the transcription directly
  };

  const generateQuiz = async (quizPrompt) => {
    console.log('Generating quiz for prompt:', quizPrompt);
    setLoading(true);
    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
  
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant that generates quizzes. Respond with a JSON object containing a 'questions' array." },
          { role: "user", content: `Generate a 5-question quiz about "${quizPrompt}". Each question should have a 'question' field, an 'options' array with 4 choices, and a 'correctAnswer' field with the index of the correct option.` }
        ],
        model: "gpt-3.5-turbo",
      });

      const completionText = completion.choices[0].message.content;
      const jsonStartIndex = completionText.indexOf('{');
      const jsonEndIndex = completionText.lastIndexOf('}') + 1;
      const jsonString = completionText.substring(jsonStartIndex, jsonEndIndex);
  
      const quizData = JSON.parse(jsonString);
      setQuiz(quizData.questions);
      localStorage.setItem('quizQuestions', JSON.stringify(quizData.questions));
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizStarted(true);
      console.log('Quiz generated successfully:', quizData.questions);
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Error generating quiz. Please try again.');
    }
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error starting recording. Please check your microphone permissions.');
    }
  };

const stopRecording = (isPrompt = false) => {
  console.log('Stopping recording...');
  if (mediaRecorderRef.current && recording) {
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped, chunks:', audioChunksRef.current.length);
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await sendAudioToServer(audioBlob, isPrompt);
          if (!isPrompt) {
            setIsAnsweringComplete(true);
          }
        } else {
          console.error('No audio data captured');
          alert('No audio data captured. Please try recording again.');
        }
        audioChunksRef.current = [];
        resolve();
      };
      mediaRecorderRef.current.stop();
      setRecording(false);
    });
  }
  return Promise.resolve();
};

 const sendAudioToServer = async (audioBlob, isPrompt = false) => {
    console.log('Sending audio to server...');
    if (!audioBlob) {
      console.error('No audio data captured');
      alert('No audio data captured. Please try recording again.');
      return;
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    setIsProcessing(true);

    try {
      const response = await fetch('https://qwizable.onrender.com/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server response was not ok');
      }

      const data = await response.json();
      if (isPrompt) {
        handlePromptTranscription(data.transcription);
      } else {
        handleAnswer(data.transcription);
      }
    } catch (error) {
      console.error('Error sending audio to server:', error);
      alert('Error transcribing audio. Please try again.');
    }

    setIsProcessing(false);
  };


  const speakText = useCallback(async (text) => {
    console.log('Speaking text:', text);
    try {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      alert('Error in text-to-speech. Please try again.');
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const handleAnswer = (answerText) => {
    console.log('Handling answer:', answerText);
    if (quiz && quiz[currentQuestionIndex]) {
      const currentQuestion = quiz[currentQuestionIndex];
      const answerIndex = currentQuestion.options.findIndex(
        option => option.toLowerCase().includes(answerText.toLowerCase()) ||
          answerText.toLowerCase().includes(option.toLowerCase())
      );
      if (answerIndex !== -1) {
        console.log('Answer found:', currentQuestion.options[answerIndex]);
        setUserAnswers(prevAnswers => {
          const newAnswers = [...prevAnswers];
          newAnswers[currentQuestionIndex] = answerIndex;
          return newAnswers;
        });
      } else {
        console.log('Answer not found in options. Transcribed text:', answerText);
        console.log('Available options:', currentQuestion.options);
      }
    }
  };
  const handleNextQuestion = useCallback(() => {
    if (isAnsweringComplete && quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setIsAnsweringComplete(false);
    } else if (isAnsweringComplete) {
      setQuizStarted(false);
      setShowResults(true);
    }
  }, [quiz, currentQuestionIndex, isAnsweringComplete]);

  // Reset function
  const resetQuiz = useCallback(() => {
    setQuizStarted(false);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizSubmitted(false);
  }, []);

  useEffect(() => {
    console.log('QuizGenerator component mounted');
    const storedQuestions = localStorage.getItem('quizQuestions');
    if (storedQuestions) {
      setQuiz(JSON.parse(storedQuestions));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && !recording) {
        startRecording();
      }
      if (event.key === 'Shift' && !isListeningForPrompt && !quizStarted) {
        startListeningForPrompt();
      }
    };
  
    const handleKeyUp = (event) => {
      if (event.code === 'Space' && recording) {
        stopRecording();
      }
      if (event.key === 'Shift' && isListeningForPrompt && !quizStarted) {
        stopListeningForPrompt();
      }
      if (event.code === 'Enter' && quizStarted && !showResults && isAnsweringComplete) {
        handleNextQuestion();
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [recording, quizStarted, showResults, isAnsweringComplete, handleNextQuestion, isListeningForPrompt]);

  return (
    <div className="quiz-container">
      {!quizStarted && !showResults && (
  <>
    <button  className='quiz-butt'
      disabled={true}
      style={{ backgroundColor: isListeningForPrompt ? '#45a049' : '#4CAF50' }}
    >
      {isListeningForPrompt ? 'Recording...' : 'Press Shift to Record your Topic'}
    </button>
    {prompt && <p>Quiz topic: {prompt}</p>}
  </>
)}
           {quiz && quizStarted && !showResults && (
        <Quiz
          question={quiz[currentQuestionIndex]}
          questionIndex={currentQuestionIndex}
          totalQuestions={quiz.length}
          speakText={speakText}
          startRecording={startRecording}
          stopRecording={stopRecording}
          sendAudioToServer={sendAudioToServer}
          onNextQuestion={handleNextQuestion}
          isLastQuestion={currentQuestionIndex === quiz.length - 1}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
        />
      )}
      {showResults && (
        <QuizResult
          questions={quiz}
          userAnswers={userAnswers}
          speakText={speakText}
          onRestart={resetQuiz}
        />
      )}
    </div>
  );
};

export default QuizGenerator;