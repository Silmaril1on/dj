const Title = ({
    text,
    size = "",
    color = "gold",
    className = "",
    onClick,
    onMouseEnter,
    onMouseLeave,
    showLive = true 
}) => {
    const sizeClasses = {
        xs: "text-sm md:text-base",
        sm: "text-lg md:text-xl",
        md: "text-xl md:text-2xl",
        lg: "text-2xl md:text-3xl",
        xl: "text-3xl md:text-4xl",
        xxl: "text-3xl md:text-6xl",
    }

    const colorClasses = {
        gold: "text-gold",
        chino: "text-chino",
        emperor: "text-emperor",
        crimson: "text-crimson",
        violet: "text-violet",
        black: "text-black",
        cream: "text-cream",
    }

    const titleSize = sizeClasses[size] || sizeClasses.md
    const titleColor = colorClasses[color] || colorClasses.default

    const artistName = showLive ? text.replace(/\s+live$/i, '').trim() : text;
    const hasLive = showLive && /\s+live$/i.test(text);

    return (
        <div className="flex gap-1">
            <h1
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`${titleSize} ${titleColor} ${className} capitalize font-bold text-center w-fit`}
            >
                {artistName}
            </h1>
            {hasLive && (
                <div className={`text-sm uppercase ${className} ${titleColor}`}>
                    <span>LIVE</span>
                </div>
            )}
        </div>
    )
}

export default Title
