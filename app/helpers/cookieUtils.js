// Utility functions for handling cookies

export const getUserFromCookie = () => {
  if (typeof document === "undefined") return null; // Server-side

  const userCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("user_data="));

  if (!userCookie) return null;

  try {
    const userData = userCookie.split("=")[1];
    return JSON.parse(decodeURIComponent(userData));
  } catch (error) {
    console.error("Error parsing user cookie:", error);
    return null;
  }
};

export const setUserCookie = (userData) => {
  if (typeof document === "undefined") return; // Server-side

  const cookieValue = JSON.stringify(userData);
  const maxAge = 60 * 60 * 24 * 30; // 30 days

  document.cookie = `user_data=${encodeURIComponent(
    cookieValue
  )}; path=/; max-age=${maxAge}; samesite=lax; secure=${
    window.location.protocol === "https:"
  }`;
};

export const removeUserCookie = () => {
  if (typeof document === "undefined") return; // Server-side

  document.cookie =
    "user_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
};
