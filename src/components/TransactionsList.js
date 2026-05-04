import React, { useState, useMemo } from 'react';
import TransactionCard from './TransactionCard';
import SummaryModal from './SummaryModal';
import './TransactionsList.css';

const DIRECTION_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: '💰 Incoming' },
  { key: 'debit', label: '💸 Outgoing' },
];

const AMOUNT_FILTERS = [
  { key: 'all', label: 'Any amount' },
  { key: 'small', label: '< 100' },
  { key: 'medium', label: '100 – 1 000' },
  { key: 'large', label: '> 1 000' },
];

const DATE_FILTERS = [
  { key: 'all', label: 'All time' },
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: '180', label: 'Last 180 days' },
  { key: '270', label: 'Last 270 days' },
];

const SORT_FIELDS = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

function TransactionsList({ transactions, currency }) {
  const [direction, setDirection] = useState('all');
  const [amountRange, setAmountRange] = useState('all');
  const [txType, setTxType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('asc');
  const [showSummary, setShowSummary] = useState(false);

  // Derive unique transaction codes present in the data
  const txTypes = useMemo(() => {
    if (!transactions) return [];
    const codes = [...new Set(transactions.map((t) => t.transactionCode).filter(Boolean))];
    return codes.sort();
  }, [transactions]);

  const dateThreshold = useMemo(() => {
    if (dateRange === 'all') return null;
    // Use the most recent booking date in the file as the reference point
    // so the filter still works on historical files.
    const dates = (transactions || [])
      .map((t) => t.bookingDate)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((n) => !isNaN(n));
    const latest = dates.length ? Math.max(...dates) : Date.now();
    const cutoff = new Date(latest);
    cutoff.setDate(cutoff.getDate() - Number(dateRange));
    return cutoff;
  }, [dateRange, transactions]);

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

  const filtered = transactions.filter((t) => {
    // Direction
    if (direction === 'credit' && t.isDebit) return false;
    if (direction === 'debit' && !t.isDebit) return false;

    // Amount range
    const abs = Math.abs(t.amount);
    if (amountRange === 'small' && abs >= 100) return false;
    if (amountRange === 'medium' && (abs < 100 || abs > 1000)) return false;
    if (amountRange === 'large' && abs <= 1000) return false;

    // Transaction type
    if (txType !== 'all' && t.transactionCode !== txType) return false;

    // Date range
    if (dateThreshold && t.bookingDate) {
      if (new Date(t.bookingDate) < dateThreshold) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'date') {
      aVal = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
      bVal = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
    } else {
      aVal = Math.abs(a.amount ?? 0);
      bVal = Math.abs(b.amount ?? 0);
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const hasActiveFilters = direction !== 'all' || amountRange !== 'all' || txType !== 'all' || dateRange !== 'all';

  function resetFilters() {
    setDirection('all');
    setAmountRange('all');
    setTxType('all');
    setDateRange('all');
  }

  return (
    <div className="transactions-list">
      {showSummary && (
        <SummaryModal
          transactions={transactions}
          currency={currency}
          onClose={() => setShowSummary(false)}
        />
      )}
      <div className="transactions-header">
        <div className="transactions-header-top">
          <h3>Transactions</h3>
          <p className="transactions-count">
            {filtered.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </p>
          <button className="summarize-btn" onClick={() => setShowSummary(true)}>
            📊 Summarize
          </button>
          {hasActiveFilters && (
            <button className="reset-filters-btn" onClick={resetFilters}>
              ✕ Reset filters
            </button>
          )}
        </div>

        <div className="filter-groups">
          <div className="filter-group">
            <span className="filter-group-label">Period</span>
            <div className="transactions-filters">
              {DATE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${dateRange === f.key ? ' active' : ''}`}
                  onClick={() => setDateRange(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Direction</span>
            <div className="transactions-filters">
              {DIRECTION_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${direction === f.key ? ' active' : ''}`}
                  onClick={() => setDirection(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Amount</span>
            <div className="transactions-filters">
              {AMOUNT_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${amountRange === f.key ? ' active' : ''}`}
                  onClick={() => setAmountRange(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Sort</span>
            <div className="transactions-filters">
              {SORT_FIELDS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${sortField === f.key ? ' active' : ''}`}
                  onClick={() => setSortField(f.key)}
                >
                  {f.label}
                </button>
              ))}
              <button
                className="filter-btn sort-dir-btn"
                onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          {txTypes.length > 0 && (
            <div className="filter-group">
              <span className="filter-group-label">Type</span>
              <div className="transactions-filters">
                <button
                  className={`filter-btn${txType === 'all' ? ' active' : ''}`}
                  onClick={() => setTxType('all')}
                >
                  All
                </button>
                {txTypes.map((code) => (
                  <button
                    key={code}
                    className={`filter-btn${txType === code ? ' active' : ''}`}
                    onClick={() => setTxType(code)}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No transactions match the selected filters</p>
        </div>
      ) : (
        <div className="transactions-grid">
          {sorted.map((transaction, index) => (
            <TransactionCard
              key={index}
              transaction={transaction}
              currency={currency}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TransactionsList;
