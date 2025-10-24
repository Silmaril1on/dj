import Button from '@/app/components/buttons/Button'
import FlexBox from '@/app/components/containers/FlexBox'

const NtfFooter = ({ userId, notifications, onNotificationsUpdate }) => {

  const handleMarkAllAsRead = async () => {
    if (!userId || !notifications || notifications.length === 0) return;
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'mark-all-read'
        }),
      });

      if (response.ok) {
        if (onNotificationsUpdate) {
          onNotificationsUpdate();
        }
      } else {
        console.error('Failed to mark notifications as read');
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  return (
    <FlexBox type="row-between" className="border-t border-gold/30">
      <Button
        size="small"
        type="bold"
        text="Mark all as read"
        onClick={handleMarkAllAsRead}
        disabled={!notifications || notifications.length === 0}
      />
      {/* <Button size="small" type="bold" text="View All" /> */}
    </FlexBox>
  )
}

export default NtfFooter