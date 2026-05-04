import React from 'react';
import { MT940Parser } from '../parser';
import './TransactionCard.css';

function TransactionCard({ transaction, currency, index }) {
  const isDebit = transaction.isDebit;
  const amount = Math.abs(transaction.amount);

  return (
    <div className="transaction-card" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="transaction-header">
        <div className="transaction-info">
          <div className="transaction-date">{MT940Parser.formatDate(transaction.bookingDate)}</div>
          <span className={`transaction-type ${isDebit ? 'debit' : 'credit'}`}>
            {isDebit ? '💸 Debit' : '💰 Credit'}
          </span>
        </div>
        <div className={`transaction-amount ${isDebit ? 'debit' : 'credit'}`}>
          <span>{isDebit ? '−' : '+'}</span>
          <span>{MT940Parser.formatAmount(amount)}</span>
          <span className="amount-currency">{currency}</span>
        </div>
      </div>

      <div className="transaction-details">
        {transaction.transactionCode && (
          <div className="detail-item">
            <div className="detail-label">Transaction Code</div>
            <div className="detail-value">{transaction.transactionCode}</div>
          </div>
        )}

        {transaction.description && (
          <div className="detail-item">
            <div className="detail-label">Description</div>
            <div className="detail-value">{transaction.description}</div>
          </div>
        )}

        {transaction.details && (
          <div className="detail-item">
            <div className="detail-label">Details</div>
            <div className="detail-value">{transaction.details}</div>
          </div>
        )}

        {transaction.sender && (
          <div className="detail-item">
            <div className="detail-label">Sender</div>
            <div className="detail-value">{transaction.sender}</div>
          </div>
        )}

        {transaction.receiver && (
          <div className="detail-item">
            <div className="detail-label">Receiver</div>
            <div className="detail-value">{transaction.receiver}</div>
          </div>
        )}

        {transaction.reference && (
          <div className="detail-item">
            <div className="detail-label">Reference</div>
            <div className="detail-value">{transaction.reference}</div>
          </div>
        )}

        {transaction.counterpartyIban && (
          <div className="detail-item">
            <div className="detail-label">IBAN</div>
            <div className="detail-value">{transaction.counterpartyIban}</div>
          </div>
        )}

        {transaction.counterpartyBic && (
          <div className="detail-item">
            <div className="detail-label">BIC</div>
            <div className="detail-value">{transaction.counterpartyBic}</div>
          </div>
        )}

        {!transaction.transactionCode &&
          !transaction.description &&
          !transaction.details &&
          !transaction.sender &&
          !transaction.receiver &&
          !transaction.reference && (
            <div className="detail-item">
              <div className="detail-value empty">No additional details available</div>
            </div>
          )}
      </div>
    </div>
  );
}

export default TransactionCard;
