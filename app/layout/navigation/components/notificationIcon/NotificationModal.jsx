"use client"
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '@/app/features/userSlice';
import PopUpBox from '@/app/components/containers/PopUpBox';
import NtfFooter from './NtfFooter';
import NtfHeader from './NtfHeader';
import NtfContent from './NtfContent';

const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const user = useSelector(selectUser);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notifications?user_id=${user.id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsUpdate = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({
        ...notification,
        read: true
      }))
    );
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications();
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  return (
    <PopUpBox
      isOpen={isOpen && !isClosing}
      className="absolute top-full right-0 mt-3 w-80 bg-stone-800 shadow-xl border border-gold/30 z-50 *:p-3"
    >
      <NtfHeader onClose={onClose} setIsClosing={setIsClosing} />
      <NtfContent loading={loading} error={error} notifications={notifications} />
      <NtfFooter
        userId={user?.id}
        notifications={notifications}
        onNotificationsUpdate={handleNotificationsUpdate}
      />
    </PopUpBox>
  );
};

export default NotificationModal;