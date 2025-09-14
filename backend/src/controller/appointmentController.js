import express from 'express';
import Appointment from '../models/appointmentSchema.js';


export const createAppointment = async(req,res)=>{
  try{
    const {customer , salon ,  service , startTime , endTime , status , queuePosition} = req.body;
    const newAppointment = await Appointment.create({customer ,  salon , service , startTime , endTime , status , queuePosition});
    res.status(201).json(newAppointment)
  }
  catch (error){
    res.status(500).json({message : error.message})
  }
}


export const getAppointments = async(req,res)=>{
  try{
    const appointments = await Appointment.find().populate('customer').populate('service');
    res.status(200).json(appointments)
  }
  catch (error){
      res.status(500).json({message : "error fetching problem"  , error});
  }
}

export const getAppointmentById = async(req , res)=>{
  try{
     const {id} = req.params;
     const custAppointment = await Appointment.findById(id).populate("customer").populate("service").populate("barber");

     if(!custAppointment){
     return res.status(404).json({message : "Appoinment not found"})
     }
     res.status(200).json(custAppointment);
  }
  catch (error){
    res.status(500).json({message : error.message})
  }
}


export const deleteAppointment = async(req,res)=>{
  try{
    const {id} = req.params;
    const delAppointment = await Appointment.findByIdAndDelete(id);
    res.status(200).json(delAppointment);
  }
  catch(error){
    res.status(500).json({message : error.message});

  }
}

export const updateAppointment = async(req , res)=>{
  try{
    const {id} = req.params;
    const updateAppo = await Appointment.findByIdAndUpdate(id , req.body , {new:true});

    if(!updateAppo){
      res.status(404).json({message  : "apointment not found"})
    }
    res.status(200).json(updateAppo);
  }
  catch(error){
    res.status(500).json({message : error.message})
  }
}

