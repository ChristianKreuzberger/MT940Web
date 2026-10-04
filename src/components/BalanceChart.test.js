import { buildDailyBalanceData } from './BalanceChart';

const tx = (bookingDate, amount, isDebit = false) => ({ bookingDate, amount, isDebit });

describe('buildDailyBalanceData', () => {
  test('returns an empty list without transactions', () => {
    expect(buildDailyBalanceData([], 100)).toEqual([]);
  });

  test.each([
    ['2026-03-30', '2026-03-29'],
    ['2026-01-01', '2025-12-31'], // year boundary
    ['2026-03-01', '2026-02-28'], // month boundary
    ['2024-03-01', '2024-02-29'], // leap year
    ['2026-03-29', '2026-03-28'], // Berlin DST start
    ['2026-03-30', '2026-03-29'],
    ['2026-10-25', '2026-10-24'], // Berlin DST end
    ['2026-11-01', '2026-10-31'], // Los Angeles DST end
  ])('opening point for first transaction on %s is %s', (first, previous) => {
    const points = buildDailyBalanceData([tx(first, 50)], 1000);
    expect(points[0]).toEqual({ date: previous, balance: 1000 });
    expect(points[1]).toEqual({ date: first, balance: 1050 });
  });

  test('accumulates balances per day in date order', () => {
    const points = buildDailyBalanceData(
      [tx('2026-03-31', 20, true), tx('2026-03-30', 100), tx('2026-03-30', 10, true)],
      500
    );
    expect(points).toEqual([
      { date: '2026-03-29', balance: 500 },
      { date: '2026-03-30', balance: 590 },
      { date: '2026-03-31', balance: 570 },
    ]);
  });
});
