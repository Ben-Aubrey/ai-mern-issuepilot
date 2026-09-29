import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import healthRouter from './routes/health.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', notFoundHandler);
  app.use(errorHandler);
  return app;
}
