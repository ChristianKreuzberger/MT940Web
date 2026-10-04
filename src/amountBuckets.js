// Amount thresholds shared by the list filter and the summary modal.
export const SMALL_MAX = 100;    // small: abs < 100
export const MEDIUM_MAX = 1000;  // medium: 100 <= abs <= 1000
export const LARGE_MAX = 10000;  // summary only, see below

// Filter buckets: small < 100, medium 100..1000 (inclusive), large > 1000.
export function matchesAmountRange(range, abs) {
    if (range === 'small') return abs < SMALL_MAX;
    if (range === 'medium') return abs >= SMALL_MAX && abs <= MEDIUM_MAX;
    if (range === 'large') return abs > MEDIUM_MAX;
    return true;
}

// The summary splits the filter's "large" bucket in two at 10 000. It is a
// distribution view, so the extra tier is informative; the filter is a
// drill-down where a fourth button was not wanted. Keep the labels stable:
// they are shown in the UI and used as row keys.
export function summaryBucketLabel(abs) {
    if (abs < SMALL_MAX) return '< 100';
    if (abs <= MEDIUM_MAX) return '100 – 1 000';
    if (abs <= LARGE_MAX) return '1 000 – 10 000';
    return '> 10 000';
}
