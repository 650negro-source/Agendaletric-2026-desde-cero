const changeableStates = new Set(["BORRADOR", "PROGRAMADA", "VALIDADA"]);
const appointmentChangeNoticeHours = 2;

function assertCanChangeAppointment(state, action) {
  if (state === "EN_PROCESO") {
    const error = new Error("Appointment cannot be changed while it is in progress");
    error.status = 409;
    throw error;
  }

  if (!changeableStates.has(state)) {
    const error = new Error(`Appointment can no longer be ${action}`);
    error.status = 409;
    throw error;
  }
}

module.exports = {
  appointmentChangeNoticeHours,
  assertCanChangeAppointment,
};
