import mongoose from 'mongoose';

const connectToDatabase = async () => {
  try {
    const connectDB = await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: process.env.DBNAME,
      user: process.env.USER,
      pass: process.env.PASS,
    });

    console.log(`MongoDB connected successfully: ${connectDB.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export { connectToDatabase };
