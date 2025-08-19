import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';


dotenv.config();

const connectDb = async()=>{
  try{
    const uri = process.env.MONGO_URI ;
    await mongoose.connect(uri);
    console.log("connected to database")
  }
  catch(err){
    console.error(" failed to connect to mongoDB " + err);
  }
}

export default connectDb;