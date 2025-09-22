import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { io } from 'socket.io-client';

const toRad = (value) => (value * Math.PI) / 180;
const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const SalonList = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLoc, setUserLoc] = useState({ lat: null, lng: null });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("nearest"); // nearest | shortest_eta | name
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentQueueStatus, setCurrentQueueStatus] = useState(null);

  // Initialize user data and socket connection
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    console.log('Retrieved user data from localStorage:', userData);
    if (userData) {
      setUser(userData);
    }

    // Initialize Socket.IO connection
    const newSocket = io('https://barberqueue-app-2.onrender.com', {
      transports: ['websocket', 'polling']
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Check current queue status
  useEffect(() => {
    const checkQueueStatus = async () => {
      if (user?.id) {
        try {
          console.log('Checking queue status for user:', user);
          const res = await axios.get(`https://barberqueue-app-2.onrender.com/api/salon/customer-queue-status/${user.id}`);
          console.log('Queue status response:', res.data);
          setCurrentQueueStatus(res.data);
          // Attempt to join the salon room if we're already in a queue
          const sid = res.data?.salon?.id || res.data?.salonId || res.data?.salon || null;
          if (sid && socket) {
            socket.emit('joinSalon', sid);
          }
        } catch (err) {
          console.error('Failed to check queue status:', err);
        }
      }
    };

    checkQueueStatus();
  }, [user, socket]);

  // Join the salon room based on current queue status (if any)
  useEffect(() => {
    if (socket && currentQueueStatus?.salon?.id) {
      console.log('Auto-joining salon room based on queue status:', currentQueueStatus.salon.id);
      socket.emit('joinSalon', currentQueueStatus.salon.id);
    }
  }, [socket, currentQueueStatus?.salon?.id]);

  // Set up real-time queue updates
  useEffect(() => {
    if (socket) {
      console.log('Setting up queueUpdated listener');
      socket.on('queueUpdated', (data) => {
        console.log('Received queueUpdated event:', data);
        setSalons(prevSalons =>
          prevSalons.map(salon =>
            salon._id === data.salonId
              ? { ...salon, queue: data.queue }
              : salon
          )
        );
        // If the current user is in the served salon, and the customerServed matches, clear their status
        if (data.customerServed && user && data.customerServed.customerId === user.id) {
          console.log('Customer was served, clearing queue status');
          setCurrentQueueStatus(null);
        }
        
        // Also check if the customer is no longer in any queue
        const isStillInQueue = data.queue && data.queue.some(customer => customer.customerId === user.id);
        if (!isStillInQueue && currentQueueStatus?.inQueue && currentQueueStatus?.salon?.id === data.salonId) {
          console.log('Customer no longer in queue, clearing status');
          setCurrentQueueStatus(null);
        }
        
        // If queue is empty and we think we're in queue, clear status
        if (data.queue && data.queue.length === 0 && currentQueueStatus?.inQueue && currentQueueStatus?.salon?.id === data.salonId) {
          console.log('Queue is empty, clearing customer status');
          setCurrentQueueStatus(null);
        }
      });

      // Listen for connection events
      socket.on('connect', () => {
        console.log('Socket connected');
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      if (socket) {
        socket.off('queueUpdated');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
      }
    };
  }, [socket, user]);

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
          setUserLoc({ lat: latitude, lng: longitude });

          const res = await axios.get(
            `https://barberqueue-app-2.onrender.com/api/salon/get?lat=${latitude}&lng=${longitude}&radius=5000`
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

  const refreshSalons = async () => {
    try {
      if (!navigator.geolocation) return;
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const { latitude, longitude } = pos.coords;
      setUserLoc({ lat: latitude, lng: longitude });
      const res = await axios.get(
        `https://barberqueue-app-2.onrender.com/api/salon/get?lat=${latitude}&lng=${longitude}&radius=5000`
      );
      setSalons(res.data);
    } catch (e) {
      // ignore refresh failures
    }
  };

  const estimateWaitMinutes = (salon, service) => {
    const queueLength = Array.isArray(salon.queue) ? salon.queue.length : 0;
    const averageDuration = salon.services?.length
      ? Math.round(
        salon.services.reduce((sum, s) => sum + (s.duration || 15), 0) /
        salon.services.length
      )
      : 15;
    const perCustomer = service?.duration || averageDuration;
    return queueLength * perCustomer;
  };

  const minEtaForSalon = (salon) => {
    if (!Array.isArray(salon.services) || salon.services.length === 0) return null;
    return salon.services.reduce((min, s) => {
      const eta = estimateWaitMinutes(salon, s);
      return min === null ? eta : Math.min(min, eta);
    }, null);
  };

  const salonsWithComputed = useMemo(() => {
    return salons.map((salon) => {
      const coords = salon.location?.coordinates; // [lng, lat]
      const lat = Array.isArray(coords) ? coords[1] : null;
      const lng = Array.isArray(coords) ? coords[0] : null;
      const distanceM =
        userLoc.lat != null && userLoc.lng != null && lat != null && lng != null
          ? haversineDistanceMeters(userLoc.lat, userLoc.lng, lat, lng)
          : null;
      return {
        ...salon,
        _distanceM: distanceM,
        _minEta: minEtaForSalon(salon),
      };
    });
  }, [salons, userLoc]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = salonsWithComputed.filter((s) => {
      if (!q) return true;
      const name = s.name?.toLowerCase() || "";
      const address = s.address?.toLowerCase() || "";
      const services = (s.services || []).map((sv) => sv.name?.toLowerCase() || "").join(" ");
      return name.includes(q) || address.includes(q) || services.includes(q);
    });

    if (sortBy === "nearest") {
      list = list.sort((a, b) => {
        const da = a._distanceM ?? Number.POSITIVE_INFINITY;
        const db = b._distanceM ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
    } else if (sortBy === "shortest_eta") {
      list = list.sort((a, b) => {
        const ea = a._minEta ?? Number.POSITIVE_INFINITY;
        const eb = b._minEta ?? Number.POSITIVE_INFINITY;
        return ea - eb;
      });
    } else if (sortBy === "name") {
      list = list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return list;
  }, [salonsWithComputed, search, sortBy]);

  if (loading) return <p className="p-6 mt-24">Finding nearby salons...</p>;
  if (error) return <p className="p-6 mt-24 text-red-500">{error}</p>;
  if (!salons.length) return <p className="p-6 mt-24">No salons found nearby.</p>;

  const handleJoinQueue = async (salonId, serviceName) => {
    if (!user) {
      alert("Please log in to join a queue");
      return;
    }

    // Check if already in queue
    if (currentQueueStatus?.inQueue) {
      window.appToast?.error("You are already in a queue. Please leave the current queue first.");
      return;
    }

    // Validate user data before sending
    if (!user.name || !user.email || !user.id) {
      console.error('User data incomplete:', { name: user.name, email: user.email, id: user.id });
      window.appToast?.error("User data incomplete. Please log in again.");
      return;
    }

    try {
      // Validate salonId and service
      if (!salonId) {
        window.appToast?.error("Invalid salon ID");
        return;
      }
      if (!serviceName || serviceName.trim() === '') {
        window.appToast?.error("Please select a service");
        return;
      }

      // Check if already in queue for this specific salon
      if (currentQueueStatus?.inQueue && currentQueueStatus?.salon?.id === salonId) {
        window.appToast?.error("You are already in the queue for this salon!");
        return;
      }

      // Check if already in queue for any other salon
      if (currentQueueStatus?.inQueue && currentQueueStatus?.salon?.id !== salonId) {
        window.appToast?.error("You are already in a queue at another salon. Please leave that queue first.");
        return;
      }

      // Double-check by looking at the salon list to see if user is already in any queue
      const isInAnyQueue = salons.some(salon => 
        salon.queue && salon.queue.some(customer => customer.customerId === user.id)
      );
      if (isInAnyQueue) {
        window.appToast?.error("You are already in a queue at another salon. Please leave that queue first.");
        return;
      }

      const payload = {
        salonId,
        customerName: user.name,
        customerEmail: user.email,
        service: serviceName,
        customerId: user.id,
      };
      
      console.log('Sending join queue request:', payload);
      console.log('User object:', user);
      
      const res = await axios.post("https://barberqueue-app-2.onrender.com/api/salon/join-queue", payload);

      const { message, position, etaMinutes } = res.data;
      window.appToast?.success(`Joined queue • Position ${position + 1} • ETA ${etaMinutes} min`);

      // Update current queue status
      setCurrentQueueStatus({
        inQueue: true,
        salon: { id: salonId },
        position,
        service: serviceName
      });

      // Join salon room for realtime updates immediately
      if (socket) {
        console.log('Joining salon room:', salonId);
        socket.emit('joinSalon', salonId);
      } else {
        console.error('Socket not available for joining salon room');
      }

      // Also join the room after a short delay to ensure the state is updated
      setTimeout(() => {
        if (socket) {
          console.log('Delayed join salon room:', salonId);
          socket.emit('joinSalon', salonId);
        }
      }, 1000);

      await refreshSalons();
    } catch (err) {
      console.error('Join queue error:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message;
      
      // Handle specific error cases
      if (err.response?.status === 400) {
        if (errorMessage.includes('already in the queue')) {
          window.appToast?.error("You are already in this salon's queue!");
        } else if (errorMessage.includes('already in a queue at another salon')) {
          window.appToast?.error("You are already in a queue at another salon. Please leave that queue first.");
        } else {
          window.appToast?.error("Cannot join queue: " + errorMessage);
        }
      } else {
        window.appToast?.error("Failed to join queue: " + errorMessage);
      }
    }
  };

  const handleLeaveQueue = async () => {
    if (!currentQueueStatus?.inQueue || !user) return;

    // Check if customer is actually in the queue by looking at the salon list
    const salon = salons.find(s => s._id === currentQueueStatus.salon.id);
    const isActuallyInQueue = salon && salon.queue && salon.queue.some(customer => customer.customerId === user.id);
    
    if (!isActuallyInQueue) {
      console.log('Customer not actually in queue, clearing status without API call');
      setCurrentQueueStatus(null);
      if (socket) {
        socket.emit('leaveSalon', currentQueueStatus.salon.id);
      }
      return;
    }

    try {
      const payload = {
        salonId: currentQueueStatus.salon.id,
        customerId: user.id,
      };
      
      console.log('Sending leave queue request:', payload);
      console.log('Current queue status:', currentQueueStatus);

      await axios.post("https://barberqueue-app-2.onrender.com/api/salon/leave-queue", payload);

      window.appToast?.success("You have left the queue");
      setCurrentQueueStatus(null);
      if (socket) {
        socket.emit('leaveSalon', currentQueueStatus.salon.id);
      }
      await refreshSalons();
    } catch (err) {
      console.error('Leave queue error:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message;
      
      // If the error is "not in queue", just clear the status
      if (errorMessage.includes("not in this salon's queue")) {
        console.log('Customer not in queue, clearing status');
        setCurrentQueueStatus(null);
        if (socket) {
          socket.emit('leaveSalon', currentQueueStatus.salon.id);
        }
      } else {
        window.appToast?.error("Failed to leave queue: " + errorMessage);
      }
    }
  };

  const formatDistance = (m) => {
    if (m == null) return "-";
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${Math.round(m)} m`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto mt-24">
      {/* Current Queue Status */}
      {currentQueueStatus?.inQueue && (
        <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-400">You're in Queue!</h3>
              <p className="text-gray-300">
                Position: {currentQueueStatus.position + 1} • Service: {currentQueueStatus.service}
              </p>
              <p className="text-sm text-gray-400">
                Salon: {salons.find(s => s._id === currentQueueStatus.salon.id)?.name}
              </p>
            </div>
            <button
              onClick={handleLeaveQueue}
              className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md text-white"
            >
              Leave Queue
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Salons Near You</h1>
          <p className="text-gray-400">Choose a service to see estimated wait and join the queue.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, address, or service"
            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-3 py-2 text-sm"
          >
            <option value="nearest">Nearest</option>
            <option value="shortest_eta">Shortest ETA</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAndSorted.map((salon) => (
          <div key={salon._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-600 dark:text-cyan-400">{salon.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{salon.address}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Contact: {salon.contact}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Distance</div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{formatDistance(salon._distanceM)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">In queue</div>
                  <div className="text-xl font-bold">{salon.queue?.length || 0}</div>
                </div>
              </div>

              <h3 className="font-semibold mt-5 mb-2">Services</h3>
              <ul className="space-y-2">
                {salon.services.map((service, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-100 dark:bg-gray-750/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div>
                      <div className="font-medium  dark:text-gray-700">
                        {service.name} <span className="text-gray-500 dark:text-gray-800">• ₹{service.price}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-800">
                        Duration: {service.duration} min
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-700 dark:text-gray-600">
                        ETA: {estimateWaitMinutes(salon, service)} min
                      </div>
                      {currentQueueStatus?.inQueue ? (
                        <button
                          disabled
                          className="bg-gray-400 dark:bg-gray-600 px-3 py-1.5 rounded-md cursor-not-allowed"
                        >
                          Already in Queue
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinQueue(salon._id, service.name)}
                          className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-md"
                        >
                          Join Queue
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalonList;
