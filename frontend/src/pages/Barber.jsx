import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from 'socket.io-client';

const Barber = () => {
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [servicesDraft, setServicesDraft] = useState([]);

  // Initialize user data and socket connection
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }

    // Initialize Socket.IO connection
    const newSocket = io('https://barberqueue-app-2.onrender.com');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch salon data (by owner)
  useEffect(() => {
    const fetchSalonData = async () => {
      if (!user?.id) return;

      try {
        // Fetch salon owned by current user
        const res = await axios.get(`https://barberqueue-app-2.onrender.com/api/salon/by-owner/${user.id}`);
        const userSalon = res.data;

        if (userSalon) {
          setSalon(userSalon);
          setServicesDraft(userSalon.services || []);

          // Join salon room for real-time updates
          if (socket) {
            socket.emit('joinSalon', userSalon._id);
          }
        } else {
          setError("No salon found for your account. Please register a salon first.");
        }
      } catch (err) {
        setError("Failed to fetch salon data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && socket) {
      fetchSalonData();
    }
  }, [user, socket]);

  // Set up real-time queue updates
  useEffect(() => {
    if (socket) {
      socket.on('queueUpdated', (data) => {
        if (salon && data.salonId === salon._id) {
          setSalon(prevSalon => ({
            ...prevSalon,
            queue: data.queue
          }));
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('queueUpdated');
      }
    };
  }, [socket, salon]);

  // Handle services editing
  const startEdit = () => {
    setServicesDraft(salon?.services ? salon.services.map(s => ({ ...s })) : []);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setServicesDraft(salon?.services ? salon.services.map(s => ({ ...s })) : []);
    setEditMode(false);
  };

  const updateServiceField = (index, field, value) => {
    setServicesDraft(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addServiceRow = () => {
    setServicesDraft(prev => [...prev, { name: '', price: 0, duration: 15 }]);
  };

  const removeServiceRow = (index) => {
    setServicesDraft(prev => prev.filter((_, i) => i !== index));
  };

  const saveServices = async () => {
    if (!salon) return;
    // basic validation
    const cleaned = servicesDraft.map(s => ({
      name: String(s.name || '').trim(),
      price: Number(s.price || 0),
      duration: parseInt(s.duration || 0, 10)
    })).filter(s => s.name && s.price >= 0 && s.duration > 0);

    try {
      const res = await axios.put(`https://barberqueue-app-2.onrender.com/api/salon/${salon._id}`, {
        services: cleaned
      });
      setSalon(res.data.salon);
      setEditMode(false);
      // notify room via socket will be handled by backend 'salonUpdated'
    } catch (err) {
      alert('Failed to save services: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleNext = async () => {
    if (!salon || salon.queue.length === 0) return;

    try {
      // Remove the first customer from queue
      const updatedQueue = salon.queue.slice(1);

      // Update salon in database
      await axios.put(`https://barberqueue-app-2.onrender.com/api/salon/${salon._id}/queue`, {
        queue: updatedQueue
      });

      // Update local state
      setSalon(prevSalon => ({
        ...prevSalon,
        queue: updatedQueue
      }));

      // Emit real-time update
      if (socket) {
        socket.emit('queueUpdated', {
          salonId: salon._id,
          queue: updatedQueue,
          customerServed: salon.queue[0]
        });
      }

      alert(`Served: ${salon.queue[0].customerName} - ${salon.queue[0].service}`);
    } catch (err) {
      alert("Failed to serve next customer: " + err.message);
    }
  };

  const clearQueue = async () => {
    if (!salon) return;

    if (window.confirm("Are you sure you want to clear the entire queue?")) {
      try {
        await axios.put(`https://barberqueue-app-2.onrender.com/api/salon/${salon._id}/queue`, {
          queue: []
        });

        setSalon(prevSalon => ({
          ...prevSalon,
          queue: []
        }));

        // Emit real-time update
        if (socket) {
          socket.emit('queueUpdated', {
            salonId: salon._id,
            queue: [],
            queueCleared: true
          });
        }

        alert("Queue cleared successfully");
      } catch (err) {
        alert("Failed to clear queue: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-6 mt-24">Loading salon data...</div>;
  if (error) return <div className="p-6 mt-24 text-red-500">{error}</div>;
  if (!salon) return <div className="p-6 mt-24 text-gray-400">No salon found. Please register a salon first.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto mt-24">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">Barber Dashboard</h1>
        <p className="text-gray-400 mt-2">Welcome back, {user?.name}!</p>
      </div>

      {/* Salon Info */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">{salon.name}</h2>
        <p className="text-gray-300">{salon.address}</p>
        <p className="text-gray-400 text-sm">Contact: {salon.contact}</p>
      </div>

      {/* Queue Status */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Customer Queue</h2>
          <div className="text-2xl font-bold text-cyan-400">
            {salon.queue?.length || 0} customers
          </div>
        </div>

        {salon.queue && salon.queue.length > 0 ? (
          <div className="space-y-3">
            {salon.queue.map((customer, index) => (
              <div
                key={customer.customerId || index}
                className={`p-4 rounded-lg border ${index === 0
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-gray-700 border-gray-600'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-cyan-400">
                        #{index + 1}
                      </span>
                      <span className="text-lg font-semibold text-white">
                        {customer.customerName}
                      </span>
                      {index === 0 && (
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                          NEXT
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 mt-1">
                      Service: {customer.service}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Joined: {new Date(customer.joinedAt).toLocaleTimeString()}
                    </p>
                    {customer.notified && (
                      <p className="text-green-400 text-sm">✓ Notified</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No customers in queue</p>
            <p className="text-gray-500 text-sm mt-2">
              Customers will appear here when they join your queue
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleNext}
            disabled={!salon.queue || salon.queue.length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold"
          >
            Serve Next Customer
          </button>

          <button
            onClick={clearQueue}
            disabled={!salon.queue || salon.queue.length === 0}
            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold"
          >
            Clear Queue
          </button>
        </div>
      </div>

      {/* Services Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Services</h3>
          {!editMode ? (
            <button onClick={startEdit} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg">
              Edit Services
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveServices} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg">Save</button>
              <button onClick={cancelEdit} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg">Cancel</button>
            </div>
          )}
        </div>

        {!editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salon.services?.map((service, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-white">{service.name}</h4>
                <p className="text-cyan-400 font-bold">₹{service.price}</p>
                <p className="text-gray-400 text-sm">{service.duration} minutes</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {servicesDraft.map((s, idx) => (
              <div key={idx} className="bg-gray-700 p-4 rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <input
                  value={s.name}
                  onChange={(e) => updateServiceField(idx, 'name', e.target.value)}
                  placeholder="Service name"
                  className="md:col-span-5 bg-gray-800 border border-gray-600 rounded px-3 py-2"
                />
                <input
                  type="number"
                  value={s.price}
                  onChange={(e) => updateServiceField(idx, 'price', e.target.value)}
                  placeholder="Price"
                  className="md:col-span-3 bg-gray-800 border border-gray-600 rounded px-3 py-2"
                />
                <input
                  type="number"
                  value={s.duration}
                  onChange={(e) => updateServiceField(idx, 'duration', e.target.value)}
                  placeholder="Duration (min)"
                  className="md:col-span-3 bg-gray-800 border border-gray-600 rounded px-3 py-2"
                />
                <button onClick={() => removeServiceRow(idx)} className="md:col-span-1 bg-red-600 hover:bg-red-500 px-3 py-2 rounded">Remove</button>
              </div>
            ))}
            <button onClick={addServiceRow} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">+ Add Service</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Barber;
