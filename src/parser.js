/**
 * MT940 Parser – backed by @tripss/mt940js
 * The MT940Parser class exposes the same data shape the React components
 * already expect, plus the two static formatting helpers.
 */
import { Parser as LibParser } from '@tripss/mt940js';

export class MT940Parser {
    // ─── Public API ──────────────────────────────────────────────────────────

    parse(content) {
        try {
            const lib = new LibParser();
            const statements = lib.parse(content);

            if (!statements || statements.length === 0) {
                throw new Error('No valid MT940 statements found in the file');
            }

            if (statements.length === 1) {
                return this._adaptStatement(statements[0]);
            }

            // Multiple statement blocks in one file (e.g. daily exports merged
            // into a single file). Merge them: take metadata from the first,
            // closing balance/date from the last, and concatenate all transactions.
            const first = this._adaptStatement(statements[0]);
            const last  = this._adaptStatement(statements[statements.length - 1]);
            const allTransactions = statements.flatMap(s =>
                (s.transactions || []).map(t => this._adaptTransaction(t))
            );

            return {
                ...first,
                closingBalance: last.closingBalance,
                statementPeriod: {
                    startDate: first.statementPeriod.startDate,
                    endDate:   last.statementPeriod.endDate,
                },
                transactions: allTransactions,
                statementCount: statements.length,
            };
        } catch (err) {
            throw new Error(`Failed to parse MT940 file: ${err.message}`);
        }
    }

    // ─── Adapter ─────────────────────────────────────────────────────────────

    _adaptStatement(s) {
        // tag 25 gives "BANKCODE/ACCOUNTNUMBER"
        const accountParts = (s.accountIdentification || '').split('/');
        const bankCode = accountParts[0] || '';
        const accountNumber = accountParts.slice(1).join('/') || '';

        return {
            transactionReferenceNumber: s.transactionReference || '',
            relatedReference: s.relatedReference || '',
            bankCode,
            accountNumber,
            statementNumber: s.number?.statement || '',
            sequenceNumber: s.number?.sequence || '',
            openingBalance: s.openingBalance ?? null,
            closingBalance: s.closingBalance ?? null,
            statementPeriod: {
                startDate: MT940Parser._dateToISO(s.openingBalanceDate),
                endDate:   MT940Parser._dateToISO(s.closingBalanceDate),
            },
            currency: s.currency || '',
            transactions: (s.transactions || []).map(t => this._adaptTransaction(t)),
        };
    }

    _adaptTransaction(t) {
        const isDebit = t.amount < 0;
        const sd = t.structuredDetails || {};

        // Counterparty name: subfields ?32 + ?33
        const counterpartyName = ((sd['32'] || '') + (sd['33'] || '')).trim();

        // Purpose: concatenate ?20–?29 and ?60–?63, then extract SEPA tags
        const purposeParts = [];
        for (let i = 20; i <= 29; i++) {
            const v = sd[String(i).padStart(2, '0')];
            if (v) purposeParts.push(v);
        }
        for (let i = 60; i <= 63; i++) {
            const v = sd[String(i)];
            if (v) purposeParts.push(v);
        }
        const purposeRaw = purposeParts.join('');
        const sepa = MT940Parser._parseSepa(purposeRaw);

        const description = sepa['SVWZ'] || sd['00'] || '';
        const reference   = sepa['EREF'] || sepa['KREF'] || t.reference || '';

        return {
            bookingDate:      MT940Parser._dateToISO(t.date),
            isDebit,
            amount:           t.amount,
            type:             isDebit ? 'Debit' : 'Credit',
            transactionCode:  t.transactionType || '',
            description,
            reference,
            sender:           isDebit ? '' : counterpartyName,
            receiver:         isDebit ? counterpartyName : '',
            counterpartyIban: sd['31'] || '',
            counterpartyBic:  sd['30'] || '',
            details:          t.details || '',
            structuredDetails: sd,
            reversal:         t.isReversal || false,
            fundsCode:        t.fundsCode || '',
            mandateReference: sepa['MREF'] || '',
            creditorId:       sepa['CRED'] || '',
        };
    }

    // ─── Static helpers ───────────────────────────────────────────────────────

    /** Convert a Date object (or YYYY-MM-DD string) to a YYYY-MM-DD string. */
    static _dateToISO(d) {
        if (!d) return null;
        if (d instanceof Date) {
            const y  = d.getUTCFullYear();
            const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
            const dy = String(d.getUTCDate()).padStart(2, '0');
            return `${y}-${mo}-${dy}`;
        }
        return String(d);
    }

    /** Extract SEPA structured tags (SVWZ+, EREF+, KREF+, …) from a raw string. */
    static _parseSepa(raw) {
        const result = {};
        const re = /(EREF|KREF|MREF|CRED|DEBT|SVWZ|PURP|ABWE|ABWA)\+(.+?)(?=(?:EREF|KREF|MREF|CRED|DEBT|SVWZ|PURP|ABWE|ABWA)\+|$)/gs;
        let m;
        while ((m = re.exec(raw)) !== null) {
            result[m[1]] = m[2].trim();
        }
        return result;
    }

    static formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }

    static formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr + 'T00:00:00Z');
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return String(dateStr);
        }
    }
}
