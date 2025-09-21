import express, { Router } from 'express';
import {
  registerSalon,
  getNearbySalons,
  joinQueue,
  leaveQueue,
  getCustomerQueueStatus,
  updateSalonQueue,
  getSalonByOwner,
  updateSalonInfo,
} from '../controller/salonController.js';

const router = express.Router();

router.get('/get', getNearbySalons);
router.get('/by-owner/:ownerId', getSalonByOwner);

router.post('/register', registerSalon);

router.post('/join-queue', joinQueue);

router.post('/leave-queue', leaveQueue);

router.get('/customer-queue-status/:customerId', getCustomerQueueStatus);

router.put('/:salonId/queue', updateSalonQueue);
router.put('/:salonId', updateSalonInfo);

export default router;
