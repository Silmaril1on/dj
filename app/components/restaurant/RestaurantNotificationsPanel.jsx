"use client";

import React, { useState, useEffect } from "react";

const RestaurantNotificationsPanel = ({ restaurantId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, sent

  useEffect(() => {
    if (restaurantId) {
      fetchNotifications();
    }
  }, [restaurantId, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const url = `/api/reservation/notifications?restaurant_id=${restaurantId}${
        filter !== "all" ? `&status=${filter}` : ""
      }`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.error || "Failed to fetch notifications");
      }
    } catch (err) {
      setError("An error occurred while fetching notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReservation = async (reservationId, status) => {
    try {
      const response = await fetch("/api/reservation/approve", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          status,
          restaurant_id: restaurantId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh notifications after approval
        fetchNotifications();
        alert(data.message);
      } else {
        alert(data.error || "Failed to update reservation");
      }
    } catch (err) {
      alert("An error occurred");
      console.error(err);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch("/api/reservation/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_id: notificationId,
          status: "sent",
        }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Reservation Notifications
        </h1>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "pending"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("sent")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "sent"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Read
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">No notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const reservation = notification.reservations;
            const guest = reservation?.guests;

            return (
              <div
                key={notification.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {reservation && getStatusBadge(reservation.status)}
                </div>

                <p className="text-gray-700 mb-4">{notification.message}</p>

                {guest && reservation && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Guest Name
                        </p>
                        <p className="text-gray-900">{guest.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Contact
                        </p>
                        <p className="text-gray-900">{guest.email}</p>
                        <p className="text-gray-900">{guest.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Date & Time
                        </p>
                        <p className="text-gray-900">
                          {reservation.reservation_date} at{" "}
                          {reservation.reservation_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Guest Count
                        </p>
                        <p className="text-gray-900">
                          {reservation.guest_count} guests
                        </p>
                      </div>
                      {guest.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-600">
                            Special Requests
                          </p>
                          <p className="text-gray-900">{guest.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {reservation && reservation.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleApproveReservation(reservation.id, "approved")
                        }
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleApproveReservation(reservation.id, "rejected")
                        }
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {notification.status === "pending" && (
                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RestaurantNotificationsPanel;
