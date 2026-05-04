/**
 * MT940 Parser
 * Parses MT940 bank statement files
 */

export class MT940Parser {
    constructor() {
        this.statements = [];
        this.currentStatement = null;
    }

    /**
     * Parse MT940 file content
     * @param {string} content - The raw MT940 file content
     * @returns {object} - Parsed statement data
     */
    parse(content) {
        try {
            this.statements = [];
            // Split on the "-" delimiter that separates messages
            const messages = content.split('-').filter(m => m.trim());

            for (const message of messages) {
                this.processMessage(message);
            }

            if (this.statements.length === 0) {
                throw new Error('No valid MT940 statements found in the file');
            }

            const result = this.statements[0]; // Return the first statement
            return result;
        } catch (error) {
            throw new Error(`Failed to parse MT940 file: ${error.message}`);
        }
    }

    /**
     * Process a single MT940 message
     * @param {string} message - A complete MT940 message
     */
    processMessage(message) {
        const statement = {
            transactionReferenceNumber: '',
            relatedReference: '',
            bankCode: '',
            accountNumber: '',
            statementNumber: '',
            sequenceNumber: '',
            openingBalance: null,
            closingBalance: null,
            statementPeriod: {
                startDate: null,
                endDate: null
            },
            currency: '',
            transactions: [],
            messageDate: null
        };

        // Extract fields using regex patterns
        const fields = this.extractFields(message);
        const txnDetailsMap = fields['__txnDetails'] || [];

        for (const [tag, value] of Object.entries(fields)) {
            // Skip internal metadata
            if (tag.startsWith('__')) {
                continue;
            }
            this.processField(statement, tag, value, txnDetailsMap);
        }

        if (statement.transactions.length > 0 || statement.accountNumber) {
            this.statements.push(statement);
        }
    }

    /**
     * Extract MT940 fields from message
     * @param {string} message - The message content
     * @returns {object} - Object with tag: value pairs
     */
    extractFields(message) {
        const fields = {};
        const fieldOrder = []; // Track the order of fields as they appear
        const tagPattern = /:[0-9]{2}[A-Z]?:/g;
        const matches = Array.from(message.matchAll(tagPattern));

        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const nextMatch = matches[i + 1];

            const tagStart = currentMatch.index + 1;
            const tagEnd = currentMatch.index + 3;
            const tag = message.substring(tagStart, tagEnd);

            const valueStart = currentMatch.index + currentMatch[0].length;
            const valueEnd = nextMatch ? nextMatch.index : message.length;
            const value = message.substring(valueStart, valueEnd).trim();

            fieldOrder.push({ tag, value, index: i });

            if (value) {
                if (!fields[tag]) {
                    fields[tag] = [];
                }
                fields[tag].push(value);
            }
        }

        // Post-process to attach :86: details to preceding :61: transactions
        // by tracking them in a special metadata property
        if (fields['61']) {
            const txnWithDetails = [];
            let txnIndex = 0;
            
            for (let i = 0; i < fieldOrder.length; i++) {
                if (fieldOrder[i].tag === '61') {
                    txnWithDetails[txnIndex] = {
                        transaction: fieldOrder[i].value,
                        details: ''
                    };
                    // Look ahead for :86: tags that follow this :61:
                    for (let j = i + 1; j < fieldOrder.length; j++) {
                        if (fieldOrder[j].tag === '86') {
                            txnWithDetails[txnIndex].details = fieldOrder[j].value;
                            break;
                        } else if (fieldOrder[j].tag === '61') {
                            // Stop if we hit another transaction
                            break;
                        }
                    }
                    txnIndex++;
                }
            }
            
            // Store the metadata for use in processField
            fields['__txnDetails'] = txnWithDetails;
            // Replace :61: values with just the transaction lines
            fields['61'] = txnWithDetails.map(t => t.transaction);
        }

        return fields;
    }

    /**
     * Process individual MT940 field
     * @param {object} statement - The statement object to update
     * @param {string} tag - The MT940 field tag
     * @param {array} values - Array of values for this tag
     * @param {array} txnDetailsMap - Map of transaction details from extractFields
     */
    processField(statement, tag, values, txnDetailsMap = []) {
        if (!Array.isArray(values)) {
            values = [values];
        }

        switch (tag) {
            case '20': // Transaction Reference Number
                statement.transactionReferenceNumber = values[0];
                break;

            case '25': // Account Identification
                const accountParts = values[0].split('/');
                statement.bankCode = accountParts[0] || '';
                statement.accountNumber = accountParts[1] || '';
                break;

            case '28': // Statement Number
                const [statNum, seqNum] = values[0].split('/');
                statement.statementNumber = statNum;
                statement.sequenceNumber = seqNum;
                break;

            case '60': // Opening Balance
                const openingData = this.parseBalanceLine(values[0]);
                if (openingData) {
                    statement.openingBalance = openingData.amount;
                    statement.currency = openingData.currency;
                    statement.statementPeriod.startDate = openingData.date;
                }
                break;

            case '61': // Transaction Details (can have multiple)
                for (let i = 0; i < values.length; i++) {
                    const transaction = this.parseTransactionLine(values[i]);
                    if (transaction) {
                        // Attach details from the metadata map
                        if (txnDetailsMap[i]) {
                            transaction.details = txnDetailsMap[i].details;
                        }
                        statement.transactions.push(transaction);
                    }
                }
                break;

            case '62': // Closing Balance
                const closingData = this.parseBalanceLine(values[0]);
                if (closingData) {
                    statement.closingBalance = closingData.amount;
                    statement.statementPeriod.endDate = closingData.date;
                }
                break;

            case '86': // Transaction Details (continuation) - now handled in extractFields
                // Details are already attached to transactions during extraction
                break;

            case 'NS': // Additional Details
                statement.additionalDetails = values.join(' ');
                break;
            // eslint-disable-next-line default-case
        }
    }

    /**
     * Parse balance line (format: [C/D]YYMMDDCURRENCYAMOUNT or [C/D]YYMMDD[C/D]AMOUNTCURRENCY)
     * @param {string} line - The balance line
     * @returns {object} - Parsed balance data
     */
    parseBalanceLine(line) {
        let match;

        // Try format: [C/D]YYMMDDCURRENCYAMOUNT
        match = line.match(/^([CD])(\d{6})([A-Z]{3})([0-9,]+)/);
        if (match) {
            const date = this.parseDate(match[2]);
            const isDebit = match[1] === 'D';
            const currency = match[3];
            const amount = parseFloat(match[4].replace(',', '.')) * (isDebit ? -1 : 1);
            return { date, amount, currency };
        }

        // Try format: [F/D]YYMMDD[C/D]AMOUNTCURRENCY
        match = line.match(/^[FD]?(\d{6})([CD])([0-9,]+)([A-Z]{3})?/);
        if (match) {
            const date = this.parseDate(match[1]);
            const isDebit = match[2] === 'D';
            const amount = parseFloat(match[3].replace(',', '.')) * (isDebit ? -1 : 1);
            const currency = match[4] || '';
            return { date, amount, currency };
        }

        return null;
    }

    /**
     * Parse transaction line (format: YYMMDDMMDDCCAMOUNTPTX)
     * @param {string} line - The transaction line
     * @returns {object} - Parsed transaction data
     */
    parseTransactionLine(line) {
        // Format: YYMMDD[MMDD]C[AMOUNT][PTX]
        // YYMMDD: Booking date
        // MMDD: Value date (optional - can be 4 or 6 digits)
        // C: Debit/Credit (D/C)
        // AMOUNT: Amount
        // PTX: Transaction code

        // MT940 :61: booking record is always on the first line; subsequent
        // lines (e.g. reference continuations) must be ignored for the regex
        // to match correctly because .* does not cross newlines.
        line = line.split(/\r?\n/)[0].trim();

        // First try: YYMMDDYYMMDDCamountcode... (6+6+1+amount pattern)
        let match = line.match(/^(\d{6})(\d{6})([CD])([0-9,]+)([A-Z]{4})?(.*)$/);
        if (match) {
            const bookingDate = this.parseDate(match[1]);
            const isDebit = match[3] === 'D';
            const amount = parseFloat(match[4].replace(',', '.')) * (isDebit ? -1 : 1);
            const transactionCode = match[5] || '';
            const extraData = match[6] || '';

            return {
                bookingDate,
                isDebit,
                amount,
                type: isDebit ? 'Debit' : 'Credit',
                transactionCode,
                description: '',
                sender: '',
                receiver: '',
                reference: '',
                details: extraData
            };
        }

        // Second try: YYMMDDMMDDCAMOUNTCODE (6+4+1+amount pattern)
        match = line.match(/^(\d{6})(\d{4})([CD])([0-9,]+)([A-Z]{4})?(.*)$/);
        if (match) {
            const bookingDate = this.parseDate(match[1]);
            const isDebit = match[3] === 'D';
            const amount = parseFloat(match[4].replace(',', '.')) * (isDebit ? -1 : 1);
            const transactionCode = match[5] || '';
            const extraData = match[6] || '';

            return {
                bookingDate,
                isDebit,
                amount,
                type: isDebit ? 'Debit' : 'Credit',
                transactionCode,
                description: '',
                sender: '',
                receiver: '',
                reference: '',
                details: extraData
            };
        }

        // Third try: YYMMDDCAMOUNTCODE (no value date)
        match = line.match(/^(\d{6})([CD])([0-9,]+)([A-Z]{4})?(.*)$/);
        if (match) {
            const bookingDate = this.parseDate(match[1]);
            const isDebit = match[2] === 'D';
            const amount = parseFloat(match[3].replace(',', '.')) * (isDebit ? -1 : 1);
            const transactionCode = match[4] || '';
            const extraData = match[5] || '';

            return {
                bookingDate,
                isDebit,
                amount,
                type: isDebit ? 'Debit' : 'Credit',
                transactionCode,
                description: '',
                sender: '',
                receiver: '',
                reference: '',
                details: extraData
            };
        }

        return null;
    }

    /**
     * Parse date in YYMMDD format
     * @param {string} dateStr - Date string in YYMMDD format
     * @returns {string} - Formatted date string (YYYY-MM-DD)
     */
    parseDate(dateStr) {
        if (!dateStr || dateStr.length < 6) return '';

        const yy = parseInt(dateStr.substring(0, 2));
        const mm = dateStr.substring(2, 4);
        const dd = dateStr.substring(4, 6);

        // Assume 20xx for years 00-50, and 19xx for years 51-99
        const year = yy <= 50 ? 2000 + yy : 1900 + yy;

        return `${year}-${mm}-${dd}`;
    }

    /**
     * Format amount for display
     * @param {number} amount - The amount to format
     * @returns {string} - Formatted amount string
     */
    static formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Format date for display
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {string} - Formatted date
     */
    static formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr + 'T00:00:00Z');
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch {
            return dateStr;
        }
    }
}
