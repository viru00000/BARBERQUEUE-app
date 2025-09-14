
import express from 'express';
import bcrypt from 'bcryptjs'
import User from '../models/userSchema.js'

export const createUser = async(req ,res)=>{
  try{
    const {name , email , number , password} = req.body;

    if( await User.findOne({email})){
     return res.status(400).json({message : "user already exist"})
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password , salt)

    const user = await User.create({name , email , number , password :hashedPassword});
    res.status(201).json(user);
  }
  catch (error){
   res.status(404).json({message : error.message});
  }
}

export const loginUser = async(req,res)=>{
  try{
    const {number , password} = req.body;
   const userExist = await User.findOne({number});
   if(userExist){
    if(await bcrypt.compare(password , userExist.password)){
      res.status(200).json(userExist);
    }else{
      res.status(401).json({message : "password and username dont match"})
    }
   }else{
    res.status(404).json({message : "user not registered"})
   }


  }
  catch (error){
        res.status(500).json({message  : error.message});
  }
}


