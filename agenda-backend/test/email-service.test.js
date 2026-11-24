const test = require("node:test");
const assert = require("node:assert/strict");
const { getTransportConfig, getFrontendUrl } = require("../src/modules/notificaciones/email.service");

test("SMTP configuration requires explicit server, credentials, sender, and TLS mode", () => {
  assert.throws(
    () => getTransportConfig({}),
    { status: 503, message: "SMTP email delivery is not configured correctly" }
  );
});

test("SMTP configuration parses a secure authenticated transport", () => {
  const config = getTransportConfig({
    SMTP_HOST: "smtp.example.test",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
    SMTP_USER: "sender@example.test",
    SMTP_PASS: "test-secret",
    MAIL_FROM: "AgendaLetric <sender@example.test>",
  });

  assert.equal(config.host, "smtp.example.test");
  assert.equal(config.port, 465);
  assert.equal(config.secure, true);
  assert.equal(config.auth.user, "sender@example.test");
});

test("email links require an absolute configured frontend URL", () => {
  assert.throws(
    () => getFrontendUrl({}),
    { status: 503, message: "The frontend URL for email links is not configured" }
  );
  assert.equal(
    getFrontendUrl({ FRONTEND_URL: "https://agenda.example.test" }).origin,
    "https://agenda.example.test"
  );
});
