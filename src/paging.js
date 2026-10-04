export const PAGE_SIZE = 100;

export const visibleItems = (items, count) => items.slice(0, count);

export const nextCount = (count, total, pageSize = PAGE_SIZE) =>
    Math.min(count + pageSize, total);

export const hasMore = (count, total) => total > count;
