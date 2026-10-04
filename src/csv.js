// CSV export of transactions.
//
// Format choices (aimed at opening the file by double-click in Excel):
// - ';' as delimiter: Excel with European regional settings (de, fr, it, es...)
//   splits on ';' and would put a ','-separated file into a single column.
//   en-US Excel expects ',' instead; pass {delimiter: ','} for that.
// - UTF-8 BOM, because Excel otherwise guesses a legacy codepage and garbles
//   umlauts and the euro sign.
// - Amounts are plain numbers with '.' as decimal separator, no thousands
//   separators and no locale formatting, so the file is machine-readable and
//   identical regardless of the browser locale. ISO dates (YYYY-MM-DD).
// - CRLF line endings (RFC 4180).

export const CSV_COLUMNS = [
    'date', 'amount', 'currency', 'type', 'code', 'counterparty', 'iban', 'bic', 'reference', 'description',
];

// Text that starts with one of these is interpreted as a formula by
// spreadsheet apps. Descriptions and names come from untrusted bank files, so
// they get a leading "'" (OWASP CSV injection guidance).
const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeCell(value, delimiter = ';') {
    if (value === null || value === undefined) return '';
    let text;
    if (typeof value === 'number') {
        // Numbers are never sanitised: a negative amount must stay numeric.
        if (!Number.isFinite(value)) return '';
        text = String(value);
    } else {
        text = String(value);
        if (FORMULA_START.test(text)) text = `'${text}`;
    }
    if (text.includes(delimiter) || /["\r\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export function transactionsToCsv(transactions, currency, { delimiter = ';' } = {}) {
    const records = [CSV_COLUMNS.map((c) => escapeCell(c, delimiter)).join(delimiter)];
    for (const t of transactions) {
        records.push([
            t.bookingDate,
            t.amount,
            currency,
            t.type,
            t.transactionCode,
            t.sender || t.receiver,
            t.counterpartyIban,
            t.counterpartyBic,
            t.reference,
            t.description,
        ].map((v) => escapeCell(v, delimiter)).join(delimiter));
    }
    return '﻿' + records.join('\r\n') + '\r\n';
}

export function csvFilename(period, { filtered = false } = {}) {
    const range = period && period.startDate && period.endDate
        ? `-${period.startDate}_${period.endDate}`
        : '';
    return `mt940-transactions${range}${filtered ? '-filtered' : ''}.csv`;
}
