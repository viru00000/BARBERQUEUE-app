import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';

export const createUser = async (req, res) => {
  try {
    const { name, email, number, password, role } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'user already exist' });
    }
    if (await User.findOne({ number })) {
      return res
        .status(400)
        .json({ message: 'phone number already registered' });
    }

    let userRole = 'customer';
    if (role && (role === 'customer' || role === 'salonOwner')) {
      userRole = role;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      number,
      password: hashedPassword,
      role: userRole,
    });
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      number: user.number,
      role: user.role,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { number, password } = req.body;
    const userExist = await User.findOne({ number });
    if (userExist) {
      if (await bcrypt.compare(password, userExist.password)) {
        const token = jwt.sign(
          { id: userExist._id },
          process.env.JWT_SECRET || 'devsecret',
          { expiresIn: '7d' }
        );
        return res.status(200).json({
          token,
          user: {
            id: userExist._id,
            name: userExist.name,
            email: userExist.email,
            number: userExist.number,
            role: userExist.role,
          },
        });
      } else {
        res.status(401).json({ message: 'password and username dont match' });
      }
    } else {
      res.status(404).json({ message: 'user not registered' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
