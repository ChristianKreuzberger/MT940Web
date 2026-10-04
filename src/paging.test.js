import { PAGE_SIZE, visibleItems, nextCount, hasMore } from './paging';

describe('paging', () => {
    const items = Array.from({ length: 250 }, (_, i) => i);

    test('page size is 100', () => {
        expect(PAGE_SIZE).toBe(100);
    });

    test('visibleItems returns the first count items', () => {
        expect(visibleItems(items, 100)).toHaveLength(100);
        expect(visibleItems(items, 100)[99]).toBe(99);
        expect(visibleItems([], 100)).toEqual([]);
        expect(visibleItems([1, 2], 100)).toEqual([1, 2]);
    });

    test('nextCount adds a page and clamps to the total', () => {
        expect(nextCount(100, 250)).toBe(200);
        expect(nextCount(200, 250)).toBe(250);
        expect(nextCount(100, 50)).toBe(50);
        expect(nextCount(0, 0)).toBe(0);
    });

    test('hasMore is false once everything is visible', () => {
        expect(hasMore(100, 250)).toBe(true);
        expect(hasMore(250, 250)).toBe(false);
        expect(hasMore(100, 0)).toBe(false);
        expect(hasMore(100, 50)).toBe(false);
    });
});
