import { isValidEmail, validateUsername } from "../validateForm";
import { checkPasswordStrength } from "../validatePwd";

// Validation functions that integrate with existing validators
export const validators = {
  email: (value) => {
    if (!value) return "Email is required";
    return isValidEmail(value) ? null : "Please enter a valid email address";
  },
  password: (value) => {
    if (!value) return "Password is required";
    const strength = checkPasswordStrength(value);
    if (strength.score < 2) return "Password is too weak";
    return null;
  },
  confirmPassword: (value, formData) => {
    if (!value) return "Please confirm your password";
    return value === formData.password ? null : "Passwords do not match";
  },
  username: (value) => {
    return validateUsername(value);
  },
  required: (value) => {
    return value && value.trim() ? null : "This field is required";
  },
  birthDate: (value) => {
    if (!value || !value.trim()) return null; // Optional field

    // Check if it's a year only (YYYY)
    const yearOnlyRegex = /^\d{4}$/;
    if (yearOnlyRegex.test(value)) {
      const year = parseInt(value);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        return "Please enter a valid year between 1900 and current year";
      }
      return null;
    }

    // Check if it's a full date (YYYY-MM-DD)
    const fullDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (fullDateRegex.test(value)) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return "Please enter a valid date";
      }
      return null;
    }

    return "Please enter a year (e.g., 1990) or full date (YYYY-MM-DD)";
  },
};

export const commonFields = {
  email: {
    type: "email",
    required: true,
    placeholder: "Enter your email",
    autoComplete: "email",
    icon: "email",
    validation: validators.email,
  },
  password: {
    type: "password",
    required: true,
    placeholder: "Enter your password",
    autoComplete: "current-password",
    icon: "lock",
  },
  confirmPassword: {
    type: "password",
    required: true,
    placeholder: "Confirm your password",
    autoComplete: "new-password",
    icon: "lock",
  },
  userName: {
    type: "text",
    required: true,
    placeholder: "Enter your username",
    autoComplete: "username",
    icon: "person",
    validation: validators.username,
  },
  firstName: {
    type: "text",
    required: false,
    placeholder: "Enter your first name",
    autoComplete: "given-name",
  },
  lastName: {
    type: "text",
    required: false,
    placeholder: "Enter your last name",
    autoComplete: "family-name",
  },
  birthDate: {
    type: "date",
    required: false,
    autoComplete: "bday",
  },
  address: {
    type: "text",
    required: false,
    placeholder: "Enter your full address",
  },
  city: {
    type: "text",
    required: false,
    placeholder: "City",
  },
  state: {
    type: "text",
    required: false,
    placeholder: "State",
  },
  zipCode: {
    type: "text",
    required: false,
    placeholder: "ZIP Code",
  },
};

export const artistFields = {
  artist_image: {
    type: "image",
    required: true,
    label: "Artist Image",
    helpText: "Upload an image (max 2MB).",
  },
  name: {
    type: "text",
    required: true,
    placeholder: "Enter artist's full name",
  },
  stageName: {
    type: "text",
    required: false,
    placeholder: "Enter stage name (if has one)",
  },
  artistSlug: {
    type: "text",
    required: true,
    placeholder: "Enter artist slug (e.g. john-doe)",
  },

  desc: {
    type: "textarea",
    required: true,
    placeholder: "Brief description of the artist",
  },
  bio: {
    type: "textarea",
    required: false,
    placeholder: "Detailed biography of the artist",
  },
  label: {
    type: "additional",
    required: false,
    placeholder: "Enter record label or management",
  },
  birth: {
    type: "text",
    required: false,
    placeholder: "e.g., 1990 or 1990-05-15",
    validation: validators.birthDate,
  },
  genres: {
    type: "additional",
    required: true,
    placeholder: "Enter genre",
  },
  socialLinks: {
    type: "additional",
    required: true,
    placeholder: "Enter social media URL (e.g., https://instagram.com/artist)",
  },
};
