const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getPasswordError,
  getPasswordConfirmationError,
} = require("../src/utils/password-policy");

test("accepts a password that meets the documented policy", () => {
  assert.equal(getPasswordError("Abcdefg1!x"), null);
});

test("rejects passwords that are too short, contain spaces, or miss a character class", () => {
  assert.equal(getPasswordError("Abcdef1!x"), "Password must be between 10 and 64 characters");
  assert.equal(getPasswordError("Abc defg1!x"), "Password must not contain spaces");
  assert.equal(
    getPasswordError("abcdefg1!x"),
    "Password must include uppercase, lowercase, number, and symbol"
  );
});

test("rejects common passwords and values exceeding bcrypt's safe byte length", () => {
  assert.equal(getPasswordError("Password123!"), "Choose a less common password");
  assert.equal(
    getPasswordError(`A${"é".repeat(36)}1!`),
    "Password must be between 10 and 64 characters"
  );
});

test("password confirmation must match exactly", () => {
  assert.equal(getPasswordConfirmationError("Abcdefg1!x", "Abcdefg1!x"), null);
  assert.equal(
    getPasswordConfirmationError("Abcdefg1!x", "Abcdefg1!X"),
    "Passwords do not match"
  );
});
