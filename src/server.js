import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser'; 
import pino from 'pino-http';
import cors from 'cors';
import { errors } from 'celebrate';

import notesRouter from './routes/notesRoutes.js';
import authRouter from './routes/authRoutes.js'; 
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { initMongoConnection } from './db/initMongoConnection.js'; 

export const startServer = () => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser()); 
  app.use(cors());
  app.use(pino());

  app.use('/auth', authRouter);
  app.use('/notes', notesRouter);

  app.use(notFoundHandler);
  app.use(errors());
  app.use(errorHandler);

  const PORT = process.env.PORT || 3030;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

initMongoConnection()
  .then(() => {
    startServer();
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });