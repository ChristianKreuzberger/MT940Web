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
