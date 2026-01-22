import Link from "next/link";

const MyLink = ({
  href,
  text,
  icon,
  onClick,
  target,
  className = "center",
  size = "md",
  color = "black",
}) => {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-xs lg:text-base",
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
      className={`${className} gap-1 duration-300 center w-fit ${sizeClasses[size]} ${colorClasses[color]}`}
    >
      <span className="flex h-full items-center pb-1">{icon}</span>
      <span>{text}</span>
    </Link>
  );
};

export default MyLink;
