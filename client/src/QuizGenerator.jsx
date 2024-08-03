import React, { useState, useRef } from 'react';
import OpenAI from "openai";
import Quiz from './Quiz';

const QuizGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const generateQuiz = async () => {
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

      const quizData = JSON.parse(completion.choices[0].message.content);
      setQuiz(quizData.questions);
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Error generating quiz. Please try again.');
    }
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = sendAudioToServer;

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudioToServer = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');

    try {
      const response = await fetch('http://localhost:3001/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server response was not ok');
      }

      const data = await response.json();
      setPrompt(data.transcription);
    } catch (error) {
      console.error('Error sending audio to server:', error);
      alert('Error transcribing audio. Please try again.');
    }
  };

  return (
    <div>
      <h1>Quiz Generator</h1>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter quiz topic"
      />
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <button onClick={generateQuiz} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Quiz'}
      </button>
      {quiz && <Quiz questions={quiz} />}
    </div>
  );
};

export default QuizGenerator;