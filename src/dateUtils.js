// Booking dates are plain "YYYY-MM-DD" strings. All maths here is done in UTC
// so results never depend on the viewer's timezone or daylight saving changes.

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDaysISO(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return toISODate(new Date(Date.UTC(y, m - 1, d + days)));
}

// Latest booking date minus `days`. Falls back to `todayISO` (UTC today) when
// there are no dates, so the filter still behaves on empty input.
export function getCutoffISO(bookingDates, days, todayISO = toISODate(new Date())) {
  const valid = bookingDates.filter(Boolean).map((d) => String(d).slice(0, 10));
  const latest = valid.length ? valid.reduce((a, b) => (b > a ? b : a)) : todayISO;
  return addDaysISO(latest, -Number(days));
}
