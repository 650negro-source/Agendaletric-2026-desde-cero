function simulateMessage({ to, message }) {
  if (typeof to !== "string" || !to.trim()) {
    throw new Error("A WhatsApp recipient phone number is required");
  }
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("A WhatsApp message is required");
  }

  return { status: "SIMULADO" };
}

module.exports = {
  simulateMessage,
};
