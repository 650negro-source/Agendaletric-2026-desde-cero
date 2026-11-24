function minutesSinceMidnight(value) {
  const [hours, minutes, seconds = "0"] = String(value).split(":");
  return Number(hours) * 60 + Number(minutes) + Number(seconds) / 60;
}

function schedulesOverlap(existingSchedules, nextSchedule) {
  const nextStart = minutesSinceMidnight(nextSchedule.hora_inicio);
  const nextEnd = minutesSinceMidnight(nextSchedule.hora_fin);

  return existingSchedules.some((schedule) => (
    Number(schedule.dia_semana) === Number(nextSchedule.dia_semana) &&
    nextStart < minutesSinceMidnight(schedule.hora_fin) &&
    nextEnd > minutesSinceMidnight(schedule.hora_inicio)
  ));
}

function scheduleCoversAppointment(schedule, appointment) {
  const appointmentStart = minutesSinceMidnight(appointment.hora_inicio);
  const hasDuration =
    appointment.duracion_minutos !== null &&
    appointment.duracion_minutos !== undefined;
  const appointmentEnd = hasDuration
    ? appointmentStart + Number(appointment.duracion_minutos)
    : appointmentStart;
  const scheduleStart = minutesSinceMidnight(schedule.hora_inicio);
  const scheduleEnd = minutesSinceMidnight(schedule.hora_fin);

  return (
    Number(schedule.dia_semana) === Number(appointment.dia_semana) &&
    appointmentStart >= scheduleStart &&
    appointmentStart < scheduleEnd &&
    appointmentEnd <= scheduleEnd
  );
}

function scheduleChangeInvalidatesAppointments(
  appointments,
  currentSchedules,
  nextSchedules
) {
  return appointments.some((appointment) => {
    const isCurrentlyCovered = currentSchedules.some((schedule) => (
      scheduleCoversAppointment(schedule, appointment)
    ));
    const remainsCovered = nextSchedules.some((schedule) => (
      scheduleCoversAppointment(schedule, appointment)
    ));
    return isCurrentlyCovered && !remainsCovered;
  });
}

module.exports = {
  schedulesOverlap,
  scheduleChangeInvalidatesAppointments,
};
