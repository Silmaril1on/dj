// Form validation utilities
export const validateSignupForm = (formData, passwordStrength) => {
  const errors = [];

  // Email validation
  if (!formData.email) {
    errors.push({ message: "Email is required", type: "error" });
  } else if (!isValidEmail(formData.email)) {
    errors.push({
      message: "Please enter a valid email address",
      type: "error",
    });
  }

  // Username validation
  if (!formData.userName) {
    errors.push({ message: "Username is required", type: "error" });
  } else if (formData.userName.length < 3) {
    errors.push({
      message: "Username must be at least 3 characters",
      type: "error",
    });
  } else if (!/^[a-zA-Z0-9_.]+$/.test(formData.userName)) {
    errors.push({
      message:
        "Username can only contain letters, numbers, underscores, and dots",
      type: "error",
    });
  }

  // Password validation
  if (!formData.password) {
    errors.push({ message: "Password is required", type: "error" });
  } else if (passwordStrength.score < 2) {
    errors.push({ message: "Password is too weak", type: "error" });
  }

  // Confirm password validation
  if (!formData.confirmPassword) {
    errors.push({ message: "Please confirm your password", type: "error" });
  } else if (formData.password !== formData.confirmPassword) {
    errors.push({ message: "Passwords do not match", type: "error" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Email validation helper
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation helper (used by formFields.js)
export const validateUsername = (username) => {
  if (!username) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be less than 20 characters";
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
    return "Username can only contain letters, numbers, underscores, and dots";
  }
  return null;
};
