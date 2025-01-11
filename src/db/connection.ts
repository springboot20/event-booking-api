import mongoose from "mongoose";

console.log(process.env.NODE_ENV);

const connection =
  process.env.NODE_ENV === "development"
    ? process.env.MONGODB_URI_LOCAL!
    : process.env.MONGODB_URI!;

const connectToDatabase = async () => {
  try {
    const connectDB = await mongoose.connect(
      connection,
      process.env.NODE_ENV === "development"
        ? { dbName: process.env.DBNAME }
        : {
            dbName: process.env.DBNAME,
            user: process.env.USER,
            pass: process.env.PASS,
          }
    );

    console.log(`MongoDB connected successfully: ${connectDB.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export { connectToDatabase };
