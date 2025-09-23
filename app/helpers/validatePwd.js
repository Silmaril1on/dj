// Password strength checker
export const checkPasswordStrength = (password) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("At least 8 characters");
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Contains a number");
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Contains a special character");
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Contains uppercase and lowercase letters");
  }

  let color = "red";
  if (score >= 3) color = "green";
  else if (score >= 2) color = "yellow";

  return {
    score,
    feedback: feedback.length > 0 ? feedback : "Strong password!",
    color,
  };
};

// Get strength text based on score
export const getStrengthText = (score) => {
  if (score === 0) return "Very Weak";
  if (score === 1) return "Weak";
  if (score === 2) return "Fair";
  if (score === 3) return "Good";
  return "Strong";
};

// Validate password meets minimum requirements
export const isPasswordValid = (password) => {
  const strength = checkPasswordStrength(password);
  return strength.score >= 2; // Reduced from 3 to 2 for less strict validation
};
