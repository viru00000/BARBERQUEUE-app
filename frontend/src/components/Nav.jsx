import React, { useEffect, useMemo, useState } from 'react';
import { FaCut, FaMoon, FaSun } from "react-icons/fa";
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Nav = ({ isLoggedIn, setIsLoggedIn }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  const showLogout = useMemo(() => {
    // Hide on home when not logged in
    if (!isLoggedIn && location.pathname === '/') return false;
    return isLoggedIn;
  }, [isLoggedIn, location.pathname]);

  return (
    <nav className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 md:px-16 z-50
      backdrop-blur-lg bg-gradient-to-r from-white/70 via-gray-100/80 to-white/70 dark:from-black/70 dark:via-gray-900/80 dark:to-black/70 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg transition-colors duration-300">

      {/* Logo */}
      <div className="flex items-center gap-3">
        <FaCut className="text-2xl text-[#00f7ff] drop-shadow-lg" />
        <h1 className="font-bold text-lg">BarberQueue</h1>
      </div>

      {/* Right side: Logout + Dark/Light toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          {darkMode ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-blue-500" />}
        </button>

        {showLogout && (
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
