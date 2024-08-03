import React, { useState } from 'react';
import OpenAI from "openai";
import Quiz from './Quiz';

const QuizGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
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

  return (
    <div>
      <h1>Quiz Generator</h1>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter quiz topic"
      />
      <button onClick={generateQuiz} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Quiz'}
      </button>
      {quiz && <Quiz questions={quiz} />}
    </div>
  );
};

export default QuizGenerator;