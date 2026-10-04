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
    click(cards()[0]); // date asc: Description 0 (amount 1)
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
