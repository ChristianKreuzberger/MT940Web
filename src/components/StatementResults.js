import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import StatementInfo from './StatementInfo';
import TransactionsList from './TransactionsList';
import BalanceChart from './BalanceChart';
import './StatementResults.css';

function StatementResults({ data, onClear, onExport, onExportCsv }) {
  // null until the list reports its filtered view; then fall back to all rows.
  const [filteredTx, setFilteredTx] = useState(null);
  const allTx = data.transactions || [];
  const shownTx = filteredTx || allTx;

  return (
    <div className="statement-results">
      <div className="results-header">
        <h2>Statement Details</h2>
        <div className="results-actions">
          <button className="btn btn-primary" onClick={onExport}>
            <Download size={18} />
            Export JSON
          </button>
          <button className="btn btn-primary" onClick={() => onExportCsv(allTx, { filtered: false })}>
            <Download size={18} />
            Export CSV (all {allTx.length})
          </button>
          <button
            className="btn btn-primary"
            disabled={shownTx.length === 0}
            onClick={() => onExportCsv(shownTx, { filtered: true })}
          >
            <Download size={18} />
            Export CSV (filtered {shownTx.length})
          </button>
          <button className="btn btn-danger" onClick={onClear}>
            <Trash2 size={18} />
            Clear
          </button>
        </div>
      </div>

      <StatementInfo data={data} />
      <BalanceChart
        transactions={data.transactions}
        openingBalance={data.openingBalance}
        closingBalance={data.closingBalance}
        currency={data.currency}
      />
      <TransactionsList
        transactions={data.transactions}
        currency={data.currency}
        onFilteredChange={setFilteredTx}
      />
    </div>
  );
}

export default StatementResults;
