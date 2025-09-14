import mongoose from "mongoose";

const salonSchema = new mongoose.Schema({
  owner: { type: String, required: true },
  name: { type: String, required: true },
  services: [String],
  address: String,
  contact: { type: String, unique: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
});

// create geospatial index
salonSchema.index({ location: "2dsphere" });

const Salon = mongoose.model("Salon", salonSchema);
export default Salon;
