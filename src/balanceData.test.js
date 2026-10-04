import { buildDailyBalanceData, balanceDifference } from './balanceData';

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

  test('handles debit-only days', () => {
    const points = buildDailyBalanceData(
      [tx('2026-03-30', 100, true), tx('2026-03-30', 50, true)],
      500
    );
    expect(points).toEqual([
      { date: '2026-03-29', balance: 500 },
      { date: '2026-03-30', balance: 350 },
    ]);
  });

  test('rounds float noise to cents', () => {
    const points = buildDailyBalanceData([tx('2026-03-30', 0.1), tx('2026-03-30', 0.2)], 0);
    expect(points[1].balance).toBe(0.3);
  });
});

describe('balanceDifference', () => {
  test('is null when balances match', () => {
    expect(balanceDifference(570, 570)).toBeNull();
  });

  test('is null for sub-cent noise', () => {
    expect(balanceDifference(0.1 + 0.2, 0.3)).toBeNull();
  });

  test('is null without a closing balance', () => {
    expect(balanceDifference(570, null)).toBeNull();
    expect(balanceDifference(570, undefined)).toBeNull();
  });

  test('returns closing minus computed', () => {
    expect(balanceDifference(570, 582.5)).toBe(12.5);
    expect(balanceDifference(570, 500)).toBe(-70);
  });

  test('works with negative balances', () => {
    expect(balanceDifference(-100, -90.25)).toBe(9.75);
    expect(balanceDifference(-100, -100)).toBeNull();
  });
});
