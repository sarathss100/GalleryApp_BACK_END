import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_CONNECTION_STRING}`, {
            dbName: process.env.DB_NAME,
        });
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.log(`Error in connecting to MongoDB: ${error}`);
        process.exit(1);
    }
}

export default connectDB;