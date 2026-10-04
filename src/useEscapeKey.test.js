import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useEscapeKey } from './useEscapeKey';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Probe({ onClose }) {
    useEscapeKey(onClose);
    return null;
}

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

const press = (key) => act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
});

test('calls onClose once on Escape', () => {
    const onClose = jest.fn();
    act(() => root.render(<Probe onClose={onClose} />));
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
});

test('ignores other keys', () => {
    const onClose = jest.fn();
    act(() => root.render(<Probe onClose={onClose} />));
    press('Enter');
    press('Esc');
    expect(onClose).not.toHaveBeenCalled();
});

test('stops listening after unmount', () => {
    const onClose = jest.fn();
    act(() => root.render(<Probe onClose={onClose} />));
    act(() => root.render(null));
    press('Escape');
    expect(onClose).not.toHaveBeenCalled();
});

test('only the latest onClose is called after a re-render', () => {
    const first = jest.fn();
    const second = jest.fn();
    act(() => root.render(<Probe onClose={first} />));
    act(() => root.render(<Probe onClose={second} />));
    press('Escape');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
});
