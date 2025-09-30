"use client"
import { useState } from 'react';
import PopUpBox from '@/app/components/containers/PopUpBox';
import NtfFooter from './NtfFooter';
import NtfHeader from './NtfHeader';
import NtfContent from './NtfContent';

const NotificationModal = ({
  isOpen,
  onClose,
  notifications,
  loading,
  error,
  fetchNotifications,
  onNotificationsUpdate,
  userId
}) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  return (
    <PopUpBox
      isOpen={isOpen && !isClosing}
      className="absolute top-full right-0 mt-3 w-98 bg-stone-800 shadow-xl border border-gold/30 z-50 *:p-3"
    >
      <NtfHeader onClose={onClose} setIsClosing={setIsClosing} />
      <NtfContent loading={loading} error={error} notifications={notifications} />
      <NtfFooter
        userId={userId}
        notifications={notifications}
        onNotificationsUpdate={onNotificationsUpdate}
        fetchNotifications={fetchNotifications}
      />
    </PopUpBox>
  );
};

export default NotificationModal;