import { addDaysISO, getCutoffISO } from './dateUtils';

describe('addDaysISO', () => {
  test.each([
    ['2026-03-30', -1, '2026-03-29'],
    ['2026-03-30', 1, '2026-03-31'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2024-03-01', -1, '2024-02-29'],
    ['2026-01-01', -1, '2025-12-31'],
    ['2025-12-31', 1, '2026-01-01'],
    ['2026-03-31', -30, '2026-03-01'],
    ['2026-03-29', -1, '2026-03-28'],
    ['2026-03-29', 1, '2026-03-30'],
    ['2026-10-25', -1, '2026-10-24'],
    ['2026-10-25', 1, '2026-10-26'],
    ['2026-11-01', 1, '2026-11-02'],
    ['2026-10-26', -30, '2026-09-26'],
    ['2026-10-26', 0, '2026-10-26'],
  ])('%s + %i days = %s', (start, n, expected) => {
    expect(addDaysISO(start, n)).toBe(expected);
  });
});

describe('getCutoffISO', () => {
  test.each([
    [['2026-10-26'], 1, '2026-10-25'], // Berlin DST end
    [['2026-11-02'], 7, '2026-10-26'],
    [['2026-11-02'], 30, '2026-10-03'],
    [['2026-03-09'], 7, '2026-03-02'], // Los Angeles DST start
    [['2026-03-30', '2026-03-10', null, '2026-03-20'], 7, '2026-03-23'],
  ])('latest of %j minus %i days = %s', (dates, days, expected) => {
    expect(getCutoffISO(dates, days)).toBe(expected);
  });

  test('falls back to the given today when there are no dates', () => {
    expect(getCutoffISO([], 7, '2026-10-26')).toBe('2026-10-19');
    expect(getCutoffISO([null], 7, '2026-10-26')).toBe('2026-10-19');
  });

  test('a transaction exactly on the cutoff day is kept, one day earlier is not', () => {
    const dates = ['2026-10-26', '2026-10-25', '2026-10-24'];
    const cutoff = getCutoffISO(dates, 1);
    expect(dates.filter((d) => !(d < cutoff))).toEqual(['2026-10-26', '2026-10-25']);
  });
});
