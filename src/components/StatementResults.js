import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import StatementInfo from './StatementInfo';
import TransactionsList from './TransactionsList';
import './StatementResults.css';

function StatementResults({ data, onClear, onExport }) {
  return (
    <div className="statement-results">
      <div className="results-header">
        <h2>Statement Details</h2>
        <div className="results-actions">
          <button className="btn btn-primary" onClick={onExport}>
            <Download size={18} />
            Export JSON
          </button>
          <button className="btn btn-danger" onClick={onClear}>
            <Trash2 size={18} />
            Clear
          </button>
        </div>
      </div>

      <StatementInfo data={data} />
      <TransactionsList transactions={data.transactions} currency={data.currency} />
    </div>
  );
}

export default StatementResults;
