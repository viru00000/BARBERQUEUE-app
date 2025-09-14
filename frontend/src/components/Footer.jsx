import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-400 py-6  border-t border-gray-700">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Left Side - Logo or Copyright */}
        <p className="text-sm">&copy; {new Date().getFullYear()} Virendra. All rights reserved.</p>

        {/* Right Side - Links */}
        <div className="flex gap-6 text-sm">
          <a href="#" className="hover:text-white transition">About</a>
          <a href="#" className="hover:text-white transition">Services</a>
          <a href="#" className="hover:text-white transition">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
