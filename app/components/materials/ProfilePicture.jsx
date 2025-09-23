import Image from "next/image";
import Icon from "../ui/Icon";
import { MdPerson2 } from "react-icons/md";

const ProfilePicture = ({ avatar_url, type = "icon" }) => {
    const typeClasses = {
        icon: "w-8 h-8 rounded-sm",
        avatar: "w-33 h-33 rounded-full border-5 border-gold/80"
    };

    return (
        <div
            className={`${typeClasses[type]} overflow-hidden `}
        >
            {avatar_url ? <Image
                className="w-full h-full object-cover brightness-80 hover:brightness-100 duration-300"
                src={avatar_url}
                alt="Profile Picture"
                width={100}
                height={100}
            /> : <Icon icon={<MdPerson2 />} color="gold" />}
        </div>
    );
};

export default ProfilePicture;
