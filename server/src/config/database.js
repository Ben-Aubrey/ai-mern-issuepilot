import mongoose from 'mongoose';

/** Connect to MongoDB when explicitly called by the application entry point. */
export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is required to connect to MongoDB.');
  await mongoose.connect(uri);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
