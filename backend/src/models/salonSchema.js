import mongoose from 'mongoose';

const salonSchema = new mongoose.Schema({
  owner: String,
  ownerId: String, // user _id of the salon owner
  name: String,
  address: String,
  contact: String,
  services: [
    {
      name: String,
      price: Number,
      duration: Number, // in minutes
    },
  ],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  queue: [
    {
      customerName: String,
      customerEmail: String,
      service: String,
      customerId: String, // User ID from login
      joinedAt: { type: Date, default: Date.now },
      notified: { type: Boolean, default: false },
    },
  ],
});

salonSchema.index({ location: '2dsphere' });

export default mongoose.model('Salon', salonSchema);
