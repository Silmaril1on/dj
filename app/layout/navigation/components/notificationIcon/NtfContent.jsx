import FlexBox from '@/app/components/containers/FlexBox'
import Paragraph from '@/app/components/ui/Paragraph'
import SpanText from '@/app/components/ui/SpanText'
import { formatTime } from '@/app/helpers/utils'
import { IoIosNotifications } from 'react-icons/io'

const NtfContent = ({ loading, error, notifications }) => {
  return (
    <div className="max-h-96 overflow-y-auto">
      {error && <Paragraph text={error} />}
      {!loading && <NotificationItem notifications={notifications} />}
    </div>
  )
}

const NotificationItem = ({ notifications }) => {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Paragraph>No notifications yet</Paragraph>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center p-3 cursor-pointer duration-300  hover:bg-black bg-stone-900 `}
        >
          <div className="flex-1 space-y-1">
            <Paragraph text={notification.message}
            />
            <FlexBox type="row-between">
              <SpanText
                size="xs"
                font="secondary"
                text={formatTime(notification.created_at)}
              />
              {!notification.read && (
                <div className="flex items-center space-x-1 text-gold text-sm">
                  <IoIosNotifications />
                  <span className="text-xs">New</span>
                </div>
              )}
            </FlexBox>
          </div>
        </div>
      ))}
    </div>
  )
}

export default NtfContent