import React from 'react'
import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';
import axios from 'axios';



const Login = ({ setIsLoggedIn }) => {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!/^\d{10}$/.test(mobile)) e.mobile = 'Enter 10 digit phone number';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5000/api/user/login', {
        number: mobile,
        password
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setIsLoggedIn(true);
      window.appToast?.success('Login successful');
      if (res.data.user?.role === 'salonOwner') {
        // Check if owner already has a salon
        try {
          const ownerId = res.data.user.id;
          await axios.get(`http://localhost:5000/api/salon/by-owner/${ownerId}`);
          navigate('/barber');
        } catch {
          navigate('/register-salon');
        }
      } else {
        navigate('/customer');
      }
    } catch (err) {
      window.appToast?.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className='flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300'>
        <div className='flex flex-col w-[520px] bg-white dark:bg-zinc-900 items-center border border-gray-200 dark:border-white/20 p-8 shadow-xl rounded-2xl transition-all duration-200 ease-in-out hover:scale-102 hover:shadow-[0_0_25px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:border-gray-300 dark:hover:border-white/30'>
          <div><p className="self-start mb-4 text-sm text-cyan-400 items-center cursor-pointer hover:text-cyan-300">
            <Link to="/">← Back to role selection</Link>
          </p></div>
          <div className='items-center text-center '>
            <h2 className='text-2xl font-semibold text-cyan-500'>Welcome Back</h2>
            <p className='text-sm opacity-60 text-gray-600 dark:text-gray-400 mt-1'>Sign in</p>
          </div>
          <form className=' flex flex-col gap-3 mt-5 w-full' onSubmit={handleSubmit}>

            <div>
              <input type='text' value={mobile} onChange={(e) => setMobile(e.target.value)} className={`p-3 w-full bg-transparent border ${errors.mobile ? 'border-red-500' : 'border-gray-300 dark:border-white/30'} rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition`} placeholder='Mobile Number'></input>
              {errors.mobile && <p className='text-red-500 text-xs mt-1'>{errors.mobile}</p>}
            </div>

            <div>
              <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} className={`p-3 w-full bg-transparent border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-white/30'} rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition`} placeholder='Password'></input>
              {errors.password && <p className='text-red-500 text-xs mt-1'>{errors.password}</p>}
            </div>


            <button disabled={loading} className=' rounded-md  py-2 px-3 bg-cyan-500  hover:bg-cyan-300 shadow-lg shadow-cyan-500/50 disabled:opacity-50' type='submit'>{loading ? 'Signing in...' : 'Login'}</button>


          </form>
          <div className='text-sm mt-4 opacity-50'><p>forgot Password?? <span className='text'><a>click here!!!</a></span></p></div>
          <div className='text-sm mt-4 '><p className='opacity-60'>Dont have an account??<span className='text-cyan-300 hover:font-semibold opacity-100'>  <Link to='/register'>Sign up</Link></span></p></div>
        </div>
      </div>
    </>
  )
}

export default Login