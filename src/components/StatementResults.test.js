import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import StatementResults from './StatementResults';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const data = {
    currency: 'EUR',
    openingBalance: 1000,
    closingBalance: 1000,
    statementPeriod: { startDate: '2026-01-01', endDate: '2026-01-31' },
    transactions: [
        { id: 1, bookingDate: '2026-01-02', amount: -10, isDebit: true, description: 'a' },
        { id: 2, bookingDate: '2026-01-03', amount: 20, isDebit: false, description: 'b' },
        { id: 3, bookingDate: '2026-01-04', amount: -30, isDebit: true, description: 'c' },
    ],
};

let container, root;
beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});
afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

const render = (d, onExportCsv) =>
    act(() => root.render(<StatementResults data={d} onClear={() => {}} onExport={() => {}} onExportCsv={onExportCsv} />));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const button = (text) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(text));

test('shows both CSV buttons with counts', () => {
    render(data, jest.fn());
    expect(button('Export CSV (all 3)')).toBeTruthy();
    expect(button('Export CSV (filtered 3)')).toBeTruthy();
});

test('"all" exports every transaction', () => {
    const onExportCsv = jest.fn();
    render(data, onExportCsv);
    click(button('Outgoing'));
    click(button('Export CSV (all 3)'));
    expect(onExportCsv).toHaveBeenCalledWith(data.transactions, { filtered: false });
});

test('"filtered" exports only the transactions that match the list filters', () => {
    const onExportCsv = jest.fn();
    render(data, onExportCsv);
    click(button('Outgoing'));
    expect(button('Export CSV (filtered 2)')).toBeTruthy();
    click(button('Export CSV (filtered 2)'));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
    const [list, opts] = onExportCsv.mock.calls[0];
    expect(list.map((t) => t.id)).toEqual([1, 3]);
    expect(opts).toEqual({ filtered: true });
});

test('"filtered" is disabled when nothing matches', () => {
    render(data, jest.fn());
    click(button('Custom'));
    const [from] = container.querySelectorAll('.custom-range input');
    expect(from).toBeTruthy();
    act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(from, '2027-01-01');
        from.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(button('Export CSV (filtered 0)').disabled).toBe(true);
});
