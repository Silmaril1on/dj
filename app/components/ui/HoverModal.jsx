import PopUpBox from '@/app/components/containers/PopUpBox';

const HoverModal = ({ text, className = "", isOpen }) => {
  return (
    <PopUpBox
      isOpen={isOpen}
      className={`${className} text-sm  text-gold bg-gold/40 px-3 rounded-sm pointer-events-none`}
      text={text}
    />
  );
};

export default HoverModal;