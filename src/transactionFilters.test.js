import { filterTransactions, sortTransactions } from './transactionFilters';

const base = { direction: 'all', amountRange: 'all', txType: 'all', dateRange: 'all', customFrom: '', customTo: '' };
const T = [
    { id: 1, bookingDate: '2026-01-01', amount: -50, isDebit: true, transactionCode: 'NMSC' },
    { id: 2, bookingDate: '2026-01-10', amount: 500, isDebit: false, transactionCode: 'NTRF' },
    { id: 3, bookingDate: '2026-01-31', amount: -2000, isDebit: true, transactionCode: 'NTRF' },
    { id: 4, bookingDate: null, amount: 100, isDebit: false, transactionCode: 'NMSC' },
];
const ids = (l) => l.map((t) => t.id);
const f = (o) => ids(filterTransactions(T, { ...base, ...o }));

describe('filterTransactions', () => {
    test('no filters keeps everything', () => expect(f({})).toEqual([1, 2, 3, 4]));
    test('direction', () => {
        expect(f({ direction: 'credit' })).toEqual([2, 4]);
        expect(f({ direction: 'debit' })).toEqual([1, 3]);
    });
    test('amount ranges', () => {
        expect(f({ amountRange: 'small' })).toEqual([1]);
        expect(f({ amountRange: 'medium' })).toEqual([2, 4]);
        expect(f({ amountRange: 'large' })).toEqual([3]);
    });
    test('transaction type', () => expect(f({ txType: 'NTRF' })).toEqual([2, 3]));
    test('relative period uses the latest booking date in the file', () => {
        expect(f({ dateRange: '7' })).toEqual([3, 4]);
    });
    test('custom period is inclusive; undated rows are kept', () => {
        expect(f({ dateRange: 'custom', customFrom: '2026-01-10', customTo: '2026-01-31' })).toEqual([2, 3, 4]);
        expect(f({ dateRange: 'custom', customTo: '2026-01-01' })).toEqual([1, 4]);
    });
    test('filters combine', () => {
        expect(f({ direction: 'debit', txType: 'NTRF' })).toEqual([3]);
    });
    test('does not mutate the input', () => {
        const copy = [...T];
        filterTransactions(T, base);
        expect(T).toEqual(copy);
    });
});

describe('sortTransactions', () => {
    test('by date asc / desc (undated first when asc)', () => {
        expect(ids(sortTransactions(T, 'date', 'asc'))).toEqual([4, 1, 2, 3]);
        expect(ids(sortTransactions(T, 'date', 'desc'))).toEqual([3, 2, 1, 4]);
    });
    test('by absolute amount', () => {
        expect(ids(sortTransactions(T, 'amount', 'asc'))).toEqual([1, 4, 2, 3]);
        expect(ids(sortTransactions(T, 'amount', 'desc'))).toEqual([3, 2, 4, 1]);
    });
    test('returns a new array', () => {
        expect(sortTransactions(T, 'date', 'asc')).not.toBe(T);
    });
});
