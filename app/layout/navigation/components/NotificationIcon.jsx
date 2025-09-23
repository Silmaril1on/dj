"use client"
import { BsSoundwave } from "react-icons/bs";
import Icon from "@/app/components/ui/Icon";
import useClick from "@/app/lib/hooks/useClick";
import NotificationModal from "./notificationIcon/NotificationModal";

const NotificationIcon = () => {
  const [isClicked, { toggleClick, closeClick }, clickRef] = useClick();

  const handleClick = () => {
    toggleClick();
  }

  const handleClose = () => {
    closeClick();
  }

  return (
    <div className="relative" ref={clickRef}>
      <div>
        <Icon onClick={handleClick} icon={<BsSoundwave />} color="gold" />
      </div>
      <NotificationModal
        isOpen={isClicked}
        onClose={handleClose}
      />
    </div>
  )
}

export default NotificationIcon