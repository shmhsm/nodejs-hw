import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino-http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 

app.use(pino());

app.get('/notes', (req, res) => {
  res.status(200).json({
    message: 'Retrieved all notes',
  });
});

app.get('/notes/:noteId', (req, res) => {
  const idParam = req.params.noteId;
  res.status(200).json({
    message: `Retrieved note with ID: ${idParam}`,
  });
});

app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

app.use((req, res, next) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});