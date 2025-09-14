import Salon from "../models/salonSchema.js";



export const createSalon = async (req, res) => {
  try {
    const { owner, name, services, address, contact, lat, lng } = req.body;

    if (await Salon.findOne({ contact })) {
      return res.status(401).json({ message: "Salon is already registered" });
    }

    const regSalon = await Salon.create({
      owner,
      name,
      services,
      address,
      contact,
      location: {
        type: "Point",
        coordinates: [lng, lat], // [longitude, latitude]
      },
    });

    res.status(201).json(regSalon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// backend/controller/salonController.js

export const getNearbySalons = async (req, res) => {
  try {
    console.log("Incoming Query Params:", req.query); // ✅ debug log

    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const salons = await Salon.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            radius / 6371000,
          ],
        },
      },
    });

    res.status(200).json(salons);
  } catch (error) {
    console.error("Nearby Salon Error:", error);
    res.status(500).json({ message: error.message });
  }
};
