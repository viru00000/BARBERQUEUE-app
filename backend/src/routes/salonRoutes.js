import express, { Router } from 'express'
import { createSalon, getNearbySalons } from '../controller/salonController.js';

const router = express.Router();

router.get('/get' , getNearbySalons);

router.post('/register' , createSalon);


export default router;