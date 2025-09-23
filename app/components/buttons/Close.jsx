import { IoMdClose } from "react-icons/io";

const Close = ({ onClick, className }) => {
  return (
    <div onClick={onClick} className={`${className} cursor-pointer text-gold hover:rotate-90 duration-300 text-xl`}>
      <IoMdClose />
    </div>
  )
}

export default Close