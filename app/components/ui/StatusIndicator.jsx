import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

const StatusIndicator = ({ status }) => {
    let icon, color, bgColor, borderColor, label;

    switch (status) {
        case "approved":
            icon = <FaCheckCircle className="w-4 h-4 text-green-500" />;
            color = "text-green-500";
            bgColor = "bg-green-500/20";
            borderColor = "border-green-500";
            label = "Approved";
            break;
        case "pending":
            icon = <FaClock className="w4 h-4 text-yellow-500" />;
            color = "text-yellow-500";
            bgColor = "bg-yellow-500/20";
            borderColor = "border-yellow-500";
            label = "Pending";
            break;
        case "declined":
            icon = <FaTimesCircle className="w-4 h-4 text-red-500" />;
            color = "text-red-500";
            bgColor = "bg-red-500/20";
            borderColor = "border-red-500";
            label = "Declined";
            break;
        default:
            icon = <FaClock className="w-4 h-4 text-gray-400" />;
            color = "text-gray-400";
            bgColor = "bg-gray-400/20";
            borderColor = "border-gray-400";
            label = "Unknown";
    }

    return (
        <div className={`flex items-center justify-center font-bold uppercase gap-2 px-3 py-1 border ${bgColor} ${borderColor}`}>
            <span className={color}>{label}</span>
            {icon}
        </div>
    );
};

export default StatusIndicator;
