import React from 'react';
import { MT940Parser } from '../parser';
import './StatementInfo.css';

function StatementInfo({ data }) {
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
