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
    if (userData) {
      setUser(userData);
    }

    // Initialize Socket.IO connection
    const newSocket = io('http://localhost:5000');
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
          const res = await axios.get(`http://localhost:5000/api/salon/customer-queue-status/${user.id}`);
          setCurrentQueueStatus(res.data);
        } catch (err) {
          console.error('Failed to check queue status:', err);
        }
      }
    };

    checkQueueStatus();
  }, [user]);

  // Set up real-time queue updates
  useEffect(() => {
    if (socket) {
      socket.on('queueUpdated', (data) => {
        setSalons(prevSalons =>
          prevSalons.map(salon =>
            salon._id === data.salonId
              ? { ...salon, queue: data.queue }
              : salon
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('queueUpdated');
      }
    };
  }, [socket]);

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

  const refreshSalons = async () => {
    try {
      if (!navigator.geolocation) return;
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const { latitude, longitude } = pos.coords;
      setUserLoc({ lat: latitude, lng: longitude });
      const res = await axios.get(
        `http://localhost:5000/api/salon/get?lat=${latitude}&lng=${longitude}&radius=5000`
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

    try {
      const res = await axios.post("http://localhost:5000/api/salon/join-queue", {
        salonId,
        customerName: user.name,
        customerEmail: user.email,
        service: serviceName,
        customerId: user.id,
      });

      const { message, position, etaMinutes } = res.data;
      window.appToast?.success(`Joined queue • Position ${position + 1} • ETA ${etaMinutes} min`);

      // Update current queue status
      setCurrentQueueStatus({
        inQueue: true,
        salon: { id: salonId },
        position,
        service: serviceName
      });

      await refreshSalons();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      window.appToast?.error("Failed to join queue: " + errorMessage);
    }
  };

  const handleLeaveQueue = async () => {
    if (!currentQueueStatus?.inQueue || !user) return;

    try {
      await axios.post("http://localhost:5000/api/salon/leave-queue", {
        salonId: currentQueueStatus.salon.id,
        customerId: user.id,
      });

      window.appToast?.success("You have left the queue");
      setCurrentQueueStatus(null);
      await refreshSalons();
    } catch (err) {
      window.appToast?.error("Failed to leave queue: " + err.message);
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
            className="flex-1 border border-gray-700 bg-gray-800 rounded px-3 py-2 text-sm"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-700 bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="nearest">Nearest</option>
            <option value="shortest_eta">Shortest ETA</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAndSorted.map((salon) => (
          <div key={salon._id} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-400">{salon.name}</h2>
                  <p className="text-gray-300 mt-1">{salon.address}</p>
                  <p className="text-gray-400 text-sm mt-1">Contact: {salon.contact}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Distance</div>
                  <div className="text-sm font-medium">{formatDistance(salon._distanceM)}</div>
                  <div className="text-xs text-gray-400 mt-2">In queue</div>
                  <div className="text-xl font-bold">{salon.queue?.length || 0}</div>
                </div>
              </div>

              <h3 className="font-semibold mt-5 mb-2">Services</h3>
              <ul className="space-y-2">
                {salon.services.map((service, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-750/50 p-3 rounded-lg border border-gray-700"
                  >
                    <div>
                      <div className="font-medium">
                        {service.name} <span className="text-gray-400">• ₹{service.price}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Duration: {service.duration} min
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-300">
                        ETA: {estimateWaitMinutes(salon, service)} min
                      </div>
                      {currentQueueStatus?.inQueue ? (
                        <button
                          disabled
                          className="bg-gray-600 px-3 py-1.5 rounded-md cursor-not-allowed"
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
