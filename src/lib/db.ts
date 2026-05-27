import mongoose from "mongoose";

declare global {
  var nelnaMongoose:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.nelnaMongoose ?? { conn: null, promise: null };

if (!global.nelnaMongoose) {
  global.nelnaMongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  const databaseUrl = process.env.MAIN_DATABASE_URL || process.env.MONGODB_URI || process.env.DATABASE_URL || "";

  if (!databaseUrl) {
    throw new Error("MAIN_DATABASE_URL, MONGODB_URI, or DATABASE_URL is required.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(databaseUrl, {
      dbName: "nelna",
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 10000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
