import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

export const env = Object.freeze({
  port,
  mongodbUri: process.env.MONGODB_URI ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
});
