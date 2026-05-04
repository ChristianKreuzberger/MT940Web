import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import './ParseReportModal.css';

function ParseReportModal({ result, error, fileName, onClose }) {
  const [copied, setCopied] = useState(false);
  const [rawCopied, setRawCopied] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(error).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const rawJson = result ? JSON.stringify(result, null, 2) : null;

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawJson).then(() => {
      setRawCopied(true);
      setTimeout(() => setRawCopied(false), 2000);
    });
  };

  const isSuccess = !error && result;

  return (
    <div className="parse-report-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Parse Report">
      <div className="parse-report-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`parse-report-header ${isSuccess ? 'success' : 'failure'}`}>
          <div className="parse-report-title">
            {isSuccess
              ? <><CheckCircle size={20} /> Parse Report — Success</>
              : <><AlertCircle size={20} /> Parse Report — Failed</>
            }
          </div>
          <button className="parse-report-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="parse-report-body">
          {fileName && (
            <div className="parse-report-filename">
              <span className="parse-report-label">File</span>
              <span className="parse-report-value">{fileName}</span>
            </div>
          )}

          {isSuccess ? (
            <>
              <div className="parse-report-stats">
                {result.accountNumber && (
                  <div className="parse-stat-row">
                    <span className="parse-stat-label">Account</span>
                    <span className="parse-stat-value">{result.accountNumber}</span>
                  </div>
                )}
                {result.bankCode && (
                  <div className="parse-stat-row">
                    <span className="parse-stat-label">Bank Code</span>
                    <span className="parse-stat-value">{result.bankCode}</span>
                  </div>
                )}
                {result.currency && (
                  <div className="parse-stat-row">
                    <span className="parse-stat-label">Currency</span>
                    <span className="parse-stat-value">{result.currency}</span>
                  </div>
                )}
                {result.openingBalance != null && (
                  <div className="parse-stat-row">
                    <span className="parse-stat-label">Opening Balance</span>
                    <span className="parse-stat-value">{result.openingBalance}</span>
                  </div>
                )}
                {result.closingBalance != null && (
                  <div className="parse-stat-row">
                    <span className="parse-stat-label">Closing Balance</span>
                    <span className="parse-stat-value">{result.closingBalance}</span>
                  </div>
                )}
                <div className="parse-stat-row">
                  <span className="parse-stat-label">Transactions</span>
                  <span className="parse-stat-value parse-stat-highlight">
                    {result.transactions?.length ?? 0}
                  </span>
                </div>
                {result.statementNumber && (
                  <div className="parse-stat-row">
                    <span className="parse-stat-label">Statement #</span>
                    <span className="parse-stat-value">{result.statementNumber}</span>
                  </div>
                )}
              </div>

              <div className="parse-raw-section">
                <button className="parse-raw-toggle" onClick={() => setRawOpen(o => !o)}>
                  {rawOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Raw parsed data (JSON)
                </button>
                {rawOpen && (
                  <div className="parse-raw-body">
                    <pre className="parse-raw-json">{rawJson}</pre>
                    <button className="parse-copy-btn parse-copy-btn--raw" onClick={handleCopyRaw}>
                      {rawCopied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy JSON</>}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="parse-error-section">
              <div className="parse-error-label">
                <AlertCircle size={14} /> Error Message
              </div>
              <pre className="parse-error-message">{error}</pre>
              <button className="parse-copy-btn" onClick={handleCopy}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Error</>}
              </button>
            </div>
          )}
        </div>

        <div className="parse-report-footer">
          <button className="btn btn-primary" onClick={onClose}>
            {isSuccess ? 'View Results' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ParseReportModal;
