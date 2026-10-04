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
});
