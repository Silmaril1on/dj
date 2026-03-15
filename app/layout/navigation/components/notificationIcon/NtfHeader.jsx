import { IoMdClose } from "react-icons/io";
import Title from "@/app/components/ui/Title";

const NtfHeader = ({ setIsClosing, onClose }) => {
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  return (
    <div className="flex items-center justify-between border-b border-gold/30">
      <Title text="Notifications" />
      <div
        onClick={handleClose}
        className="cursor-pointer text-gold hover:rotate-90 duration-300 text-xl"
      >
        <IoMdClose />
      </div>
    </div>
  );
};

export default NtfHeader;
