import mongoose from "mongoose";

declare global {
  var nelnaMongoose:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured. Add it to .env before starting the app.");
}

const cached = global.nelnaMongoose ?? { conn: null, promise: null };

if (!global.nelnaMongoose) {
  global.nelnaMongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(databaseUrl, {
      dbName: process.env.DATABASE_NAME || "bileeta_db",
      autoIndex: process.env.NODE_ENV !== "production",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
