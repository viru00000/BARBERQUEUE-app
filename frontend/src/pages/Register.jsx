import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";


const Register = () => {
  const [password , setPassword] = useState("");
  const [email , setEmail]  = useState("")
  const [mobile , setMobile] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e)=>{
     e.preventDefault();
    if(password && email && mobile){
       navigate("/login")
    }else{
      alert("please enter mobile no , email and password");
    }
  }
  return (
    <div className='min-h-screen flex justify-center items-center bg-gray-950 px-4'>
      <div className="flex flex-col w-full max-w-md bg-zinc-900 items-center border border-white/20 p-8 sm:p-8 shadow-xl rounded-2xl transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:border-white/30">


  <div><p className="self-start mb-4 text-sm text-cyan-400 items-center cursor-pointer hover:text-white">
   <Link to='/'> ← Back to role selection </Link>
  </p></div>
        <div className='flex flex-col items-center'>
         <h1 className='text-2xl font-semibold text-cyan-500'>Create Account</h1>
         <p className='text-sm  opacity-20 text-white mt-1'>Sign up as Customer</p>
        </div>
        <form onSubmit={handleSubmit} className='mt-5 w-full flex flex-col gap-2 '>
          <input value={mobile} onChange={(e)=>setMobile(e.target.value)} className='p-2 bg-transparent border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition'  type='text' placeholder='Enter 10 digit phone number (e.g, 9876543210)'/>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} className='p-2 bg-transparent border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition' type='email' placeholder='Gmail'/>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} className='p-2 bg-transparent border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition' type='password' placeholder='password'/>

          <button className='rounded-md  py-2 px-3 bg-cyan-500  hover:bg-cyan-400 shadow-lg shadow-cyan-500/50' type='submit'>Create Account</button>

        </form>

        <div className='mt-4 opacity-50 '>Already have an account? <span className='text-cyan-400 font-semibold'><Link to='/login'>Sign In</Link></span></div>

      </div>
    </div>
  )
}

export default Register