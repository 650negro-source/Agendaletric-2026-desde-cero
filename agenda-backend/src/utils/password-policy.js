const commonPasswordFragments = [
  "password",
  "qwerty",
  "admin",
  "welcome",
  "letmein",
  "iloveyou",
  "monkey",
  "dragon",
  "sunshine",
  "123456",
  "agendaletric",
];

function getPasswordError(password) {
  if (typeof password !== "string") {
    return "Password must be between 10 and 64 characters";
  }

  const length = Array.from(password).length;
  if (length < 10 || length > 64 || Buffer.byteLength(password, "utf8") > 72) {
    return "Password must be between 10 and 64 characters";
  }

  if (/\s/u.test(password)) {
    return "Password must not contain spaces";
  }

  if (
    !/\p{Lu}/u.test(password) ||
    !/\p{Ll}/u.test(password) ||
    !/\p{N}/u.test(password) ||
    !/[^\p{L}\p{N}\s]/u.test(password)
  ) {
    return "Password must include uppercase, lowercase, number, and symbol";
  }

  const normalizedPassword = password.toLowerCase();
  if (commonPasswordFragments.some((fragment) => normalizedPassword.includes(fragment))) {
    return "Choose a less common password";
  }

  return null;
}

function getPasswordConfirmationError(password, confirmation) {
  return password === confirmation ? null : "Passwords do not match";
}

module.exports = {
  getPasswordError,
  getPasswordConfirmationError,
};
