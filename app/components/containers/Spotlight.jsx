"use client";
import { useEffect, useRef, useState } from "react";

const Spotlight = ({ children, className }) => {
    const btnRef = useRef(null);
    const spanRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (spanRef.current && btnRef.current) {
                const { left, top, width, height } =
                    btnRef.current.getBoundingClientRect();
                const mouseX = e.clientX - left;
                const mouseY = e.clientY - top;
                const posX = (mouseX / width) * 100;
                const posY = (mouseY / height) * 100;
                spanRef.current.style.left = `${posX}%`;
                spanRef.current.style.top = `${posY}%`;
            }
        };

        const handleMouseEnter = () => {
            setIsHovered(true);
        };

        const handleMouseLeave = () => {
            setIsHovered(false);
        };

        const currentBtnRef = btnRef.current;

        currentBtnRef.addEventListener("mousemove", handleMouseMove);
        currentBtnRef.addEventListener("mouseenter", handleMouseEnter);
        currentBtnRef.addEventListener("mouseleave", handleMouseLeave);
        return () => {
            currentBtnRef.removeEventListener("mousemove", handleMouseMove);
            currentBtnRef.removeEventListener("mouseenter", handleMouseEnter);
            currentBtnRef.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <div
            ref={btnRef}
            className={className}
            style={{
                position: "relative",
                overflow: "hidden",
            }}
        >
            {children}
            {isHovered && (
                <span
                    ref={spanRef}
                    className="absolute pointer-events-none  h-full w-[35%] rounded-full bg-gold/50 blur-[110px] top-1/2 left-1/2 -translate-x-1/2 z-0 -translate-y-1/2"
                ></span>
            )}
        </div>
    );
};

export default Spotlight;