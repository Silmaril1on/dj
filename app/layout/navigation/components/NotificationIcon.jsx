"use client";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoMdNotificationsOutline } from "react-icons/io";
import Icon from "@/app/components/ui/Icon";
import useClick from "@/app/lib/hooks/useClick";
import NotificationModal from "./notificationIcon/NotificationModal";
import { selectUser } from "@/app/features/userSlice";
import StatusDot from "@/app/components/ui/StatusDot";
import {
  fetchNotificationsThunk,
  invalidateNotifications,
  markAllReadLocally,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
  resetNotifications,
} from "@/app/features/notificationsSlice";

const NotificationIcon = () => {
  const [isClicked, { toggleClick, closeClick }, clickRef] = useClick();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);

  // Fetch once when user becomes available.
  // The thunk's `condition` guard prevents duplicate fetches from multiple
  // instances of this component (desktop nav + mobile nav).
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchNotificationsThunk(user.id));
    } else {
      dispatch(resetNotifications());
    }
  }, [user?.id, dispatch]);

  const fetchNotifications = () => {
    if (user?.id) {
      dispatch(invalidateNotifications());
      dispatch(fetchNotificationsThunk(user.id));
    }
  };

  const handleNotificationsUpdate = () => {
    dispatch(markAllReadLocally());
  };

  const handleClick = () => toggleClick();
  const handleClose = () => closeClick();

  const hasUnread = notifications.some((n) => n.read === false);

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

export default NotificationIcon;
