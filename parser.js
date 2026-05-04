/**
 * MT940 Parser
 * Parses MT940 bank statement files
 */

class MT940Parser {
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
            const lines = content.split(/\r?\n/);
            let currentMessage = [];

            // Group lines by message (messages start with :20: and may span multiple lines)
            for (let line of lines) {
                if (line.startsWith(':') && currentMessage.length > 0) {
                    this.processMessage(currentMessage.join('\n'));
                    currentMessage = [line];
                } else if (line.trim()) {
                    currentMessage.push(line);
                }
            }

            // Process last message
            if (currentMessage.length > 0) {
                this.processMessage(currentMessage.join('\n'));
            }

            if (this.statements.length === 0) {
                throw new Error('No valid MT940 statements found in the file');
            }

            return this.statements[0]; // Return the first statement
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

        for (const [tag, value] of Object.entries(fields)) {
            this.processField(statement, tag, value);
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
        const tagPattern = /:[0-9]{2}[A-Z]?:/g;
        let lastIndex = 0;
        let match;

        while ((match = tagPattern.exec(message)) !== null) {
            if (lastIndex > 0) {
                const tag = message.substring(lastIndex + 1, lastIndex + 3);
                const value = message.substring(lastIndex + 4, match.index).trim();
                if (value) {
                    if (!fields[tag]) {
                        fields[tag] = [];
                    }
                    fields[tag].push(value);
                }
            }
            lastIndex = match.index;
        }

        // Get last field
        if (lastIndex > 0) {
            const tag = message.substring(lastIndex + 1, lastIndex + 3);
            const value = message.substring(lastIndex + 4).trim();
            if (value) {
                if (!fields[tag]) {
                    fields[tag] = [];
                }
                fields[tag].push(value);
            }
        }

        return fields;
    }

    /**
     * Process individual MT940 field
     * @param {object} statement - The statement object to update
     * @param {string} tag - The MT940 field tag
     * @param {array} values - Array of values for this tag
     */
    processField(statement, tag, values) {
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

            case '61': // Transaction Details
                const transaction = this.parseTransactionLine(values[0]);
                if (transaction) {
                    statement.transactions.push(transaction);
                }
                break;

            case '62': // Closing Balance
                const closingData = this.parseBalanceLine(values[0]);
                if (closingData) {
                    statement.closingBalance = closingData.amount;
                    statement.statementPeriod.endDate = closingData.date;
                }
                break;

            case '86': // Transaction Details (continuation)
                if (statement.transactions.length > 0) {
                    statement.transactions[statement.transactions.length - 1].details = values[0];
                }
                break;

            case 'NS': // Additional Details
                statement.additionalDetails = values.join(' ');
                break;
        }
    }

    /**
     * Parse balance line (format: YYMMDD[C/D]amount[currency])
     * @param {string} line - The balance line
     * @returns {object} - Parsed balance data
     */
    parseBalanceLine(line) {
        // Format: YYMMDDCAMOUNTCURRENCY or similar variations
        const match = line.match(/^(\d{6})([CD])([0-9,]+)([A-Z]{3})?/);
        if (!match) return null;

        const date = this.parseDate(match[1]);
        const isDebit = match[2] === 'D';
        const amount = parseFloat(match[3].replace(',', '.')) * (isDebit ? -1 : 1);
        const currency = match[4] || '';

        return { date, amount, currency };
    }

    /**
     * Parse transaction line (format: YYMMDDMMDDCCAMOUNTPTX)
     * @param {string} line - The transaction line
     * @returns {object} - Parsed transaction data
     */
    parseTransactionLine(line) {
        // Format: YYMMDD[MMDD]C[AMOUNT][PTX]
        // YYMMDD: Booking date
        // MMDD: Value date (optional)
        // C: Debit/Credit (D/C)
        // AMOUNT: Amount
        // PTX: Transaction code

        const match = line.match(/^(\d{6})(\d{0,4})?([CD])([0-9,]+)([A-Z]{4})?(.*)$/);
        if (!match) return null;

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
