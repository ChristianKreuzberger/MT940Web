import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { MT940Parser } from '../parser';
import './BalanceChart.css';

function toDateKey(date) {
  return date instanceof Date
    ? date.toISOString().slice(0, 10)
    : String(date).slice(0, 10);
}

function formatXAxisDate(dateStr) {
  // dateStr is "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatYAxis(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function buildDailyBalanceData(transactions, openingBalance) {
  // Group net amount per day
  const byDay = {};
  transactions.forEach((tx) => {
    const key = toDateKey(tx.bookingDate);
    const signed = tx.isDebit ? -Math.abs(tx.amount) : Math.abs(tx.amount);
    byDay[key] = (byDay[key] || 0) + signed;
  });

  const days = Object.keys(byDay).sort();
  if (days.length === 0) return [];

  // Prepend the opening balance as the day before the first transaction
  const firstDay = days[0];
  const [y, m, d] = firstDay.split('-').map(Number);
  const prevDate = new Date(y, m - 1, d - 1);
  const openKey = prevDate.toISOString().slice(0, 10);

  const points = [{ date: openKey, balance: Math.round((openingBalance || 0) * 100) / 100 }];

  let balance = openingBalance || 0;
  days.forEach((day) => {
    balance = Math.round((balance + byDay[day]) * 100) / 100;
    points.push({ date: day, balance });
  });

  return points;
}

const CustomTooltip = ({ active, payload, currency }) => {
  if (!active || !payload || !payload.length) return null;
  const { date, balance } = payload[0].payload;
  const prev = payload[0].payload._prev;
  const change = prev !== undefined ? Math.round((balance - prev) * 100) / 100 : null;
  const label = formatXAxisDate(date);
  return (
    <div className="balance-chart-tooltip">
      <div className="tooltip-date">{label}</div>
      <div className={`tooltip-balance ${balance < 0 ? 'negative' : 'positive'}`}>
        {balance < 0 ? '−' : ''}{MT940Parser.formatAmount(Math.abs(balance))} {currency}
      </div>
      {change !== null && change !== 0 && (
        <div className={`tooltip-change ${change < 0 ? 'negative' : 'positive'}`}>
          {change > 0 ? '+' : '−'}{MT940Parser.formatAmount(Math.abs(change))}
        </div>
      )}
    </div>
  );
};

function BalanceChart({ transactions, openingBalance, currency }) {
  const rawData = buildDailyBalanceData(transactions, openingBalance);

  if (rawData.length === 0) return null;

  // Attach previous balance for tooltip delta
  const data = rawData.map((pt, i) => ({
    ...pt,
    _prev: i > 0 ? rawData[i - 1].balance : undefined,
  }));

  const allNegative = data.every((d) => d.balance <= 0);
  const hasNegative = data.some((d) => d.balance < 0);
  const areaColor = allNegative ? '#ef4444' : '#6366f1';
  const gradientId = 'balanceGradient';

  // Stats for summary pills
  const balances = data.map((d) => d.balance);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const lastBalance = balances[balances.length - 1];

  return (
    <div className="balance-chart-container">
      <div className="balance-chart-header">
        <div className="balance-chart-title">
          <h3>Daily Balance</h3>
          <span className="balance-chart-currency">{currency}</span>
        </div>
        <div className="balance-chart-pills">
          <div className="chart-pill">
            <span className="pill-label">Current</span>
            <span className={`pill-value ${lastBalance < 0 ? 'negative' : 'positive'}`}>
              {lastBalance < 0 ? '−' : ''}{MT940Parser.formatAmount(Math.abs(lastBalance))}
            </span>
          </div>
          <div className="chart-pill">
            <span className="pill-label">High</span>
            <span className="pill-value positive">{MT940Parser.formatAmount(maxBalance)}</span>
          </div>
          <div className="chart-pill">
            <span className="pill-label">Low</span>
            <span className={`pill-value ${minBalance < 0 ? 'negative' : ''}`}>
              {minBalance < 0 ? '−' : ''}{MT940Parser.formatAmount(Math.abs(minBalance))}
            </span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={areaColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisDate}
            tick={{ fill: 'var(--text-secondary, #888)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary, #888)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            width={52}
          />
          {hasNegative && (
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          )}
          <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={areaColor}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: areaColor, stroke: 'var(--card-bg, #1e1e2e)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BalanceChart;
