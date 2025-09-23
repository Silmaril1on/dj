const handleAuthError = (error) => {
  if (!error) return "An unknown error occurred";

  // Handle Supabase auth errors
  if (error.message) {
    const message = error.message.toLowerCase();

    if (message.includes("invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }

    if (message.includes("email not confirmed")) {
      return "Please check your email and confirm your account.";
    }

    if (message.includes("user already registered")) {
      return "An account with this email already exists.";
    }

    if (message.includes("password should be at least")) {
      return "Password is too short. Please use a stronger password.";
    }

    if (message.includes("invalid email")) {
      return "Please enter a valid email address.";
    }

    if (message.includes("too many requests")) {
      return "Too many attempts. Please try again later.";
    }

    if (message.includes("network")) {
      return "Network error. Please check your connection and try again.";
    }
  }

  // Handle HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Authentication failed. Please sign in again.";
      case 403:
        return "Access denied. You don't have permission for this action.";
      case 404:
        return "Resource not found.";
      case 409:
        return "Conflict. This resource already exists.";
      case 422:
        return "Validation error. Please check your input.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return "An error occurred. Please try again.";
    }
  }

  // Handle custom error messages
  if (typeof error === "string") {
    return error;
  }

  // Default fallback
  return "An unexpected error occurred. Please try again.";
};

export default handleAuthError;
