import React, { useState, useEffect } from "react";
import axios from "axios";

const SalonList = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const res = await axios.get(
            `http://localhost:5000/api/salon/get?lat=${latitude}&lng=${longitude}&radius=5000`
          );

          setSalons(res.data);
        } catch (err) {
          setError("Failed to fetch salons: " + err.message);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Failed to get location: " + err.message);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <p className="p-6">Loading nearby salons...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!salons.length) return <p className="p-6">No salons found nearby.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nearby Salons</h1>
      <div className="space-y-4">
        {salons.map((salon) => (
          <div key={salon._id} className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-cyan-400">{salon.name}</h2>
            <p className="text-gray-400 mb-2">{salon.address}</p>
            <p className="text-gray-400 mb-2">Contact: {salon.contact}</p>

            <h3 className="font-semibold mt-2 mb-1">Services:</h3>
            <ul className="space-y-1">
              {salon.services.map((service, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center bg-gray-700 p-2 rounded"
                >
                  <span>
                    {service.name} - ₹{service.price} ({service.duration} min)
                  </span>
                  <button className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded">
                    Join Queue
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalonList;
