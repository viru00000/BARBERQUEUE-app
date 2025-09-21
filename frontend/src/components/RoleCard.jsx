// RoleCard.jsx
import React from 'react';

const RoleCard = ({ title, description, icon: Icon, points }) => {
  return (
    <div className="flex items-center justify-center mt-10">
      <div className="w-full max-w-xs flex-1
          bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-800
          text-gray-900 dark:text-white text-center border border-gray-200 dark:border-gray-700 rounded-2xl
          shadow-lg p-6 transition-all duration-500 ease-in-out
          hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:border-gray-300 dark:hover:border-white/40
          flex flex-col min-h-[340px]">

        {/* Circle */}
        <div className="h-16 w-16 rounded-full bg-red-300 mx-auto mb-3 flex justify-center items-center">
          <Icon className="text-3xl" />
        </div>

        {/* Title */}
        <div className="font-bold text-xl md:text-2xl mb-2">{title}</div>

        {/* Description */}
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{description}</p>

        {/* Points */}
        <ul className="mt-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 flex-1">
          {points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default RoleCard;
