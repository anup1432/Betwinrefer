
import mongoose from 'mongoose';

const MONGODB_URL = process.env.DATABASE_URL || 'mongodb+srv://Cluster0:anup1432@cluster0.soq3ofn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Connect to MongoDB
mongoose.connect(MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

export const db = mongoose.connection;
export { mongoose };
