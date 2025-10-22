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

  return (
    <PopUpBox
      isOpen={isOpen && !isClosing}
      className="absolute bottom-2.5 lg:bottom-auto lg:top-full md:top-full scale-80 md:scale-100 -right-28 lg:right-0 lg:mt-3 w-98 bg-stone-800 shadow-xl border h-[350px] border-gold/30 z-50 *:p-3 flex flex-col"
    >
      <NtfHeader onClose={onClose} setIsClosing={setIsClosing} />
      <div className="flex-1 overflow-y-auto">
        <NtfContent loading={loading} error={error} notifications={notifications} />
       </div>
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