import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{10}$/.test(phone);

const Register = () => {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState('customer');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!isValidPhone(mobile)) e.mobile = 'Enter 10 digit phone number';
    if (!isValidEmail(email)) e.email = 'Enter a valid email';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await axios.post('https://barberqueue-app-2.onrender.com/api/user/register', {
        name,
        email,
        number: mobile,
        password,
        role
      });
      window.appToast?.success('Registered successfully. Please login.');
      navigate("/login")
    } catch (err) {
      window.appToast?.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className='min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-950 px-4 transition-colors duration-300'>
      <div className="flex flex-col w-full max-w-md bg-white dark:bg-zinc-900 items-center border border-gray-200 dark:border-white/20 p-8 sm:p-8 shadow-xl rounded-2xl transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-[0_0_25px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:border-gray-300 dark:hover:border-white/30">


        <div><p className="self-start mb-4 text-sm text-cyan-400 items-center cursor-pointer hover:text-cyan-300">
          <Link to='/'> ← Back to role selection </Link>
        </p></div>
        <div className='flex flex-col items-center'>
          <h1 className='text-2xl font-semibold text-cyan-500'>Create Account</h1>
          <p className='text-sm opacity-60 text-gray-600 dark:text-gray-400 mt-1'>Sign up</p>
        </div>
        <form onSubmit={handleSubmit} className='mt-5 w-full flex flex-col gap-3 '>
          <div>
            <label className='text-xs text-gray-500 dark:text-gray-400 mb-1 block'>Register as</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className='w-full p-2 bg-transparent border border-gray-300 dark:border-white/30 rounded text-gray-900 dark:text-white'>
              <option value='customer'>Customer</option>
              <option value='salonOwner'>Barber</option>
            </select>
          </div>
          <div>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`p-2 w-full bg-transparent border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-white/30'} rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition`} type='text' placeholder='Full Name' />
            {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name}</p>}
          </div>
          <div>
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} className={`p-2 w-full bg-transparent border ${errors.mobile ? 'border-red-500' : 'border-gray-300 dark:border-white/30'} rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition`} type='text' placeholder='Enter 10 digit phone number (e.g, 9876543210)' />
            {errors.mobile && <p className='text-red-500 text-xs mt-1'>{errors.mobile}</p>}
          </div>
          <div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={`p-2 w-full bg-transparent border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-white/30'} rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition`} type='email' placeholder='Email' />
            {errors.email && <p className='text-red-500 text-xs mt-1'>{errors.email}</p>}
          </div>
          <div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className={`p-2 w-full bg-transparent border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-white/30'} rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition`} type='password' placeholder='Password (min 6 chars)' />
            {errors.password && <p className='text-red-500 text-xs mt-1'>{errors.password}</p>}
          </div>

          <button disabled={loading} className='rounded-md  py-2 px-3 bg-cyan-500  hover:bg-cyan-400 shadow-lg shadow-cyan-500/50 disabled:opacity-50' type='submit'>{loading ? 'Creating...' : 'Create Account'}</button>

        </form>

        <div className='mt-2 opacity-50 text-sm'>Already have an account? <span className='text-cyan-400 font-semibold'><Link to='/login'>Sign In</Link></span></div>

      </div>
    </div>
  )
}

export default Register
