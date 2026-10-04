import { transactionsToCsv, escapeCell, csvFilename, CSV_COLUMNS } from './csv';
import { MT940Parser } from './parser';

const BOM = '﻿';
const HEADER = 'date;amount;currency;type;code;counterparty;iban;bic;reference;description';
const tx = (over = {}) => ({
    bookingDate: '2026-01-02',
    amount: -250.5,
    type: 'Debit',
    transactionCode: 'NMSC',
    sender: '',
    receiver: 'Max Mustermann',
    counterpartyIban: 'DE89370400440532013000',
    counterpartyBic: 'COBADEFFXXX',
    reference: 'E2E-42',
    description: 'Miete Januar',
    ...over,
});
const rows = (csv) => csv.slice(BOM.length).split('\r\n');

describe('escapeCell', () => {
    test('plain field is not quoted', () => {
        expect(escapeCell('hello', ';')).toBe('hello');
    });
    test('field with the delimiter is quoted', () => {
        expect(escapeCell('a;b', ';')).toBe('"a;b"');
    });
    test('comma is only special when it is the delimiter', () => {
        expect(escapeCell('a,b', ';')).toBe('a,b');
        expect(escapeCell('a,b', ',')).toBe('"a,b"');
    });
    test('embedded quotes are doubled', () => {
        expect(escapeCell('say "hi"', ';')).toBe('"say ""hi"""');
    });
    test('LF and CRLF stay inside the quotes', () => {
        expect(escapeCell('a\nb', ';')).toBe('"a\nb"');
        expect(escapeCell('a\r\nb', ';')).toBe('"a\r\nb"');
    });
    test('null, undefined and empty give an empty field', () => {
        expect(escapeCell(null, ';')).toBe('');
        expect(escapeCell(undefined, ';')).toBe('');
        expect(escapeCell('', ';')).toBe('');
    });
    test('numbers use a dot and are never prefixed', () => {
        expect(escapeCell(-250.5, ';')).toBe('-250.5');
        expect(escapeCell(100, ';')).toBe('100');
        expect(escapeCell(NaN, ';')).toBe('');
    });
    test.each(['=1+1', '+x', '-x', '@x', '\tx', '\rx'])('text starting with %j is neutralised against formulas', (v) => {
        const out = escapeCell(v, ';');
        expect(out.replace(/^"/, '').startsWith("'")).toBe(true);
    });
});

describe('transactionsToCsv', () => {
    test('exposes the 10 columns', () => {
        expect(CSV_COLUMNS).toHaveLength(10);
    });
    test('starts with a UTF-8 BOM, then the exact header', () => {
        const csv = transactionsToCsv([], 'EUR');
        expect(csv.startsWith(BOM)).toBe(true);
        expect(rows(csv)[0]).toBe(HEADER);
    });
    test('records are separated and terminated by CRLF', () => {
        const csv = transactionsToCsv([tx(), tx()], 'EUR');
        expect(csv.endsWith('\r\n')).toBe(true);
        expect(rows(csv)).toHaveLength(4); // header, 2 rows, trailing ''
        expect(csv.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    });
    test('maps a debit row; amount stays a plain signed number', () => {
        const csv = transactionsToCsv([tx()], 'EUR');
        expect(rows(csv)[1]).toBe(
            '2026-01-02;-250.5;EUR;Debit;NMSC;Max Mustermann;DE89370400440532013000;COBADEFFXXX;E2E-42;Miete Januar'
        );
    });
    test('counterparty is the sender for credits', () => {
        const csv = transactionsToCsv([tx({ type: 'Credit', amount: 100, sender: 'ACME GmbH', receiver: '' })], 'EUR');
        expect(rows(csv)[1].split(';')[1]).toBe('100');
        expect(rows(csv)[1].split(';')[5]).toBe('ACME GmbH');
    });
    test('missing values give empty fields', () => {
        const csv = transactionsToCsv([{ amount: 1 }], 'EUR');
        expect(rows(csv)[1]).toBe(';1;EUR;;;;;;;');
    });
    test('free text starting with a formula character is prefixed, amount is not', () => {
        for (const d of ['=1+1', '+x', '-x', '@x']) {
            const line = rows(transactionsToCsv([tx({ description: d, amount: -5 })], 'EUR'))[1];
            expect(line.endsWith(`;'${d}`)).toBe(true);
            expect(line.split(';')[1]).toBe('-5');
        }
    });
    test('non-ASCII text is preserved', () => {
        const line = rows(transactionsToCsv([tx({ receiver: 'Müller', description: '12 €' })], 'EUR'))[1];
        expect(line).toContain('Müller');
        expect(line).toContain('12 €');
    });
    test('a custom delimiter is honoured', () => {
        const csv = transactionsToCsv([tx({ description: 'a,b' })], 'EUR', { delimiter: ',' });
        expect(rows(csv)[0]).toBe(HEADER.replace(/;/g, ','));
        expect(rows(csv)[1].endsWith(',"a,b"')).toBe(true);
    });
    test('no decimal comma regardless of locale', () => {
        const line = rows(transactionsToCsv([tx({ amount: 1234.56 })], 'EUR'))[1];
        expect(line.split(';')[1]).toBe('1234.56');
    });
    test('matches real parser output', () => {
        const text = [
            ':20:STMT001', ':25:12345678/9876543210', ':28C:1/1', ':60F:C260101EUR1000,00',
            ':61:2601020102D250,50NMSCREF002',
            ':86:177?00LASTSCHRIFT?20EREF+E2E-42 SVWZ+Miete Januar?21 MREF+MANDATE-7 CRED+DE98ZZZ09999999999?30COBADEFFXXX?31DE89370400440532013000?32Max?33Mustermann',
            ':62F:C260131EUR749,50',
        ].join('\n') + '\n';
        const data = new MT940Parser().parse(text);
        const line = rows(transactionsToCsv(data.transactions, data.currency))[1];
        const f = line.split(';');
        expect(f.slice(0, 5)).toEqual(['2026-01-02', '-250.5', 'EUR', 'Debit', f[4]]);
        expect(f[5]).toBe('Max Mustermann');
        expect(f[6]).toBe('DE89370400440532013000');
        expect(f[7]).toBe('COBADEFFXXX');
        expect(f[8]).toBe('E2E-42');
        expect(f[9]).toBe('Miete Januar');
    });
});

describe('csvFilename', () => {
    const period = { startDate: '2026-01-01', endDate: '2026-01-31' };
    test('uses the statement period', () => {
        expect(csvFilename(period)).toBe('mt940-transactions-2026-01-01_2026-01-31.csv');
    });
    test('marks filtered exports', () => {
        expect(csvFilename(period, { filtered: true })).toBe('mt940-transactions-2026-01-01_2026-01-31-filtered.csv');
    });
    test('falls back without a period', () => {
        expect(csvFilename(undefined)).toBe('mt940-transactions.csv');
        expect(csvFilename({}, { filtered: true })).toBe('mt940-transactions-filtered.csv');
    });
});
