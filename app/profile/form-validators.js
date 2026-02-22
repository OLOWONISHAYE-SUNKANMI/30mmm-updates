// Validation functions - each returns an error message or empty string if valid
export const validateFirstName = (name) => {
  if (!name.trim()) return "First name is required";
  if (name.trim().length < 2) return "First name must be at least 2 characters";
  return "";
};

export const validateLastName = (name) => {
  if (!name.trim()) return "Last name is required";
  if (name.trim().length < 2) return "Last name must be at least 2 characters";
  return "";
};

export const validateBirthdate = (date) => {
  if (!date) return "Birthdate is required";

  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  if (birthDate > today) return "Birthdate cannot be in the future";
  if (age < 18) return "Must be at least 18 years old";
  if (age > 120) return "Please enter a valid birthdate";

  return "";
};

export const validateMaritalStatus = (status) => {
  if (!status) return "Please select your marital status";
  return "";
};

export const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";

  return "";
};

export const validateTelephone = (phone) => {
  if (!phone.trim()) return "Phone number is required";

  // Remove all non-digits to check length
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 10) return "Phone number must be at least 10 digits";

  return "";
};

export const validateAddress = (address) => {
  if (!address.trim()) return "Address is required";
  if (address.trim().length < 5) return "Please enter a complete address";
  return "";
};

export const validateCity = (city) => {
  if (!city.trim()) return "City is required";
  return "";
};

export const validateState = (state) => {
  if (!state.trim()) return "State is required";
  return "";
};

export const validateZipcode = (zipcode) => {
  if (!zipcode.trim()) return "Zipcode is required";
  // Allow 5-6 digit zipcodes and 5+4 format
  if (!/^\d{5,6}(-\d{4})?$/.test(zipcode)) return "Please enter a valid zipcode";
  return "";
};
