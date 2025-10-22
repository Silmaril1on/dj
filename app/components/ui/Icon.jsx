
const Icon = ({ icon, size = "sm", color = "gold", className, onClick, onMouseEnter, onMouseLeave, text }) => {

    const sizeClasses = {
        xs: "h-7 w-7 text-lg",
        sm: "h-9 w-9 text-xl",
        md: "w-12 h-12 text-2xl",
        lg: "w-16 h-16 text-4xl",
    };

    const colorClasses = {
        gold: "text-gold bg-gold/20 hover:bg-gold/30",
        crimson: "text-crimson/70 hover:text-crimson bg-crimson/20 hover:bg-crimson/40",
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