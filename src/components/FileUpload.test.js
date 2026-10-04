import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import FileUpload from './FileUpload';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, clickSpy;
beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => {
    act(() => root.unmount());
    container.remove();
    clickSpy.mockRestore();
});

const render = (props = {}) =>
    act(() => root.render(<FileUpload onFileUpload={() => {}} error={null} loading={false} {...props} />));
const card = () => container.querySelector('.upload-card');
const key = (el, k) => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    act(() => { el.dispatchEvent(e); });
    return e;
};

test('the upload card is a focusable button', () => {
    render();
    expect(card().getAttribute('role')).toBe('button');
    expect(card().tabIndex).toBe(0);
    expect(card().getAttribute('aria-disabled')).toBe('false');
});

test('Enter opens the file picker', () => {
    render();
    key(card(), 'Enter');
    expect(clickSpy).toHaveBeenCalledTimes(1);
});

test('Space opens the file picker and does not scroll the page', () => {
    render();
    const e = key(card(), ' ');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
});

test('other keys do nothing', () => {
    render();
    key(card(), 'a');
    expect(clickSpy).not.toHaveBeenCalled();
});

test('keys bubbling from a child element are ignored', () => {
    render();
    key(card().querySelector('h2'), 'Enter');
    expect(clickSpy).not.toHaveBeenCalled();
});

test('while loading the card is aria-disabled and keys do nothing', () => {
    render({ loading: true });
    expect(card().getAttribute('aria-disabled')).toBe('true');
    key(card(), 'Enter');
    expect(clickSpy).not.toHaveBeenCalled();
});
