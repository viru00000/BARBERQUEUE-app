import React from 'react'
import { Link, useNavigate } from "react-router-dom";
import { useState } from 'react';



const Login = ({setIsLoggedIn}) => {
  const [mobile , setMobile] = useState("");
  const [password , setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e)=>{
    e.preventDefault();

    if(mobile && password){
      setIsLoggedIn(true);
      navigate('/')
    }else{
      alert("please enter the mobile No and password");
    }
  }
  return (
    <>
    <div className='flex justify-center items-center min-h-screen bg-gray-950'>
      <div className='flex flex-col w-[520px] bg-zinc-900 items-center border border-white/20 p-8 shadow-xl rounded-2xl transition-transform duration-200 ease-in-out hover:scale-102 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:border-white/30'>
      <div><p className="self-start mb-4 text-sm text-cyan-400 items-center cursor-pointer hover:text-white">
     <Link to="/">← Back to role selection</Link>
     </p></div>
        <div className='items-center text-center '>
          <h2 className='text-2xl font-semibold text-cyan-500'>Welcome Back</h2>
          <p className='text-sm  opacity-20 text-white mt-1'>Sign in as Customer</p>
        </div>
        <form className=' flex flex-col gap-3 mt-5 w-full' onSubmit={handleSubmit}>

              <input type='text' value={mobile} onChange={(e)=>setMobile(e.target.value)} className='p-3 bg-transparent border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition' placeholder='mobile Number'></input>


              <input type='password' value={password} onChange={(e)=>setPassword(e.target.value)} className='p-3 bg-transparent border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition'  placeholder='Password'></input>


            <button className=' rounded-md  py-2 px-3 bg-cyan-500  hover:bg-cyan-300 shadow-lg shadow-cyan-500/50' type='submit'>Login</button>


        </form>
        <div className='text-sm mt-4 opacity-25'><p>forgot Password?? <span className='text'><a>click here!!!</a></span></p></div>
        <div className='text-sm mt-4 '><p className='opacity-60'>Dont have an account??<span className='text-cyan-300 hover:font-semibold opacity-100'>  <Link to='/register'>Sign up</Link></span></p></div>
      </div>
    </div>
    </>
  )
}

export default Login