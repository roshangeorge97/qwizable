import React, { useState, useRef, useEffect, useCallback } from 'react';
import OpenAI from "openai";
import Quiz from './Quiz';
import QuizResult from './QuizResult';

const QuizGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const generateQuiz = async () => {
    console.log('Generating quiz...');
    setLoading(true);
    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant that generates quizzes. Respond with a JSON object containing a 'questions' array." },
          { role: "user", content: `Generate a 5-question quiz about ${prompt}. Each question should have a 'question' field, an 'options' array with 4 choices, and a 'correctAnswer' field with the index of the correct option.` }
        ],
        model: "gpt-3.5-turbo",
      });

      // Extract the JSON from the completion response
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
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToServer(audioBlob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      return new Promise((resolve) => {
        mediaRecorderRef.current.onstop = () => {
          console.log('Recording stopped, chunks:', audioChunksRef.current.length);
          resolve();
        };
      });
    }
  };
  const sendAudioToServer = async () => {
    console.log('Sending audio to server...');
    if (audioChunksRef.current.length === 0) {
      console.error('No audio data captured');
      alert('No audio data captured. Please try recording again.');
      return;
    }
  
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
  
    setIsProcessing(true);
  
    try {
      const response = await fetch('http://localhost:3001/api/transcribe', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Server response was not ok');
      }
  
      const data = await response.json();
      handleAnswer(data.transcription);
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
        option => option.toLowerCase().includes(answerText.toLowerCase())
      );
      if (answerIndex !== -1) {
        setUserAnswers(prevAnswers => {
          const newAnswers = [...prevAnswers];
          newAnswers[currentQuestionIndex] = answerIndex;
          return newAnswers;
        });
      } else {
        console.log('Answer not found in options');
      }
    }
  };
  
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleNextQuestion = useCallback(() => {
    console.log('Moving to next question');
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else if (!quizSubmitted) {
      setQuizSubmitted(true);
      setShowResults(true);
    }
  }, [quiz, currentQuestionIndex, quizSubmitted]);

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

  return (
    <div>
      <h1>Quiz Generator</h1>
      {!quizStarted && !showResults && (
        <>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter quiz topic"
          />
          <button onClick={generateQuiz} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </>
      )}
      {quiz && quizStarted && currentQuestionIndex < quiz.length && (
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
