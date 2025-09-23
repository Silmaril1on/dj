import Link from "next/link";

const MyLink = ({
    href,
    text,
    icon,
    onClick,
    target,
    className = "",
    size = "md",
    color = "black"
}) => {
    const sizeClasses = {
        sm: "text-sm gap-1",
        md: "text-base gap-2",
    };

    const colorClasses = {
        red: "text-crimson/70 hover:text-crimson",
        chino: "text-chino/80 hover:text-chino",
        black: "  text-gold/80 hover:text-gold",
    };

    return (
        <Link
            target={target}
            onClick={onClick}
            href={href}
            className={`${className} center duration-300 w-fit ${sizeClasses[size]} ${colorClasses[color]}`}
        >
            <span className="flex items-center">{icon}</span>
            <span>{text}</span>
        </Link>
    );
};

export default MyLink;
