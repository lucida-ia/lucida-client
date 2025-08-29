import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Enhanced caching with connection state tracking
let cached = global.mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnecting: boolean;
};

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, isConnecting: false };
}

// Optimized connection options for Vercel serverless
const connectionOptions = {
  bufferCommands: false,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
};

export async function connectToDB() {
  if (!MONGODB_URI) {
    throw new Error("MongoDB URI not defined");
  }

  // Return existing connection if available
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Prevent multiple simultaneous connection attempts
  if (cached.isConnecting && cached.promise) {
    return await cached.promise;
  }

  // Check if connection exists but is in a bad state
  if (mongoose.connection.readyState === 99) {
    // Disconnected
    mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.isConnecting = true;

    cached.promise = mongoose
      .connect(MONGODB_URI, connectionOptions)
      .then((mongoose) => {
        cached.isConnecting = false;
        return mongoose;
      })
      .catch((error) => {
        cached.isConnecting = false;
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    cached.isConnecting = false;
    throw error;
  }
}

// Helper function to check connection health
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// Graceful disconnection for cleanup
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    cached.isConnecting = false;
  }
}
