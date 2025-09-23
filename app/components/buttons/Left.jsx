import { FaCaretLeft } from "react-icons/fa";

const Left = ({ className, onClick }) => {
    return (
        <button onClick={onClick} className={`${className} cursor-pointer border bg-black border-gold text-gold py-3 text-2xl pr-1 w-5 center hover:brightness-100 duration-300`}>
            <FaCaretLeft />
        </button>
    )
}

export default Left