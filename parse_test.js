const { format, parseISO, isValid } = require('date-fns');

const tarihler = ["2026-08-28", "28.08.2026", "28/08/2026"];
tarihler.forEach(tarih => {
  let dateStr = "";
  if (tarih) {
    if (tarih.includes(".")) {
      dateStr = tarih; // Zaten dd.MM.yyyy formatında olabilir
    } else {
      const parsed = parseISO(tarih);
      if (isValid(parsed)) {
        dateStr = format(parsed, "dd.MM.yyyy");
      } else {
        try {
           dateStr = format(new Date(tarih), 'dd.MM.yyyy');
        } catch(e) {
           dateStr = tarih;
        }
      }
    }
  }
  console.log(`Original: ${tarih} -> dateStr: ${dateStr}`);
});
