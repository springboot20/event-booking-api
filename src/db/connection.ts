import mongoose from "mongoose";

console.log(process.env.NODE_ENV);

const connection =
  process.env.NODE_ENV === "production" ? process.env.MONGODB_URI! : process.env.MONGODB_URI_LOCAL!;

const connectionData =
  process.env.NODE_ENV === "production"
    ? {
        dbName: process.env.DBNAME,
        user: process.env.USER,
        pass: process.env.PASS,
      }
    : { dbName: process.env.DBNAME };

const connectToDatabase = async () => {
  try {
    const connectDB = await mongoose.connect(connection, connectionData);

    console.log(`MongoDB connected successfully: ${connectDB.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export { connectToDatabase };
