import React from 'react'
import { Routes, Route } from "react-router-dom";
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home'
import Barber from '../pages/Barber';
import SalonList from '../pages/SalonList';
import SalonRegister from "../pages/SalonRegister";
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = ({ setIsLoggedIn }) => {
  return (

    <Routes>
      <Route path='/' element={<Home />} />

      <Route path='/login' element={<Login setIsLoggedIn={setIsLoggedIn} />} />

      <Route path='/register' element={<Register />} />

      <Route path='/barber' element={
        <ProtectedRoute>
          <Barber />
        </ProtectedRoute>
      } />

      <Route path='/customer' element={
        <ProtectedRoute requiredRole="customer">
          <SalonList />
        </ProtectedRoute>
      } />

      <Route path="/register-salon" element={
        <ProtectedRoute requiredRole="salonOwner">
          <SalonRegister />
        </ProtectedRoute>
      } />

    </Routes>

  )
}

export default AppRoutes