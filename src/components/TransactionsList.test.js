import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import TransactionsList from './TransactionsList';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const make = (n) =>
    Array.from({ length: n }, (_, i) => ({
        id: i,
        bookingDate: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
        amount: -(i + 1),
        isDebit: true,
        description: `Description ${i}`,
    }));

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

const render = (txs) => act(() => root.render(<TransactionsList transactions={txs} currency="EUR" />));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const button = (text) => [...container.querySelectorAll('button')].find((b) => b.textContent.includes(text));
const cards = () => container.querySelectorAll('.transaction-card');

test('an expanded card stays expanded after the sort changes', () => {
    render(make(3));
    click(cards()[0].querySelector('.transaction-header')); // date asc: Description 0 (amount 1)
    expect(container.querySelector('.transaction-card.expanded').textContent).toContain('Description 0');

    click(button('Amount'));
    click(button('Asc')); // toggle to desc: Description 2 first, Description 0 last

    const expanded = container.querySelectorAll('.transaction-card.expanded');
    expect(expanded).toHaveLength(1);
    expect(expanded[0].textContent).toContain('Description 0');
});

test('cards have no per-index animation delay', () => {
    render(make(3));
    cards().forEach((c) => expect(c.style.animationDelay).toBe(''));
});

test('renders 100 cards at a time, and resets when the sort changes', () => {
    render(make(250));
    expect(cards()).toHaveLength(100);
    click(button('Show more'));
    expect(cards()).toHaveLength(200);
    click(button('Show more'));
    expect(cards()).toHaveLength(250);
    expect(button('Show more')).toBeUndefined();

    click(button('Amount'));
    expect(cards()).toHaveLength(100);
});

describe('custom period filter', () => {
    const dateInputs = () => container.querySelectorAll('input[type=date]');
    const setDate = (input, value) => act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const setRange = (from, to) => {
        const [f, t] = dateInputs();
        if (from !== undefined) setDate(f, from);
        if (to !== undefined) setDate(t, to);
    };

    test('date inputs appear only when Custom is selected', () => {
        render(make(28));
        expect(dateInputs()).toHaveLength(0);
        click(button('Custom'));
        expect(dateInputs()).toHaveLength(2);
        click(button('All time'));
        expect(dateInputs()).toHaveLength(0);
    });

    test('from and to are inclusive', () => {
        render(make(28));
        click(button('Custom'));
        setRange('2026-01-05', '2026-01-07');
        expect(cards()).toHaveLength(3);
    });

    test('either bound alone is open-ended', () => {
        render(make(28));
        click(button('Custom'));
        setRange('2026-01-26');
        expect(cards()).toHaveLength(3); // 26, 27, 28
        setRange('', '2026-01-02');
        expect(cards()).toHaveLength(2); // 1, 2
    });

    test('combines with other filters', () => {
        render(make(28));
        click(button('Custom'));
        setRange('2026-01-05', '2026-01-07');
        expect(cards()).toHaveLength(3);
        click(button('Incoming')); // make() is all debit
        expect(cards()).toHaveLength(0);
    });

    test('from after to shows the empty message', () => {
        render(make(28));
        click(button('Custom'));
        setRange('2026-01-10', '2026-01-05');
        expect(cards()).toHaveLength(0);
        expect(container.textContent).toContain('No transactions match');
    });

    test('Reset filters clears the custom range', () => {
        render(make(28));
        click(button('Custom'));
        setRange('2026-01-05', '2026-01-07');
        click(button('Reset filters'));
        expect(dateInputs()).toHaveLength(0);
        expect(cards()).toHaveLength(28);
        click(button('Custom'));
        expect([...dateInputs()].map((i) => i.value)).toEqual(['', '']);
        expect(cards()).toHaveLength(28);
    });

    test('changing the range goes back to the first page', () => {
        render(make(250));
        click(button('Custom'));
        click(button('Show more'));
        expect(cards()).toHaveLength(200);
        setRange(undefined, '2026-01-20');
        expect(cards()).toHaveLength(100);
    });
});

const filterGroups = () => [...container.querySelectorAll('.filter-group')];

test('every filter button exposes aria-pressed and each group has exactly one pressed', () => {
    render(make(3));
    const groups = filterGroups();
    expect(groups.length).toBeGreaterThanOrEqual(4);
    groups.forEach((g) => {
        const btns = [...g.querySelectorAll('.filter-btn:not(.sort-dir-btn)')];
        expect(btns.length).toBeGreaterThan(0);
        btns.forEach((b) => expect(['true', 'false']).toContain(b.getAttribute('aria-pressed')));
        expect(btns.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    });
});

const filterBtn = (text) => [...container.querySelectorAll('.filter-btn')].find((b) => b.textContent.includes(text));

test('clicking a filter flips aria-pressed', () => {
    render(make(3));
    expect(filterBtn('Outgoing').getAttribute('aria-pressed')).toBe('false');
    click(filterBtn('Outgoing'));
    expect(filterBtn('Outgoing').getAttribute('aria-pressed')).toBe('true');
    expect(filterBtn('Custom').getAttribute('aria-pressed')).toBe('false');
    click(filterBtn('Custom'));
    expect(filterBtn('Custom').getAttribute('aria-pressed')).toBe('true');
});

test('the sort direction toggle has no aria-pressed', () => {
    render(make(3));
    expect(container.querySelector('.sort-dir-btn').hasAttribute('aria-pressed')).toBe(false);
});

test('reports the filtered and sorted list through onFilteredChange', () => {
    const onFilteredChange = jest.fn();
    const txs = [
        { id: 1, bookingDate: '2026-01-02', amount: -5, isDebit: true },
        { id: 2, bookingDate: '2026-01-03', amount: 7, isDebit: false },
        { id: 3, bookingDate: '2026-01-01', amount: -9, isDebit: true },
    ];
    act(() => root.render(<TransactionsList transactions={txs} currency="EUR" onFilteredChange={onFilteredChange} />));
    expect(onFilteredChange.mock.calls.at(-1)[0].map((t) => t.id)).toEqual([3, 1, 2]);

    click(button('Outgoing'));
    expect(onFilteredChange.mock.calls.at(-1)[0].map((t) => t.id)).toEqual([3, 1]);
    expect(onFilteredChange.mock.calls.length).toBeLessThan(5);
});
