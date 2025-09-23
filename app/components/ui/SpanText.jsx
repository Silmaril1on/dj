import React from 'react'

const SpanText = ({
    text,
    icon,
    className = "",
    font = "primary",
    color = "default",
    size = "sm"
}) => {
    const fontClasses = {
        primary: "primary",
        secondary: "secondary"
    }

    const colorClasses = {
        default: "text-gold",
        crimson: "text-crimson",
        gold: "text-gold",
        chino: "text-chino"
    }

    const sizeClasses = {
        xs: "text-[11px]",
        sm: "text-[15px]",
        md: "text-[20px]",
    }

    const baseClasses = "text-[10px]"
    const fontClass = fontClasses[font] || fontClasses.secondary
    const colorClass = colorClasses[color] || colorClasses.default

    return (
        <h6 className={`${baseClasses} ${sizeClasses[size]} ${fontClass} ${colorClass} ${className} center gap-1`}>
            {icon && <span>{icon}</span>}
            {text}
        </h6>
    )
}

export default SpanText