const MAX_EMAIL_LENGTH = 150;
const personNamePattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePersonName(value) {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim().normalize("NFC");
  if (
    name.length < 2 ||
    name.length > 60 ||
    !personNamePattern.test(name)
  ) {
    return null;
  }

  return name;
}

function normalizeEmail(value) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  if (
    email.length > MAX_EMAIL_LENGTH ||
    !emailPattern.test(email)
  ) {
    return null;
  }

  return email;
}

module.exports = {
  normalizePersonName,
  normalizeEmail,
};
