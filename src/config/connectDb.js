import mongoose from "mongoose";
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taski-data';

const connectDB = async()=>{
   
    await mongoose.connect(MONGO_URI)
    .then((res)=>{
        console.log("Db is connected successfully");
    })
    .catch((error)=>{
        console.log("db connection failed", error);
    })
    
}

export default connectDB;