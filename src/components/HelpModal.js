import React, { useEffect } from 'react';
import { X, FileText, Upload, Download, Shield, Zap } from 'lucide-react';
import './HelpModal.css';

function HelpModal({ onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="help-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Help">
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>How to use MT940 Parser</h2>
          <button className="help-modal-close" onClick={onClose} aria-label="Close help">
            <X size={18} />
          </button>
        </div>

        <div className="help-modal-body">
          <section className="help-section">
            <h3><FileText size={16} /> What is MT940?</h3>
            <p>
              MT940 is a standard file format used by banks to deliver electronic account statements.
              It contains transaction records including amounts, dates, references, and descriptions.
            </p>
          </section>

          <section className="help-section">
            <h3><Upload size={16} /> Uploading a file</h3>
            <ul>
              <li>Click the upload area or drag and drop your <code>.mt940</code> / <code>.sta</code> file onto it.</li>
              <li>The file is parsed entirely in your browser — nothing is sent to any server.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3><Zap size={16} /> Reading the results</h3>
            <ul>
              <li><strong>Statement Info</strong> — shows account number, bank BIC, opening &amp; closing balances.</li>
              <li><strong>Transactions</strong> — lists every transaction with date, amount, and description.</li>
              <li>Use the search / filter bar to narrow down transactions.</li>
            </ul>
          </section>

          <section className="help-section">
            <h3><Download size={16} /> Exporting data</h3>
            <p>
              Click <strong>Export JSON</strong> to download all parsed data as a structured JSON file,
              ready for import into spreadsheets or other tools.
            </p>
          </section>

          <section className="help-section">
            <h3><Shield size={16} /> Privacy</h3>
            <p>
              All processing happens locally in your browser. Your bank data never leaves your device.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
