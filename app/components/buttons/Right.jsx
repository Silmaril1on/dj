import { FaCaretRight } from "react-icons/fa";

const Right = ({ className, onClick }) => {
    return (
        <button onClick={onClick} className={`${className} cursor-pointer border bg-black border-gold py-3 text-gold text-2xl pl-1 w-5 center brightness-80 hover:brightness-100 duration-300`}>
            <FaCaretRight />
        </button>
    )
}

export default Right