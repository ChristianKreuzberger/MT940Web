import React, { useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { MT940Parser } from '../parser';
import './SummaryModal.css';

const COUNTRY_NAMES = {
  AD: 'Andorra', AE: 'UAE', AL: 'Albania', AT: 'Austria', AZ: 'Azerbaijan',
  BA: 'Bosnia & Herzegovina', BE: 'Belgium', BG: 'Bulgaria', BH: 'Bahrain',
  BR: 'Brazil', BY: 'Belarus', CH: 'Switzerland', CY: 'Cyprus',
  CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark', DO: 'Dominican Republic',
  EE: 'Estonia', EG: 'Egypt', ES: 'Spain', FI: 'Finland', FO: 'Faroe Islands',
  FR: 'France', GB: 'United Kingdom', GE: 'Georgia', GI: 'Gibraltar',
  GL: 'Greenland', GR: 'Greece', GT: 'Guatemala', HR: 'Croatia',
  HU: 'Hungary', IE: 'Ireland', IL: 'Israel', IS: 'Iceland', IT: 'Italy',
  JO: 'Jordan', KW: 'Kuwait', KZ: 'Kazakhstan', LB: 'Lebanon',
  LC: 'Saint Lucia', LI: 'Liechtenstein', LT: 'Lithuania', LU: 'Luxembourg',
  LV: 'Latvia', MC: 'Monaco', MD: 'Moldova', ME: 'Montenegro', MK: 'North Macedonia',
  MR: 'Mauritania', MT: 'Malta', MU: 'Mauritius', NL: 'Netherlands',
  NO: 'Norway', PK: 'Pakistan', PL: 'Poland', PS: 'Palestine',
  PT: 'Portugal', QA: 'Qatar', RO: 'Romania', RS: 'Serbia',
  SA: 'Saudi Arabia', SC: 'Seychelles', SE: 'Sweden', SI: 'Slovenia',
  SK: 'Slovakia', SM: 'San Marino', ST: 'São Tomé & Príncipe', SV: 'El Salvador',
  TL: 'East Timor', TN: 'Tunisia', TR: 'Turkey', UA: 'Ukraine',
  VA: 'Vatican', VG: 'British Virgin Islands', XK: 'Kosovo',
};

function groupBy(transactions, keyFn, label = 'key') {
  const groups = {};
  for (const t of transactions) {
    const key = keyFn(t) || '(unknown)';
    if (!groups[key]) groups[key] = { count: 0, totalCredit: 0, totalDebit: 0 };
    groups[key].count++;
    if (t.isDebit) groups[key].totalDebit += Math.abs(t.amount);
    else groups[key].totalCredit += Math.abs(t.amount);
  }
  return Object.entries(groups).sort((a, b) => b[1].count - a[1].count);
}

function getCountryFromIban(iban) {
  if (!iban || iban.length < 2) return null;
  const code = iban.slice(0, 2).toUpperCase();
  return COUNTRY_NAMES[code] ? `${code} – ${COUNTRY_NAMES[code]}` : code;
}

function fmt(amount, currency) {
  return `${MT940Parser.formatAmount(amount)} ${currency}`;
}

function SummarySection({ title, rows, currency }) {
  if (!rows || rows.length === 0) return null;
  const hasOnlyUnknown = rows.length === 1 && rows[0][0] === '(unknown)';
  if (hasOnlyUnknown) return null;

  return (
    <section className="summary-section">
      <h3 className="summary-section-title">{title}</h3>
      <table className="summary-table">
        <thead>
          <tr>
            <th>Value</th>
            <th className="num">Count</th>
            <th className="num">Credit</th>
            <th className="num">Debit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, { count, totalCredit, totalDebit }]) => (
            <tr key={key}>
              <td className="summary-key">{key}</td>
              <td className="num">{count}</td>
              <td className="num credit">{totalCredit > 0 ? fmt(totalCredit, currency) : '—'}</td>
              <td className="num debit">{totalDebit > 0 ? fmt(totalDebit, currency) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SummaryModal({ transactions, currency, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const summary = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    const amountBuckets = groupBy(transactions, (t) => {
      const abs = Math.abs(t.amount);
      if (abs < 100) return '< 100';
      if (abs <= 1000) return '100 – 1 000';
      if (abs <= 10000) return '1 000 – 10 000';
      return '> 10 000';
    });

    const byReceiver = groupBy(transactions, (t) => t.receiver || null);
    const byCode = groupBy(transactions, (t) => t.transactionCode || null);
    const bySender = groupBy(transactions, (t) => t.sender || null);
    const byCountry = groupBy(transactions, (t) => getCountryFromIban(t.counterpartyIban));

    const totalCredit = transactions.filter((t) => !t.isDebit).reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalDebit = transactions.filter((t) => t.isDebit).reduce((s, t) => s + Math.abs(t.amount), 0);

    return { amountBuckets, byReceiver, byCode, bySender, byCountry, totalCredit, totalDebit };
  }, [transactions]);

  return (
    <div className="summary-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Transaction Summary">
      <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="summary-modal-header">
          <h2>Transaction Summary</h2>
          <button className="summary-modal-close" onClick={onClose} aria-label="Close summary">
            <X size={18} />
          </button>
        </div>

        <div className="summary-modal-body">
          {summary && (
            <>
              <div className="summary-totals">
                <div className="summary-total-card credit">
                  <span className="summary-total-label">Total Credit</span>
                  <span className="summary-total-value">+{fmt(summary.totalCredit, currency)}</span>
                </div>
                <div className="summary-total-card debit">
                  <span className="summary-total-label">Total Debit</span>
                  <span className="summary-total-value">−{fmt(summary.totalDebit, currency)}</span>
                </div>
                <div className="summary-total-card neutral">
                  <span className="summary-total-label">Transactions</span>
                  <span className="summary-total-value">{transactions.length}</span>
                </div>
              </div>

              <SummarySection title="By Amount Range" rows={summary.amountBuckets} currency={currency} />
              <SummarySection title="By Transaction Code" rows={summary.byCode} currency={currency} />
              <SummarySection title="By Receiver" rows={summary.byReceiver} currency={currency} />
              <SummarySection title="By Sender" rows={summary.bySender} currency={currency} />
              <SummarySection title="By Country (IBAN)" rows={summary.byCountry} currency={currency} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SummaryModal;
