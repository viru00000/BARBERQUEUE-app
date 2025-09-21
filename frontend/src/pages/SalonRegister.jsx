import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const isValidPhone = (phone) => /^(\+\d{1,3}[- ]?)?\d{7,15}$/.test(phone);

const SalonRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    owner: "",
    name: "",
    address: "",
    contact: "",
    services: [{ name: "", price: "", duration: "" }],
  });
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [locLoading, setLocLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Prefill owner from logged-in user (salonOwner)
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return;
      const user = JSON.parse(userRaw);
      if (user?.role === 'salonOwner' && user?.name) {
        setFormData((prev) => ({ ...prev, owner: user.name }));
      }
    } catch { }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (index, e) => {
    const { name, value } = e.target;
    const updatedServices = [...formData.services];
    updatedServices[index][name] = value;
    setFormData((prev) => ({ ...prev, services: updatedServices }));
  };

  const handleAddService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", price: "", duration: "" }],
    }));
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: {
          format: "json",
          lat,
          lon: lng,
          zoom: 18,
          addressdetails: 1,
        },
      });
      const display = res.data?.display_name;
      if (display) {
        setFormData((prev) => ({ ...prev, address: display }));
      }
    } catch (err) {
      // ignore reverse geocode failures; user can edit manually
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        await reverseGeocode(next.lat, next.lng);
        setLocLoading(false);
      },
      (err) => {
        alert("Failed to get location: " + err.message);
        setLocLoading(false);
      }
    );
  };

  const validate = () => {
    const e = {};
    if (!formData.owner.trim()) e.owner = 'Owner name is required';
    if (!formData.name.trim()) e.name = 'Salon name is required';
    if (!formData.address.trim()) e.address = 'Address is required';
    if (!isValidPhone(formData.contact)) e.contact = 'Enter a valid phone number';
    const svcErrors = formData.services.map((s) => {
      const se = {};
      if (!s.name.trim()) se.name = 'Required';
      const priceNum = parseFloat(s.price);
      const durNum = parseInt(s.duration);
      if (!(priceNum >= 0)) se.price = '>= 0';
      if (!(durNum > 0)) se.duration = '> 0';
      return se;
    });
    if (svcErrors.some((se) => Object.keys(se).length)) e.services = svcErrors;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const payload = {
        owner: formData.owner,
        ownerId: JSON.parse(localStorage.getItem('user'))?.id,
        name: formData.name,
        address: formData.address,
        contact: formData.contact,
        services: formData.services.map(s => ({
          name: s.name,
          price: parseFloat(s.price),
          duration: parseInt(s.duration)
        })),
        // pass coords if available to bypass geocoding
        ...(coords.lat && coords.lng ? { lat: coords.lat, lng: coords.lng } : {})
      };

      console.log("Sending to backend:", payload);

      const res = await axios.post("https://barberqueue-app-2.onrender.com/api/salon/register", payload);

      window.appToast?.success("Salon registered successfully");
      console.log(res.data);

      // Redirect to barber dashboard
      navigate('/barber');
    } catch (error) {
      console.error("Error registering salon:", error.response?.data || error);
      window.appToast?.error(error.response?.data?.message || "Failed to register salon");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto space-y-4 mt-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Register Salon</h2>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded"
          disabled={locLoading}
        >
          {locLoading ? "Locating..." : "Use Current Location"}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Owner Name</label>
        <input
          type="text"
          name="owner"
          placeholder="Owner Name"
          value={formData.owner}
          onChange={handleChange}
          className={`w-full border p-2 rounded ${errors.owner ? 'border-red-500' : 'border-white/30'}`}
          readOnly
          required
        />
        {errors.owner && <p className="text-xs text-red-500 mt-1">{errors.owner}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Salon Name</label>
        <input
          type="text"
          name="name"
          placeholder="Salon Name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full border p-2 rounded ${errors.name ? 'border-red-500' : 'border-white/30'}`}
          required
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className={`w-full border p-2 rounded ${errors.address ? 'border-red-500' : 'border-white/30'}`}
          required
        />
        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
        {coords.lat && coords.lng && (
          <p className="text-xs text-gray-400 mt-1">Location set from device • {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contact Number</label>
        <input
          type="text"
          name="contact"
          placeholder="Contact Number"
          value={formData.contact}
          onChange={handleChange}
          className={`w-full border p-2 rounded ${errors.contact ? 'border-red-500' : 'border-white/30'}`}
          required
        />
        {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
      </div>

      <h3 className="font-bold">Services</h3>
      {formData.services.map((service, index) => (
        <div key={index} className="flex flex-col gap-2 bg-gray-800 p-3 rounded">
          <div className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Service Name"
              value={service.name}
              onChange={(e) => handleServiceChange(index, e)}
              className={`flex-1 border p-2 rounded ${errors.services?.[index]?.name ? 'border-red-500' : 'border-white/30'}`}
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={service.price}
              onChange={(e) => handleServiceChange(index, e)}
              className={`w-28 border p-2 rounded ${errors.services?.[index]?.price ? 'border-red-500' : 'border-white/30'}`}
              required
            />
            <input
              type="number"
              name="duration"
              placeholder="Duration (min)"
              value={service.duration}
              onChange={(e) => handleServiceChange(index, e)}
              className={`w-32 border p-2 rounded ${errors.services?.[index]?.duration ? 'border-red-500' : 'border-white/30'}`}
              required
            />
          </div>
          {(errors.services?.[index]) && (
            <div className="text-xs text-red-500">
              {errors.services[index].name && <span className="mr-3">Name: {errors.services[index].name}</span>}
              {errors.services[index].price && <span className="mr-3">Price: {errors.services[index].price}</span>}
              {errors.services[index].duration && <span>Duration: {errors.services[index].duration}</span>}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddService}
        className="px-3 py-1 bg-gray-700 text-white rounded"
      >
        + Add Service
      </button>

      <button
        type="submit"
        className="w-full bg-green-600 text-white p-2 rounded mt-4"
      >
        Register Salon
      </button>
    </form>
  );
};

export default SalonRegister;
