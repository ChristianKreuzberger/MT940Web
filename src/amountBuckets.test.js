import { matchesAmountRange, summaryBucketLabel } from './amountBuckets';

const samples = [0, 0.01, 99.99, 100, 100.01, 999.99, 1000, 1000.01, 9999.99, 10000, 10000.01, 1e6];

test('matchesAmountRange boundaries', () => {
    expect(matchesAmountRange('all', 1e9)).toBe(true);
    expect(matchesAmountRange('small', 99.99)).toBe(true);
    expect(matchesAmountRange('small', 100)).toBe(false);
    expect(matchesAmountRange('medium', 99.99)).toBe(false);
    expect(matchesAmountRange('medium', 100)).toBe(true);
    expect(matchesAmountRange('medium', 1000)).toBe(true);
    expect(matchesAmountRange('medium', 1000.01)).toBe(false);
    expect(matchesAmountRange('large', 1000)).toBe(false);
    expect(matchesAmountRange('large', 1000.01)).toBe(true);
    expect(matchesAmountRange('large', 10000.01)).toBe(true);
});

test('summaryBucketLabel boundaries', () => {
    expect(summaryBucketLabel(99.99)).toBe('< 100');
    expect(summaryBucketLabel(100)).toBe('100 – 1 000');
    expect(summaryBucketLabel(1000)).toBe('100 – 1 000');
    expect(summaryBucketLabel(1000.01)).toBe('1 000 – 10 000');
    expect(summaryBucketLabel(10000)).toBe('1 000 – 10 000');
    expect(summaryBucketLabel(10000.01)).toBe('> 10 000');
});

test('summary buckets stay consistent with the filter buckets', () => {
    for (const abs of samples) {
        const label = summaryBucketLabel(abs);
        expect(label === '< 100').toBe(matchesAmountRange('small', abs));
        expect(label === '100 – 1 000').toBe(matchesAmountRange('medium', abs));
        expect(label === '1 000 – 10 000' || label === '> 10 000').toBe(matchesAmountRange('large', abs));
    }
});
