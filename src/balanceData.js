import { addDaysISO, toISODate } from './dateUtils';

function toDateKey(date) {
  return date instanceof Date
    ? toISODate(date)
    : String(date).slice(0, 10);
}

export function buildDailyBalanceData(transactions, openingBalance) {
  // Group net amount per day
  const byDay = {};
  transactions.forEach((tx) => {
    const key = toDateKey(tx.bookingDate);
    const signed = tx.isDebit ? -Math.abs(tx.amount) : Math.abs(tx.amount);
    byDay[key] = (byDay[key] || 0) + signed;
  });

  const days = Object.keys(byDay).sort();
  if (days.length === 0) return [];

  // Prepend the opening balance as the day before the first transaction
  const firstDay = days[0];
  const openKey = addDaysISO(firstDay, -1);

  const points = [{ date: openKey, balance: Math.round((openingBalance || 0) * 100) / 100 }];

  let balance = openingBalance || 0;
  days.forEach((day) => {
    balance = Math.round((balance + byDay[day]) * 100) / 100;
    points.push({ date: day, balance });
  });

  return points;
}

// Returns closing - computed (rounded to cents), or null when there is no
// closing balance or the two agree at cent precision.
export function balanceDifference(computedLast, closingBalance) {
  if (closingBalance === null || closingBalance === undefined) return null;
  const diffCents = Math.round(closingBalance * 100) - Math.round(computedLast * 100);
  return diffCents === 0 ? null : diffCents / 100;
}
