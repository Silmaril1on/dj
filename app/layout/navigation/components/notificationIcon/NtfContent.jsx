import FlexBox from "@/app/components/containers/FlexBox";
import Paragraph from "@/app/components/ui/Paragraph";
import SpanText from "@/app/components/ui/SpanText";
import Dot from "@/app/components/ui/Dot";
import { formatTime } from "@/app/helpers/utils";
import { IoIosNotifications } from "react-icons/io";
import { useRouter } from "next/navigation";

const NtfContent = ({ loading, error, notifications, onClose }) => {
  return (
    <div className="max-h-96 overflow-y-auto">
      {error && <Paragraph text={error} />}
      {!loading && (
        <NotificationItem notifications={notifications} onClose={onClose} />
      )}
    </div>
  );
};

const getNotificationHref = (notification) => {
  if (!notification) return null;

  if (notification.event_id) {
    return `/events/${notification.event_id}`;
  }

  if (
    typeof notification.type === "string" &&
    notification.type.startsWith("reminder:event:")
  ) {
    const eventId = notification.type.split(":")[2];
    return eventId ? `/events/${eventId}` : null;
  }

  if (
    typeof notification.title === "string" &&
    notification.title.startsWith("Event reminder::")
  ) {
    const eventId = notification.title.replace("Event reminder::", "").trim();
    return eventId ? `/events/${eventId}` : null;
  }

  return null;
};

const NotificationItem = ({ notifications, onClose }) => {
  const router = useRouter();

  const handleNotificationClick = (notification) => {
    const href = getNotificationHref(notification);
    if (!href) return;

    router.push(href);
    onClose?.();
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Paragraph>No notifications yet</Paragraph>
      </div>
    );
  }

  return (
    <div className="space-y-2 ">
      {notifications.map((notification) => {
        const href = getNotificationHref(notification);
        const isClickable = Boolean(href);

        return (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`flex items-center p-2 duration-300 bg-stone-900 ${isClickable ? "cursor-pointer hover:bg-black" : "cursor-default"}`}
          >
            <div className="flex-1 space-y-1">
              <Paragraph text={notification.message} />
              <FlexBox type="row-between">
                {isClickable ? (
                  <div className="flex gap-1 *:leading-none">
                    <SpanText
                      size="xs"
                      font="secondary"
                      text={formatTime(notification.created_at)}
                    />
                    <Dot />
                    <SpanText size="xs" font="secondary" text="Check Event" />
                  </div>
                ) : (
                  <SpanText
                    size="xs"
                    font="secondary"
                    text={formatTime(notification.created_at)}
                  />
                )}
                {!notification.read && (
                  <div className="flex items-center space-x-1 text-gold text-sm">
                    <IoIosNotifications />
                    <span className="text-xs">New</span>
                  </div>
                )}
              </FlexBox>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NtfContent;
