import { MT940Parser } from './parser';

// Fixture lines must start at column 0, so build them from an array.
const mt940 = (...lines) => lines.join('\n') + '\n';

const HEADER = [
    ':20:STMT001',
    ':25:12345678/9876543210',
    ':28C:1/1',
    ':60F:C260101EUR1000,00',
];
// The library checks that opening balance + transactions = closing balance.
const FOOTER_1TX = [':62F:C260131EUR749,50'];
const FOOTER_2TX = [':62F:C260131EUR849,50'];
const FOOTER_FALLBACK = [':62F:C260131EUR1010,00'];

const debitTx = [
    ':61:2601020102D250,50NMSCREF002',
    ':86:177?00LASTSCHRIFT?20EREF+E2E-42 SVWZ+Miete Januar?21 MREF+MANDATE-7 CRED+DE98ZZZ09999999999?30COBADEFFXXX?31DE89370400440532013000?32Max?33Mustermann',
];
const creditTx = [
    ':61:2601050105C100,00NTRFNONREF',
    ':86:166?00GUTSCHRIFT?20SVWZ+Gehalt?32ACME?33GmbH?30GENODEF1XXX?31DE02120300000000202051',
];

describe('MT940Parser.parse', () => {
    const parser = new MT940Parser();

    describe('single statement', () => {
        const result = parser.parse(mt940(...HEADER, ...debitTx, ...FOOTER_1TX));

        test('reads header fields', () => {
            expect(result.transactionReferenceNumber).toBe('STMT001');
            expect(result.bankCode).toBe('12345678');
            expect(result.accountNumber).toBe('9876543210');
            expect(result.statementNumber).toBeTruthy();
            expect(result.sequenceNumber).toBeTruthy();
            expect(result.currency).toBe('EUR');
        });

        test('reads balances and period', () => {
            expect(result.openingBalance).toBe(1000);
            expect(result.closingBalance).toBe(749.5);
            expect(result.statementPeriod).toEqual({
                startDate: '2026-01-01',
                endDate: '2026-01-31',
            });
        });

        test('reads transactions', () => {
            expect(result.transactions).toHaveLength(1);
            expect(result.transactions[0].bookingDate).toBe('2026-01-02');
        });
    });

    describe('credit vs debit', () => {
        const result = parser.parse(mt940(...HEADER, ...debitTx, ...creditTx, ...FOOTER_2TX));
        const [debit, credit] = result.transactions;

        test('debit is negative and the counterparty is the receiver', () => {
            expect(debit.isDebit).toBe(true);
            expect(debit.type).toBe('Debit');
            expect(debit.amount).toBe(-250.5);
            expect(debit.receiver).toBe('MaxMustermann');
            expect(debit.sender).toBe('');
        });

        test('credit is positive and the counterparty is the sender', () => {
            expect(credit.isDebit).toBe(false);
            expect(credit.type).toBe('Credit');
            expect(credit.amount).toBe(100);
            expect(credit.sender).toBe('ACMEGmbH');
            expect(credit.receiver).toBe('');
        });
    });

    describe(':86: structured details', () => {
        const result = parser.parse(mt940(...HEADER, ...debitTx, ...creditTx, ...FOOTER_2TX));
        const [debit, credit] = result.transactions;

        test('extracts counterparty IBAN and BIC', () => {
            expect(debit.counterpartyIban).toBe('DE89370400440532013000');
            expect(debit.counterpartyBic).toBe('COBADEFFXXX');
        });

        test('extracts SEPA references and description', () => {
            expect(debit.reference).toBe('E2E-42');
            expect(debit.description).toBe('Miete Januar');
            expect(debit.mandateReference).toBe('MANDATE-7');
            expect(debit.creditorId).toBe('DE98ZZZ09999999999');
        });

        test('exposes the raw structured subfields', () => {
            expect(debit.structuredDetails['32']).toBe('Max');
            expect(debit.structuredDetails['33']).toBe('Mustermann');
        });

        test('parses SVWZ without other SEPA tags', () => {
            expect(credit.description).toBe('Gehalt');
            expect(credit.mandateReference).toBe('');
        });

        test('falls back to ?00 for description when there is no SVWZ', () => {
            const tx = [
                ':61:2601050105C10,00NTRFNONREF',
                ':86:166?00Kontogebuehr?32Bank',
            ];
            const r = parser.parse(mt940(...HEADER, ...tx, ...FOOTER_FALLBACK));
            expect(r.transactions[0].description).toBe('Kontogebuehr');
        });
    });

    describe('multiple statements', () => {
        const stmt = ({ ref, num, openDate, open, txs = [], closeDate, close }) => [
            `:20:${ref}`,
            ':25:12345678/9876543210',
            `:28C:${num}/1`,
            `:60F:C${openDate}EUR${open}`,
            ...txs.flat(),
            `:62F:C${closeDate}EUR${close}`,
        ];
        const jan = stmt({ ref: 'S1', num: 1, openDate: '260101', open: '1000,00', txs: [debitTx], closeDate: '260131', close: '749,50' });
        const feb = stmt({ ref: 'S2', num: 2, openDate: '260201', open: '749,50', txs: [creditTx], closeDate: '260228', close: '849,50' });

        describe('consistent statements', () => {
            const result = parser.parse(mt940(...jan, ...feb));

            test('merges transactions, balances, period and count', () => {
                expect(result.transactions).toHaveLength(2);
                expect(result.openingBalance).toBe(1000);
                expect(result.closingBalance).toBe(849.5);
                expect(result.statementCount).toBe(2);
                expect(result.statementPeriod).toEqual({ startDate: '2026-01-01', endDate: '2026-02-28' });
            });

            test('has no warnings', () => {
                expect(result.warnings).toEqual([]);
            });
        });

        test('sorts statements by opening date when the file is out of order', () => {
            const result = parser.parse(mt940(...feb, ...jan));
            expect(result.openingBalance).toBe(1000);
            expect(result.closingBalance).toBe(849.5);
            expect(result.statementPeriod).toEqual({ startDate: '2026-01-01', endDate: '2026-02-28' });
            expect(result.transactions.map(t => t.amount)).toEqual([-250.5, 100]);
            expect(result.warnings).toEqual([]);
        });

        test('warns when the merged balances do not add up (gap between statements)', () => {
            const gap = stmt({ ref: 'S2', num: 2, openDate: '260201', open: '800,00', txs: [creditTx], closeDate: '260228', close: '900,00' });
            const result = parser.parse(mt940(...jan, ...gap));
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain(MT940Parser.formatAmount(1000));
            expect(result.warnings[0]).toContain(MT940Parser.formatAmount(900));
            expect(result.warnings[0]).toContain(MT940Parser.formatAmount(50.5));
        });

        test('does not warn because of floating point rounding', () => {
            const tx = (d, amt) => [`:61:${d}${d.slice(2)}C${amt}NTRFNONREF`, ':86:166?00Test'];
            const a = stmt({ ref: 'A', num: 1, openDate: '260101', open: '0,00', txs: [tx('260102', '0,10'), tx('260103', '0,20')], closeDate: '260131', close: '0,30' });
            const b = stmt({ ref: 'B', num: 2, openDate: '260201', open: '0,30', txs: [tx('260202', '0,10')], closeDate: '260228', close: '0,40' });
            const result = parser.parse(mt940(...a, ...b));
            expect(result.transactions).toHaveLength(3);
            expect(result.warnings).toEqual([]);
        });

        test('single statement results have no warnings field', () => {
            const result = parser.parse(mt940(...HEADER, ...debitTx, ...FOOTER_1TX));
            expect(result).not.toHaveProperty('warnings');
        });
    });

    describe('reversals and funds code', () => {
        // Closing balance must match: the library rejects a wrong sign.
        const parseOne = (txLine, closing) =>
            parser.parse(mt940(...HEADER, txLine, `:62F:C260131EUR${closing}`)).transactions[0];

        test('RC (reversal of credit) is money out and flagged as reversal', () => {
            const tx = parseOne(':61:2601020102RC50,00NMSCREF', '950,00');
            expect(tx.reversal).toBe(true);
            expect(tx.amount).toBe(-50);
            expect(tx.isDebit).toBe(true);
        });

        test('RD (reversal of debit) is money in and flagged as reversal', () => {
            const tx = parseOne(':61:2601020102RD50,00NMSCREF', '1050,00');
            expect(tx.reversal).toBe(true);
            expect(tx.amount).toBe(50);
            expect(tx.isDebit).toBe(false);
        });

        test('wrong closing balance for a reversal is rejected', () => {
            expect(() => parseOne(':61:2601020102RC50,00NMSCREF', '1050,00')).toThrow();
        });

        test('normal bookings are not reversals and have no funds code', () => {
            const tx = parseOne(':61:2601020102D50,00NMSCREF', '950,00');
            expect(tx.reversal).toBe(false);
            expect(tx.fundsCode).toBe('');
        });

        test('funds code is exposed when present', () => {
            const tx = parseOne(':61:2601020102CR50,00NMSCREF', '1050,00');
            expect(tx.fundsCode).toBe('R');
            expect(tx.reversal).toBe(false);
        });

        test('reversal and funds code can combine', () => {
            const tx = parseOne(':61:2601020102RCR50,00NMSCREF', '950,00');
            expect(tx.reversal).toBe(true);
            expect(tx.fundsCode).toBe('R');
            expect(tx.amount).toBe(-50);
        });

        test('public/sample.mt940 contains exactly one reversal', () => {
            const text = require('fs').readFileSync(
                require('path').join(__dirname, '..', 'public', 'sample.mt940'), 'utf8');
            const result = parser.parse(text);
            expect(result.transactions.filter(t => t.reversal)).toHaveLength(1);
        });
    });

    describe('invalid input', () => {
        test.each([
            ['empty string', ''],
            ['whitespace only', '   \n  \n'],
            ['garbage text', 'this is not an MT940 file'],
        ])('throws for %s', (_name, input) => {
            expect(() => parser.parse(input)).toThrow(/Failed to parse MT940 file/);
            expect(() => parser.parse(input)).toThrow(/No valid MT940 statements/);
        });
    });

    describe('formatAmount', () => {
        test('formats with the given locale', () => {
            expect(MT940Parser.formatAmount(1234.56, 'de-DE')).toBe('1.234,56');
            expect(MT940Parser.formatAmount(1234.56, 'en-US')).toBe('1,234.56');
            expect(MT940Parser.formatAmount(5, 'de-DE')).toBe('5,00');
        });

        test('defaults to the runtime locale', () => {
            const expected = new Intl.NumberFormat(undefined, {
                minimumFractionDigits: 2, maximumFractionDigits: 2,
            }).format(1234.56);
            expect(MT940Parser.formatAmount(1234.56)).toBe(expected);
        });
    });

    describe('formatDate', () => {
        test('shows the stored calendar day regardless of local timezone', () => {
            expect(MT940Parser.formatDate('2026-01-02', 'en-US')).toBe('January 2, 2026');
            expect(MT940Parser.formatDate('2026-10-25', 'en-US')).toBe('October 25, 2026');
        });

        test('formats with the given locale', () => {
            expect(MT940Parser.formatDate('2026-01-02', 'de-DE')).toBe('2. Januar 2026');
            expect(MT940Parser.formatDate('2026-10-25', 'de-DE')).toBe('25. Oktober 2026');
        });

        test('defaults to the runtime locale', () => {
            const expected = new Date(Date.UTC(2026, 0, 2)).toLocaleDateString(undefined, {
                timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric',
            });
            expect(MT940Parser.formatDate('2026-01-02')).toBe(expected);
        });
    });
});

describe('transaction ids', () => {
    const parser = new MT940Parser();
    const stmt = (ref, num, openDate, open, txs, closeDate, close) => [
        `:20:${ref}`, ':25:12345678/9876543210', `:28C:${num}/1`,
        `:60F:C${openDate}EUR${open}`, ...txs.flat(), `:62F:C${closeDate}EUR${close}`,
    ];

    test('single statement: ids are the positions 0..n-1', () => {
        const r = parser.parse(mt940(...HEADER, ...debitTx, ...creditTx, ...FOOTER_2TX));
        expect(r.transactions.map(t => t.id)).toEqual([0, 1]);
    });

    test('multiple statements: ids follow the merged chronological order', () => {
        const jan = stmt('S1', 1, '260101', '1000,00', [debitTx], '260131', '749,50');
        const feb = stmt('S2', 2, '260201', '749,50', [creditTx], '260228', '849,50');
        const r = parser.parse(mt940(...feb, ...jan));
        expect(r.transactions.map(t => t.id)).toEqual([0, 1]);
        expect(r.transactions.map(t => t.amount)).toEqual([-250.5, 100]);
    });

    test('5,000 transactions get unique ids', () => {
        const txs = [];
        for (let i = 0; i < 5000; i++) txs.push([':61:2601020102C1,00NTRFNONREF', `:86:166?00Test ${i}`]);
        const r = parser.parse(mt940(...stmt('BIG', 1, '260101', '0,00', txs, '260131', '5000,00')));
        expect(r.transactions).toHaveLength(5000);
        expect(new Set(r.transactions.map(t => t.id)).size).toBe(5000);
        expect(r.transactions[4999].id).toBe(4999);
    });
});
