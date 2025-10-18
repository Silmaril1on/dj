"use client";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";
import { capitalizeFirst, formatTime } from "@/app/helpers/utils";
import SpanText from "@/app/components/ui/SpanText";
import ProfilePicture from "@/app/components/materials/ProfilePicture";
import Button from "@/app/components/buttons/Button";
import Title from "@/app/components/ui/Title";
import UpdateBooking from "./UpdateBooking";
import Image from "next/image";

const BookingChat = ({ bookingId, bookingData: initialBookingData, onBookingUpdate }) => {
  const user = useSelector(selectUser);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [bookingData, setBookingData] = useState(initialBookingData);

  // Handle booking data updates
  const handleBookingUpdate = (updatedBooking) => {
    setBookingData(prevData => ({
      ...prevData,
      ...updatedBooking
    }));
    
    // Pass update to parent component
    if (onBookingUpdate) {
      onBookingUpdate(updatedBooking);
    }
  };

  // Fetch chat messages
  const fetchMessages = async () => {
    if (!bookingId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `/api/booking-requests/chat?booking_id=${bookingId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        console.log("Messages received:", data.messages?.length || 0);
        setMessages(data.messages || []);
      } else {
        setError(data.error || "Failed to fetch messages");
      }
    } catch (error) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Send new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !bookingId) {
      return;
    }

    setSending(true);
    try {
      const payload = {
        message: newMessage.trim(),
        booking_id: bookingId,
      };

      const response = await fetch("/api/booking-requests/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch (error) {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchMessages();
    }
  }, [bookingId]);

  // Check if there are messages to show chat
  const shouldShowChat =
    bookingData?.response === "pending" || messages.length > 0;

  if (!shouldShowChat) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-stone-950 rounded-sm p-4 mt-5">
        <div className="flex items-center justify-center py-8">
          <SpanText text="Loading conversation..." className="text-stone-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-950 rounded-sm p-4 space-y-4">
      {/* Chat Header */}
      <div className="border-b border-gold/30 pb-3">
        <Title text="Booking Discussion" size="md" />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded p-3">
          <SpanText text={error} className="text-red-400" />
        </div>
      )}

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto pr-3 relative">
        {/* Background Logo */}
        <div className="w-52 h-52 overflow-hidden z-0 opacity-10 blur-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sepia rotate-45">
          <Image
            src="/assets/elivagar-logo.png"
            className="w-full h-full object-contain scale-200 "
            alt="Elivagar Logo"
            width={128}
            height={128}
          />
        </div>

        {/* Messages */}
        <div className="space-y-3 py-2">
          {messages.length === 0 ? (
            <div className="text-center py-8 relative z-10">
              <SpanText
                text="No messages yet. Start the conversation!"
                className="text-stone-400"
              />
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex flex-col relative z-10 ${
                    isCurrentUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] flex items-center gap-2 ${
                      isCurrentUser ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`p-3 text-cream ${
                        isCurrentUser ? "bg-gold/30" : "bg-cream/20"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-secondary text-xs">
                        {capitalizeFirst(message.message)}
                      </div>
                    </div>
                    <div>
                      <ProfilePicture
                        avatar_url={message.sender?.user_avatar}
                        size="xs"
                      />
                    </div>
                  </div>
                  <SpanText
                    text={formatTime(message.created_at)}
                    size="xs"
                    className="text-gold mt-1"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="space-y-3">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          rows={3}
          disabled={sending}
        />
        <div className="w-full flex justify-between items-center">
          <Button
            type="submit"
            text={sending ? "Sending..." : "Send Message"}
            disabled={!newMessage.trim() || sending}
            loading={sending}
          />
        </div>
          <UpdateBooking 
            bookingId={bookingId}
            bookingData={bookingData}
            user={user}
            onBookingUpdate={handleBookingUpdate}
          />
      </form>
    </div>
  );
};

export default BookingChat;
