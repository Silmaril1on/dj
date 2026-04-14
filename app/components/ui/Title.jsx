const Title = ({
  text,
  size = "",
  color = "gold",
  className = "",
  onClick,
  onMouseEnter,
  onMouseLeave,
  showLive = true,
}) => {
  const sizeClasses = {
    xs: "text-sm md:text-base",
    sm: "text-lg md:text-xl",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl",
    xl: "text-3xl md:text-4xl",
    xxl: "text-3xl md:text-6xl",
  };

  const colorClasses = {
    gold: "text-gold",
    chino: "text-chino",
    emperor: "text-emperor",
    crimson: "text-crimson",
    violet: "text-violet",
    black: "text-black",
    cream: "text-cream",
  };

  const titleSize = sizeClasses[size] || sizeClasses.md;
  const titleColor = colorClasses[color] || colorClasses.default;

  const Badge = ({ label }) => (
    <div
      className={`text-[7px] md:text-[10px] uppercase ${titleColor} self-start `}
    >
      <span>{label}</span>
    </div>
  );

  const baseText = showLive ? text.replace(/\s+live$/i, "").trim() : text;
  const hasLive = showLive && /\s+live$/i.test(text);

  // Split on B2B (case-insensitive), keeping surrounding spaces trimmed
  const b2bParts = baseText.split(/\s+b2b\s+/i);
  const hasB2B = b2bParts.length > 1;

  return (
    <div className="flex gap-1 flex-wrap">
      {b2bParts.map((part, i) => (
        <div key={i} className="flex gap-1">
          <h1
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`${titleSize} ${titleColor} ${className} capitalize font-bold text-center w-fit`}
          >
            {part}
          </h1>
          {hasB2B && i === 0 && <Badge label="B2B" />}
        </div>
      ))}
      {hasLive && <Badge label="LIVE" />}
    </div>
  );
};

export default Title;
