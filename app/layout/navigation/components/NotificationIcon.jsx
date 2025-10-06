"use client"
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { IoMdNotificationsOutline } from "react-icons/io";
import Icon from "@/app/components/ui/Icon";
import useClick from "@/app/lib/hooks/useClick";
import NotificationModal from "./notificationIcon/NotificationModal";
import { selectUser } from "@/app/features/userSlice";
import StatusDot from "@/app/components/ui/StatusDot";

const NotificationIcon = () => {
  const [isClicked, { toggleClick, closeClick }, clickRef] = useClick();
  const user = useSelector(selectUser);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notifications?user_id=${user.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch notifications");
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsUpdate = () => {
    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        read: true
      }))
    );
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const handleClick = () => {
    toggleClick();
  };

  const handleClose = () => {
    closeClick();
  };

  const hasUnread = notifications.some(n => n.read === false);

  return (
    <div className="relative" ref={clickRef}>
      <div>
        <Icon
          onClick={handleClick}
          icon={<IoMdNotificationsOutline />}
          color="gold"
        />
        <StatusDot hasUnread={hasUnread} />
      </div>
      <NotificationModal
        isOpen={isClicked}
        onClose={handleClose}
        notifications={notifications}
        loading={loading}
        error={error}
        fetchNotifications={fetchNotifications}
        onNotificationsUpdate={handleNotificationsUpdate}
        userId={user?.id}
      />
    </div>
  );
};

export default NotificationIcon