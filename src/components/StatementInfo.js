import React from 'react';
import { MT940Parser } from '../parser';
import './StatementInfo.css';

function StatementInfo({ data }) {
  const formatBalance = (amount) => {
    const formatted = MT940Parser.formatAmount(amount || 0);
    return amount < 0 ? `-${formatted}` : formatted;
  };

  const balanceClass = (amount) => {
    if (amount > 0) return 'balance-positive';
    if (amount < 0) return 'balance-negative';
    return '';
  };

  return (
    <div className="statement-info">
      <div className="info-grid">
        <div className="info-card">
          <div className="info-label">Account Number</div>
          <div className="info-value">{data.accountNumber || 'N/A'}</div>
        </div>

        <div className="info-card">
          <div className="info-label">Bank Code</div>
          <div className="info-value">{data.bankCode || 'N/A'}</div>
        </div>

        <div className="info-card">
          <div className="info-label">Currency</div>
          <div className="info-value">{data.currency || 'N/A'}</div>
        </div>

        <div className="info-card">
          <div className="info-label">Statement Period</div>
          <div className="info-value secondary">
            {MT940Parser.formatDate(data.statementPeriod.startDate)} to{' '}
            {MT940Parser.formatDate(data.statementPeriod.endDate)}
          </div>
        </div>

        <div className="info-card">
          <div className="info-label">Opening Balance</div>
          <div className={`info-value ${balanceClass(data.openingBalance)}`}>
            {formatBalance(data.openingBalance)}
          </div>
        </div>

        <div className="info-card">
          <div className="info-label">Closing Balance</div>
          <div className={`info-value ${balanceClass(data.closingBalance)}`}>
            {formatBalance(data.closingBalance)}
          </div>
        </div>

        <div className="info-card">
          <div className="info-label">Total Transactions</div>
          <div className="info-value">{data.transactions.length}</div>
        </div>

        <div className="info-card">
          <div className="info-label">Reference</div>
          <div className="info-value secondary">{data.transactionReferenceNumber || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}

export default StatementInfo;
