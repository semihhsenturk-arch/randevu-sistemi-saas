const { format, parseISO, isValid } = require("date-fns");
const appointmentDate = "2026-08-25";
const appointmentTime = "14:30";
const formattedApptDate = appointmentDate 
? (isValid(parseISO(appointmentDate)) ? format(parseISO(appointmentDate), "dd.MM.yyyy") : appointmentDate) 
: format(new Date(), "dd.MM.yyyy");
const formattedApptTime = appointmentTime || format(new Date(), "HH:mm");
console.log(formattedApptDate + " " + formattedApptTime);
