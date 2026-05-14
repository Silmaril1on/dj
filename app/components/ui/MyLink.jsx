import Link from "next/link";

const MyLink = ({
  href,
  text,
  icon,
  onClick,
  target,
  className = "",
  size = "md",
  color = "black",
  ariaLabel,
}) => {
  const sizeClasses = {
    sm: "text-sm min-h-10 px-3 py-2",
    md: "text-sm lg:text-base min-h-11 px-3 py-2",
  };

  const colorClasses = {
    red: "text-crimson/70 hover:text-crimson",
    chino: "text-chino/80 hover:text-chino",
    black: "text-gold/80 hover:text-gold",
  };

  const externalProps =
    target === "_blank" ? { rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={href}
      target={target}
      onClick={onClick}
      aria-label={ariaLabel || text}
      className={`inline-flex items-center justify-center gap-2 rounded-sm duration-300 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      {...externalProps}
    >
      {icon && (
        <span className="flex items-center justify-center text-base leading-none">
          {icon}
        </span>
      )}

      <span className="leading-none">{text}</span>
    </Link>
  );
};

export default MyLink;
