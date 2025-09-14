import React from 'react'
import { Routes , Route } from "react-router-dom";
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home'
import Barber from '../pages/Barber';
import SalonList from '../pages/SalonList';

const AppRoutes = ({ setIsLoggedIn }) => {
  return (

       <Routes>
        <Route path='/' element={<Home/>}/>

        <Route path='/login' element={<Login setIsLoggedIn={setIsLoggedIn} />}/>

        <Route path='/register' element={<Register/>}/>

        <Route path='/barber' element={<Barber/>}/>

        <Route path='/customer' element={<SalonList/>}/>

       </Routes>

  )
}

export default AppRoutes