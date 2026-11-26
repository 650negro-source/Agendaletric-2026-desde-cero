const assert = require("node:assert/strict");
const test = require("node:test");
const { simulateMessage } = require(
  "../src/modules/notificaciones/whatsapp.service"
);

test("WhatsApp simulation validates the recipient and records no real delivery", () => {
  assert.deepEqual(
    simulateMessage({ to: "3001234567", message: "Appointment reminder" }),
    { status: "SIMULADO" }
  );
  assert.throws(
    () => simulateMessage({ to: "", message: "Appointment reminder" }),
    /recipient phone number is required/
  );
});
