import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import TransactionCard from './TransactionCard';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const tx = { id: 7, bookingDate: '2026-01-05', amount: -5, isDebit: true, description: 'Coffee' };

let container, root;
beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<TransactionCard transaction={tx} currency="EUR" />));
});
afterEach(() => {
    act(() => root.unmount());
    container.remove();
});

const header = () => container.querySelector('.transaction-header');
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

test('the header is a button that reports its expanded state', () => {
    expect(header().tagName).toBe('BUTTON');
    expect(header().getAttribute('type')).toBe('button');
    expect(header().getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.transaction-details')).toBeNull();

    click(header());
    expect(header().getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.transaction-details')).not.toBeNull();

    click(header());
    expect(header().getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.transaction-details')).toBeNull();
});

test('aria-controls points at the details element when expanded', () => {
    click(header());
    const id = header().getAttribute('aria-controls');
    expect(id).toBeTruthy();
    expect(container.querySelector(`#${id}`)).toBe(container.querySelector('.transaction-details'));
});

test('details are outside the button', () => {
    click(header());
    expect(header().contains(container.querySelector('.transaction-details'))).toBe(false);
});

test('the header button is focusable', () => {
    header().focus();
    expect(document.activeElement).toBe(header());
});
