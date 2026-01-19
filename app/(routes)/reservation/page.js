"use client";

import React, { useState, useEffect } from "react";

const ReservationPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    reservation_date: "",
    reservation_time: "",
    guest_count: 1,
    notes: "",
  });

  // Fetch restaurants on component mount
  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reservation/restaurants");
      const data = await response.json();

      if (response.ok) {
        setRestaurants(data.restaurants || []);
        // Auto-select first restaurant if available
        if (data.restaurants && data.restaurants.length > 0) {
          setSelectedRestaurant(data.restaurants[0]);
        }
      } else {
        setError(data.error || "Failed to fetch restaurants");
      }
    } catch (err) {
      setError("An error occurred while fetching restaurants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRestaurantChange = (e) => {
    const restaurantId = parseInt(e.target.value);
    const restaurant = restaurants.find((r) => r.id === restaurantId);
    setSelectedRestaurant(restaurant);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRestaurant) {
      setError("Please select a restaurant");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset form
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          reservation_date: "",
          reservation_time: "",
          guest_count: 1,
          notes: "",
        });
        // Show success message with reservation details
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || "Failed to create reservation");
      }
    } catch (err) {
      setError("An error occurred while creating reservation");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading restaurants...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Make a Reservation
          </h1>
          <p className="text-gray-600">
            Book your table at your favorite restaurant
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Reservation created successfully! Check your email for confirmation.
          </div>
        )}

        {/* Restaurant Selection and Details */}
        {restaurants.length > 0 && (
          <div className="bg-stone-800 shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Select Restaurant
            </h2>

            <select
              value={selectedRestaurant?.id || ""}
              onChange={handleRestaurantChange}
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name} - {restaurant.city}, {restaurant.country}
                </option>
              ))}
            </select>

            {selectedRestaurant && (
              <div className="bg-stone-900 p-6 rounded-lg border border-gold">
                <h3 className="text-xl font-semibold text-gray-300 mb-3">
                  {selectedRestaurant.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300">City</p>
                    <p className="text-lg text-gray-300">
                      {selectedRestaurant.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Country</p>
                    <p className="text-lg text-gray-300">
                      {selectedRestaurant.country}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reservation Form */}
        <div className="bg-stone-800 shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Reservation Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Reservation Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="reservation_date"
                  value={formData.reservation_date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="reservation_time"
                  value={formData.reservation_time}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="guest_count"
                  value={formData.guest_count}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="4"
                placeholder="Any special requests or dietary requirements..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedRestaurant}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              {submitting ? "Creating Reservation..." : "Book Table"}
            </button>
          </form>
        </div>

        {restaurants.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No restaurants available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationPage;
