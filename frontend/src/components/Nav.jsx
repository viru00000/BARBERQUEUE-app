import React, { useState } from 'react';
import { FaCut, FaMoon, FaSun } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';

const Nav = ({ isLoggedIn, setIsLoggedIn }) => {
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggedIn(false);
    // optionally remove token from localStorage
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 md:px-16 z-50
      backdrop-blur-lg bg-gradient-to-r from-black/70 via-gray-900/80 to-black/70 border-b border-gray-700 text-white shadow-lg">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <FaCut className="text-2xl text-[#00f7ff] drop-shadow-lg" />
        <h1 className="font-bold text-lg">BarberQueue</h1>
      </div>

      {/* Right side: Logout + Dark/Light toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-700 transition"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="bg-cyan-500 text-black font-semibold px-4 py-1 rounded hover:bg-cyan-400 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

export default Nav;
