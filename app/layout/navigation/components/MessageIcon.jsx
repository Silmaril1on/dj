"use client"
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AiOutlineMail } from "react-icons/ai";
import Icon from "@/app/components/ui/Icon";
import useClick from "@/app/lib/hooks/useClick";
import BookingRequestModal from "./messageIcon/BookingRequestModal";
import { selectUser } from "@/app/features/userSlice";
import StatusDot from "@/app/components/ui/StatusDot";

const MessageIcon = () => {
  const [isClicked, { toggleClick, closeClick }, clickRef] = useClick();
  const user = useSelector(selectUser);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch booking requests for both receiver and requester
  const fetchBookingRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/booking-requests/user-requests?user_id=${user.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch booking requests");
      setBookingRequests(data.bookingRequests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingRequestsUpdate = () => {
    setBookingRequests(prev =>
      prev.map(request => ({
        ...request,
        status: request.status === "unopened" ? "opened" : request.status
      }))
    );
  };

  useEffect(() => {
    if (user?.id) {
      fetchBookingRequests();
    }
  }, [user?.id]);

  const handleClick = () => {
    toggleClick();
  };

  const handleClose = () => {
    closeClick();
  };

  const hasUnread = bookingRequests.some(request => 
    request.status === "unopened" || 
    (request.response === "pending" && request.unread_messages > 0)
  );

  return (
    <div className="relative" ref={clickRef}>
      <div>
        <Icon
          onClick={handleClick}
          icon={<AiOutlineMail />}
          color="gold"
        />
        <StatusDot hasUnread={hasUnread} />
      </div>
      <BookingRequestModal
        isOpen={isClicked}
        onClose={handleClose}
        bookingRequests={bookingRequests}
        loading={loading}
        error={error}
        fetchBookingRequests={fetchBookingRequests}
        onBookingRequestsUpdate={handleBookingRequestsUpdate}
        userId={user?.id}
      />
    </div>
  );
};

export default MessageIcon;
