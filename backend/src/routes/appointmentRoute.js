import express from 'express';
import {createAppointment, getAppointments, getAppointmentById} from '../controller/appointmentController.js';
import { validationAppointment } from '../middlewares/appointmentMiddleware.js';

const routes = express.Router();

routes.post('/' , validationAppointment , createAppointment);

routes.get('/' , getAppointments);

routes.get('/:id' , getAppointmentById);




export default routes;