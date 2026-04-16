import mongoose from "mongoose";
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/taski-data';

const connectDB = async()=>{
   
    await mongoose.connect(MONGO_URL)
    .then((res)=>{
        console.log("Db is connected successfully");
    })
    .catch((error)=>{
        console.log("db connection failed", error);
    })
    
}

export default connectDB;