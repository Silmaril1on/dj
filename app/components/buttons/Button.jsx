"use client"
import { MAIN_CLIP, NO_CLIP, useHover } from "@/app/lib/hooks/useHoverClipPath"
import { useSelector } from "react-redux"
import { selectIsDarkMode } from "@/app/features/modalSlice"
import Link from "next/link"
import Spinner from "../ui/Spinner"

const Button = ({
    text,
    icon,
    loading,
    onClick,
    href,
    size,
    type = "button",
    className = "",
    disabled = false,
}) => {
    const isDarkMode = useSelector(selectIsDarkMode)

    const { overlayRef, initialClipPath, onMouseEnter, onMouseLeave } = useHover({
        from: NO_CLIP,
        to: MAIN_CLIP,
        options: { duration: 0.3, ease: "easeInOut" },
    })

    const isBold = !isDarkMode

    // Determine button colors based on type
    let baseBg, overlayBg
    if (type === "success") {
        baseBg = isBold ? "bg-green-600 text-white" : "bg-green-600/30 text-green-500 font-bold uppercase"
        overlayBg = isBold ? "bg-black/70 text-green-400" : "bg-green-600 text-white"
    } else if (type === "remove") {
        baseBg = isBold ? "bg-red-600 text-white" : "bg-red-600/30 text-red-600"
        overlayBg = isBold ? "bg-black/70 text-red-400" : "bg-red-600 text-white"
    } else {
        baseBg = isBold ? "bg-gold text-black" : "bg-gold/30 text-gold"
        overlayBg = isBold ? "bg-black/70 text-gold" : "bg-gold text-black"
    }

    // Determine border color based on type
    const borderColor = type === "success" ? "border-green-600" :
        type === "remove" ? "border-red-600" :
            "border-gold"

    const baseClasses = `relative ${size === "small" ? "px-2 py-1 text-xs" : "px-4 py-1 text-base"} flex items-center justify-center 
     border ${borderColor} gap-1
    ${baseBg} 
    ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} 
    ${className}`

    const content = (
        <>
            {loading ? <Spinner /> : text}
            {icon && !loading ? icon : null}
            {!loading && (
                <div
                    ref={overlayRef}
                    style={{ clipPath: initialClipPath }}
                    className={`absolute inset-0 flex items-center justify-center gap-1 ${overlayBg}`}
                >
                    {text}
                    {icon && <span>{icon}</span>}
                </div>
            )}
        </>
    )

    if (href) {
        return (
            <Link
                href={href}
                className={baseClasses}
                onMouseEnter={!loading ? onMouseEnter : undefined}
                onMouseLeave={!loading ? onMouseLeave : undefined}
                aria-busy={loading}
            >
                {content}
            </Link>
        )
    }

    return (
        <button
            type={type}
            onClick={onClick}
            aria-busy={loading}
            disabled={disabled || loading}
            onMouseEnter={!loading ? onMouseEnter : undefined}
            onMouseLeave={!loading ? onMouseLeave : undefined}
            className={baseClasses}
        >
            {content}
        </button>
    )
}

export default Button
