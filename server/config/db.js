import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Warning: ${error.message}`);
    console.log('Server will continue running. Ensure MongoDB is running and MONGO_URI in .env is correct.');
  }
};

export default connectDB;
