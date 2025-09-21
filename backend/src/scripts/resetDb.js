import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDb from '../config/connectdb.js';
import User from '../models/userSchema.js';
import Salon from '../models/salonSchema.js';
import Appointment from '../models/appointmentSchema.js';

dotenv.config();

const reset = async () => {
  try {
    await connectDb();

    const [userResult, salonResult, apptResult] = await Promise.all([
      User.deleteMany({}),
      Salon.deleteMany({}),
      Appointment.deleteMany({}),
    ]);

    console.log(`Deleted users: ${userResult.deletedCount}`);
    console.log(`Deleted salons: ${salonResult.deletedCount}`);
    console.log(`Deleted appointments: ${apptResult.deletedCount}`);
  } catch (err) {
    console.error('Reset DB failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

reset();
