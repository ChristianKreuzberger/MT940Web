import React from 'react';
import TransactionCard from './TransactionCard';
import './TransactionsList.css';

function TransactionsList({ transactions, currency }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="transactions-list">
        <div className="transactions-header">
          <h3>Transactions</h3>
        </div>
        <div className="empty-state">
          <p>No transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-list">
      <div className="transactions-header">
        <h3>Transactions</h3>
        <p className="transactions-count">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="transactions-grid">
        {transactions.map((transaction, index) => (
          <TransactionCard
            key={index}
            transaction={transaction}
            currency={currency}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default TransactionsList;
