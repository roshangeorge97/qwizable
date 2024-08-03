const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
console.log('ffmpeg path:', ffmpegInstaller.path);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get('/', (req, res) => {
  res.send('Welcome to the Speech-to-Text API!');
});

const MAX_RETRIES = 5;
const DELAY_IN_MS = 60000; 

async function createSpeech(params) {
  let retryCount = 0;
  let speechError = null;

  while (retryCount < MAX_RETRIES) {
    try {
      const speech = await openai.audio.speech.create(params);
      return { buffer: Buffer.from(await speech.arrayBuffer()), success: true };
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`Rate limit exceeded. Retrying in ${DELAY_IN_MS / 1000} seconds... (${MAX_RETRIES - retryCount - 1} retries left)`);
      } else {
        console.error('Error in text-to-speech:', error.message);
      }
      speechError = error.message;
      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, DELAY_IN_MS));
    }
  }

  console.log('speech_error:', speechError);
  return { error: speechError, success: false };
}

app.post('/api/speak', async (req, res) => {
  console.log('Received text-to-speech request');
  const { text } = req.body;
  const { buffer, error, success } = await createSpeech({ model: "tts-1", voice: "alloy", input: text });

  if (success) {
    console.log('Text-to-speech successful');
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);
  } else {
    console.error('Text-to-speech failed:', error);
    res.status(500).json({ error });
  }
});


app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  console.log('Received transcription request');
  if (!req.file) {
    console.error('No audio file provided');
    return res.status(400).json({ error: 'No audio file provided' });
  }
  console.log('File received:', req.file);

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `${req.file.filename}.mp3`);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
      .inputFormat('webm')
      .toFormat('mp3')
      .on('error', (err) => {
        console.error('ffmpeg error:', err);
        reject(err);
      })
      .on('end', () => resolve())
      .save(outputPath);
    });

    const audioBytes = fs.readFileSync(outputPath);
    const audioBase64 = audioBytes.toString('base64');

    const prompt = "Generate a transcript of the speech.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/mp3",
          data: audioBase64
        }
      }
    ]);
    const response = await result.response;
    const transcription = response.text();

    console.log('Transcription successful:', transcription);
    
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    console.log('Raw transcription result:', response);
    console.log('Transcription successful:', transcription);
    return res.json({ transcription: transcription });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Error transcribing audio', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});