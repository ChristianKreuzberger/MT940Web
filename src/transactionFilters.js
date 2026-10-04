import { getCutoffISO } from './dateUtils';

export function filterTransactions(transactions, { direction, amountRange, txType, dateRange, customFrom, customTo }) {
    // Use the most recent booking date in the file as the reference point
    // so the filter still works on historical files.
    const dateThreshold = dateRange === 'all' || dateRange === 'custom'
        ? null
        : getCutoffISO(transactions.map((t) => t.bookingDate), dateRange);

    return transactions.filter((t) => {
        // Direction
        if (direction === 'credit' && t.isDebit) return false;
        if (direction === 'debit' && !t.isDebit) return false;

        // Amount range
        const abs = Math.abs(t.amount);
        if (amountRange === 'small' && abs >= 100) return false;
        if (amountRange === 'medium' && (abs < 100 || abs > 1000)) return false;
        if (amountRange === 'large' && abs <= 1000) return false;

        // Transaction type
        if (txType !== 'all' && t.transactionCode !== txType) return false;

        // Date range
        if (dateThreshold && t.bookingDate) {
            if (t.bookingDate < dateThreshold) return false;
        }
        // Custom range: inclusive, plain YYYY-MM-DD string comparison ('' = unbounded)
        if (dateRange === 'custom' && t.bookingDate) {
            if (customFrom && t.bookingDate < customFrom) return false;
            if (customTo && t.bookingDate > customTo) return false;
        }

        return true;
    });
}

export function sortTransactions(list, sortField, sortDir) {
    return [...list].sort((a, b) => {
        let aVal, bVal;
        if (sortField === 'date') {
            aVal = a.bookingDate ? Date.parse(a.bookingDate) : 0;
            bVal = b.bookingDate ? Date.parse(b.bookingDate) : 0;
        } else {
            aVal = Math.abs(a.amount ?? 0);
            bVal = Math.abs(b.amount ?? 0);
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
}
