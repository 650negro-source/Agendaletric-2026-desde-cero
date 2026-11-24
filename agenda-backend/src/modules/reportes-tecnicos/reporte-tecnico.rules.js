function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function assertCanEdit(status) {
  if (!["BORRADOR", "REQUIERE_CORRECCION"].includes(status)) {
    throw createError(
      "Published reports can only be edited after an administrator requests a correction",
      409
    );
  }
}

function assertCanPublish(status) {
  if (!["BORRADOR", "REQUIERE_CORRECCION"].includes(status)) {
    throw createError("Only draft or corrected reports can be published", 409);
  }
}

function assertCanRequestCorrection(status) {
  if (status !== "PUBLICADO") {
    throw createError("Only published reports can be sent for correction", 409);
  }
}

module.exports = {
  assertCanEdit,
  assertCanPublish,
  assertCanRequestCorrection,
};
