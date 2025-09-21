import Salon from '../models/salonSchema.js';
import { geocodeAddress, geocodeAddressGoogle } from '../utils/geocoding.js';

// Join Queue Controller
export const joinQueue = async (req, res) => {
  try {
    const { salonId, customerName, customerEmail, service, customerId } =
      req.body;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Check if customer is already in this salon's queue
    const existingCustomer = salon.queue.find(
      (customer) =>
        customer.customerId === customerId ||
        customer.customerEmail === customerEmail
    );

    if (existingCustomer) {
      return res.status(400).json({
        message: 'You are already in the queue for this salon!',
        position: salon.queue.findIndex(
          (c) =>
            c.customerId === customerId || c.customerEmail === customerEmail
        ),
      });
    }

    // Check if customer is in any other salon's queue
    const otherSalons = await Salon.find({
      _id: { $ne: salonId },
      'queue.customerId': customerId,
    });

    if (otherSalons.length > 0) {
      return res.status(400).json({
        message:
          'You are already in a queue at another salon. Please wait or leave that queue first.',
        currentSalon: otherSalons[0].name,
      });
    }

    // find service duration from salon services
    const serviceMeta = salon.services.find((s) => s.name === service);
    const serviceDuration = serviceMeta?.duration || 15; // default 15 min if not found

    salon.queue.push({
      customerName,
      customerEmail,
      service,
      customerId,
      joinedAt: new Date(),
    });
    const position = salon.queue.length - 1;

    // ETA: assume each person ahead consumes their service duration; use avg of salon services if unknown
    const averageDuration = salon.services.length
      ? Math.round(
          salon.services.reduce((sum, s) => sum + (s.duration || 15), 0) /
            salon.services.length
        )
      : 15;

    const perCustomerDuration = serviceDuration || averageDuration;
    const etaMinutes = position * perCustomerDuration;

    await salon.save();

    // Emit real-time update to salon owner
    if (req.io) {
      req.io.to(`salon-${salonId}`).emit('queueUpdated', {
        salonId,
        queue: salon.queue,
        newCustomer: { customerName, customerEmail, service, position },
      });
    }

    res.status(200).json({
      message: 'You have joined the queue!',
      queueLength: salon.queue.length,
      position,
      etaMinutes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leave Queue Controller
export const leaveQueue = async (req, res) => {
  try {
    const { salonId, customerId } = req.body;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    const initialQueueLength = salon.queue.length;
    salon.queue = salon.queue.filter(
      (customer) => customer.customerId !== customerId
    );

    if (salon.queue.length === initialQueueLength) {
      return res
        .status(404)
        .json({ message: "You are not in this salon's queue" });
    }

    await salon.save();

    // Emit real-time update to salon owner
    if (req.io) {
      req.io.to(`salon-${salonId}`).emit('queueUpdated', {
        salonId,
        queue: salon.queue,
        customerLeft: customerId,
      });
    }

    res.status(200).json({
      message: 'You have left the queue',
      queueLength: salon.queue.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer's current queue status
export const getCustomerQueueStatus = async (req, res) => {
  try {
    const { customerId } = req.params;

    const salon = await Salon.findOne({ 'queue.customerId': customerId });

    if (!salon) {
      return res.status(200).json({
        inQueue: false,
        message: 'Not in any queue',
      });
    }

    const customerPosition = salon.queue.findIndex(
      (c) => c.customerId === customerId
    );
    const customer = salon.queue[customerPosition];

    res.status(200).json({
      inQueue: true,
      salon: {
        id: salon._id,
        name: salon.name,
        address: salon.address,
        contact: salon.contact,
      },
      position: customerPosition,
      service: customer.service,
      joinedAt: customer.joinedAt,
      queueLength: salon.queue.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update salon queue (for barber to serve next customer or clear queue)
export const updateSalonQueue = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { queue } = req.body;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    salon.queue = queue;
    await salon.save();

    // Emit real-time update
    if (req.io) {
      req.io.to(`salon-${salonId}`).emit('queueUpdated', {
        salonId,
        queue: salon.queue,
      });
    }

    res.status(200).json({
      message: 'Queue updated successfully',
      queue: salon.queue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerSalon = async (req, res) => {
  try {
    const { owner, ownerId, name, address, contact, services, lat, lng } =
      req.body;

    if (!address && (lat === undefined || lng === undefined)) {
      return res
        .status(400)
        .json({ message: 'Address or coordinates are required' });
    }

    const existingSalon = await Salon.findOne({ contact });
    if (existingSalon) {
      return res.status(400).json({ message: 'Salon already registered' });
    }

    let latitude;
    let longitude;

    // If coordinates are provided, trust them and skip geocoding
    if (
      lat !== undefined &&
      lng !== undefined &&
      !Number.isNaN(parseFloat(lat)) &&
      !Number.isNaN(parseFloat(lng))
    ) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lng);
    } else {
      // Geocode the address to get coordinates
      let geocodedLocation;
      try {
        geocodedLocation = await geocodeAddress(address);
      } catch (geoError) {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          try {
            geocodedLocation = await geocodeAddressGoogle(address, apiKey);
          } catch (googleErr) {
            return res
              .status(400)
              .json({ message: 'Could not locate address. Please refine it.' });
          }
        } else {
          return res
            .status(400)
            .json({ message: 'Could not locate address. Please refine it.' });
        }
      }

      if (
        !geocodedLocation ||
        typeof geocodedLocation.lat !== 'number' ||
        typeof geocodedLocation.lng !== 'number'
      ) {
        return res
          .status(400)
          .json({ message: 'Invalid geocoding result for address' });
      }

      latitude = geocodedLocation.lat;
      longitude = geocodedLocation.lng;
    }

    const salon = new Salon({
      owner,
      ownerId,
      name,
      address,
      contact,
      services,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    });

    await salon.save();
    res.status(201).json({
      message: 'Salon registered successfully',
      salon: {
        ...salon.toObject(),
        formattedAddress: address || undefined,
      },
    });
  } catch (error) {
    console.error('Salon registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Nearby Salons
export const getNearbySalons = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    const salons = await Salon.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            radius / 6371000, // Convert meters → radians
          ],
        },
      },
    });

    res.status(200).json(salons);
  } catch (error) {
    console.error('Nearby Salon Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get salon by ownerId
export const getSalonByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const salon = await Salon.findOne({ ownerId });
    if (!salon) {
      return res
        .status(404)
        .json({ message: 'Salon not found for this owner' });
    }
    res.status(200).json(salon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update salon info (e.g., services, contact, name, address)
export const updateSalonInfo = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { name, address, contact, services } = req.body;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    if (name !== undefined) salon.name = name;
    if (address !== undefined) salon.address = address;
    if (contact !== undefined) salon.contact = contact;
    if (Array.isArray(services)) salon.services = services;

    await salon.save();

    // Notify listeners to refresh salon data
    if (req.io) {
      req.io.to(`salon-${salon._id}`).emit('salonUpdated', {
        salonId: salon._id.toString(),
        salon: salon.toObject(),
      });
    }

    res.status(200).json({ message: 'Salon updated', salon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
