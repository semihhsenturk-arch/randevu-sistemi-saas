const { format, parseISO, isValid } = require("date-fns");
const d = "2026-08-29";
console.log(isValid(parseISO(d)));
console.log(format(parseISO(d), "dd.MM.yyyy"));
