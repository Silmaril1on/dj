"use client";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/features/userSlice";


const useRecentlyViewed = (type, itemId) => {
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id || !itemId || !type) return;

    const trackView = async () => {
      try {
        const response = await fetch("/api/recently-viewed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            type: type,
            item_id: itemId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to track view:", error);
        }
      } catch (error) {
        console.error("Error tracking recently viewed:", error);
      }
    };

    // Debounce to avoid multiple calls
    const timeoutId = setTimeout(trackView, 1000);

    return () => clearTimeout(timeoutId);
  }, [user?.id, type, itemId]);
};

export default useRecentlyViewed;
