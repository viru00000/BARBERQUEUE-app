import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDb from './config/connectdb.js';
import appointment from './routes/appointmentRoute.js';
import auth from './routes/userRoutes.js';
import salon from './routes/salonRoutes.js';
import './jobs/queueNotifier.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());
app.use(cors());

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/appointment', appointment);
app.use('/api/user', auth);
app.use('/api/salon', salon);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join salon room for real-time updates
  socket.on('joinSalon', (salonId) => {
    socket.join(`salon-${salonId}`);
    console.log(`User ${socket.id} joined salon room: salon-${salonId}`);
  });

  // Leave salon room
  socket.on('leaveSalon', (salonId) => {
    socket.leave(`salon-${salonId}`);
    console.log(`User ${socket.id} left salon room: salon-${salonId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

connectDb();
app.get('/', (req, res) => {
  res.send('Backend is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
