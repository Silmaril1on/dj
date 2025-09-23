
const Icon = ({ icon, size = "sm", color = "gold", className, onClick, onMouseEnter, onMouseLeave, text }) => {

    const sizeClasses = {
        xs: "h-7 w-7 text-lg",
        sm: "h-9 w-9 text-xl",
        md: "w-12 h-12 text-2xl",
        lg: "w-16 h-16 text-4xl",
    };

    const colorClasses = {
        gold: "text-gold bg-gold/20 hover:bg-gold/30",
        emperor: "text-emperor/70 hover:text-emperor bg-emperor/20 hover:bg-emperor/40",
        crimson: "text-crimson/70 hover:text-crimson bg-crimson/20 hover:bg-crimson/40",
        blue: "text-blue/70 hover:text-blue bg-blue/20 hover:bg-blue/40",
        violet: "text-violet/70 hover:text-violet bg-violet/20 hover:bg-violet/40",
        pink: "text-pink/70 hover:text-pink bg-pink/20 hover:bg-pink/40",
        chino: "text-chino/70 hover:text-chino bg-chino/20 hover:bg-chino/40",
        choco: "text-choco/70 hover:text-choco bg-choco/20 hover:bg-choco/40",
        simple: "text-emperor/70 hover:text-emperor dark:text-gold/70 dark:hover:text-gold",

    };

    const containerSize = sizeClasses[size] || sizeClasses.lg;
    const containerColor = colorClasses[color] || colorClasses.blue;

    return (
        <div
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`${containerSize} ${containerColor} ${className}  cursor-pointer duration-500 flex items-center justify-center rounded-full p-2`}
        >
            {icon}
        </div>

    )
}

export default Icon