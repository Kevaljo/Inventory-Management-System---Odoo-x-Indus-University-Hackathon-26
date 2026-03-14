/**
 * otpGenerator.js
 * Strong alphanumeric OTP generator with complexity guarantee
 */

const generateStrongOTP = (length = 8) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$&';
  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one character from each set
  let otpArray = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)]
  ];

  // Fill remaining positions
  for (let i = otpArray.length; i < length; i++) {
    otpArray.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle using Fisher-Yates via random comparator
  otpArray = otpArray
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  return otpArray.join('');
};

const getOTPStrength = (otp) => {
  const hasUpper = /[A-Z]/.test(otp);
  const hasLower = /[a-z]/.test(otp);
  const hasNumber = /[0-9]/.test(otp);
  const hasSpecial = /[@#$&]/.test(otp);

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let label;
  if (score <= 2) {
    label = 'Weak';
  } else if (score === 3) {
    label = 'Medium';
  } else {
    label = 'Strong';
  }

  return {
    score,
    label,
    details: { hasUpper, hasLower, hasNumber, hasSpecial }
  };
};

module.exports = { generateStrongOTP, getOTPStrength };
