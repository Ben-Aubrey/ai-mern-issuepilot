import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

const app = createApp();
let server;

async function start() {
  if (env.mongodbUri) {
    await connectDatabase(env.mongodbUri);
    console.log('Connected to MongoDB.');
  } else {
    console.warn('MONGODB_URI is not set; starting without a database connection.');
  }

  server = app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  if (server) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  console.error('Failed to start the API.', error);
  process.exit(1);
});
