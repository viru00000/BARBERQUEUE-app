
import express from 'express';

import User from "./models/userSchema"

export const createUser = async(req ,res)=>{
  try{
    const {name , email , number , password} = req.body;
    const user = await User.create({name , email , number , password});
    res.status(201).json(user);
  }
  catch (error){
   res.status(404).json({message : error.message});
  }
}

export const getUser = async(req,res)=>{
  try{
    const getUserList = await User.find();
    res.status(200).json(getUserList)
  }
  catch (error){
        res.status(500).json({message  : error.message});
  }
}


