import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDb from './config/connectdb.js';
import appointment from './routes/appointmentRoute.js';
import auth from './routes/userRoutes.js';
import salon from './routes/salonRoutes.js';


dotenv.config();


const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/appointment' , appointment);
app.use('/api/user'  ,  auth );
app.use('/api/salon' , salon )

connectDb();
app.get('/' , (req , res)=>{
  res.send("Backend is running")
})

const PORT = process.env.PORT || 5000;
app.listen(PORT , ()=>{
  console.log(` listing on port ${PORT} `)
})

