import React, { useState, useMemo, useEffect } from 'react';
import TransactionCard from './TransactionCard';
import SummaryModal from './SummaryModal';
import { filterTransactions, sortTransactions } from '../transactionFilters';
import { PAGE_SIZE, visibleItems, nextCount, hasMore } from '../paging';
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
  { key: 'custom', label: 'Custom' },
];

const SORT_FIELDS = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

function TransactionsList({ transactions, currency, onFilteredChange }) {
  const [direction, setDirection] = useState('all');
  const [amountRange, setAmountRange] = useState('all');
  const [txType, setTxType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('asc');
  const [showSummary, setShowSummary] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Back to the first page whenever the filters, sort or data change. Done
  // during render (not by remounting the grid) so expanded cards stay open.
  const pagingSig = [direction, amountRange, txType, dateRange, customFrom, customTo, sortField, sortDir].join('|');
  const [pagedFor, setPagedFor] = useState({ pagingSig, transactions });
  if (pagedFor.pagingSig !== pagingSig || pagedFor.transactions !== transactions) {
    setPagedFor({ pagingSig, transactions });
    setVisibleCount(PAGE_SIZE);
  }

  // Derive unique transaction codes present in the data
  const txTypes = useMemo(() => {
    if (!transactions) return [];
    const codes = [...new Set(transactions.map((t) => t.transactionCode).filter(Boolean))];
    return codes.sort();
  }, [transactions]);

  const filtered = useMemo(
    () => filterTransactions(transactions || [], { direction, amountRange, txType, dateRange, customFrom, customTo }),
    [transactions, direction, amountRange, txType, dateRange, customFrom, customTo]
  );
  const sorted = useMemo(() => sortTransactions(filtered, sortField, sortDir), [filtered, sortField, sortDir]);

  // Lets the parent (CSV export) see what is currently displayed. Keyed on the
  // memoized array so it only fires when the result really changes.
  useEffect(() => {
    if (onFilteredChange) onFilteredChange(sorted);
  }, [sorted, onFilteredChange]);

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

  const hasActiveFilters = direction !== 'all' || amountRange !== 'all' || txType !== 'all' || dateRange !== 'all';

  function resetFilters() {
    setDirection('all');
    setAmountRange('all');
    setTxType('all');
    setDateRange('all');
    setCustomFrom('');
    setCustomTo('');
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
                  aria-pressed={dateRange === f.key}
                  onClick={() => setDateRange(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {dateRange === 'custom' && (
              <div className="custom-range">
                <label>
                  From
                  <input type="date" value={customFrom} max={customTo || undefined}
                    onChange={(e) => setCustomFrom(e.target.value)} />
                </label>
                <label>
                  To
                  <input type="date" value={customTo} min={customFrom || undefined}
                    onChange={(e) => setCustomTo(e.target.value)} />
                </label>
              </div>
            )}
          </div>

          <div className="filter-group">
            <span className="filter-group-label">Direction</span>
            <div className="transactions-filters">
              {DIRECTION_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${direction === f.key ? ' active' : ''}`}
                  aria-pressed={direction === f.key}
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
                  aria-pressed={amountRange === f.key}
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
                  aria-pressed={sortField === f.key}
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
                  aria-pressed={txType === 'all'}
                  onClick={() => setTxType('all')}
                >
                  All
                </button>
                {txTypes.map((code) => (
                  <button
                    key={code}
                    className={`filter-btn${txType === code ? ' active' : ''}`}
                    aria-pressed={txType === code}
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
          {visibleItems(sorted, visibleCount).map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              currency={currency}
            />
          ))}
        </div>
      )}
      {hasMore(visibleCount, sorted.length) && (
        <button
          className="filter-btn show-more-btn"
          onClick={() => setVisibleCount((c) => nextCount(c, sorted.length))}
        >
          Show more (showing {visibleCount} of {sorted.length})
        </button>
      )}
    </div>
  );
}

export default TransactionsList;
