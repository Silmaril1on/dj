"use client";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";

export default function NavigationWrapper() {
    const pathname = usePathname();

    const isAuthRoute =
        pathname?.includes("/(routes)/(auth)") ||

        pathname === "/sign-in" ||
        pathname === "/sign-up" || 
        pathname === "/reset-password" ||
        pathname === "/reset-password/update-password" ||
        pathname === "/video";

    if (isAuthRoute) {
        return null;
    }

    return (
        <>
            <Navigation />
        </>
    );
}
