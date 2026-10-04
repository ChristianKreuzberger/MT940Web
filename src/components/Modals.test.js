import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import HelpModal from './HelpModal';
import SummaryModal from './SummaryModal';
import ParseReportModal from './ParseReportModal';
import AppHeader from './AppHeader';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, opener;
beforeEach(() => {
    opener = document.createElement('button');
    document.body.appendChild(opener);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});
afterEach(() => {
    act(() => root.unmount());
    container.remove();
    opener.remove();
});

const noop = () => {};
const modals = {
    HelpModal: () => <HelpModal onClose={noop} />,
    SummaryModal: () => <SummaryModal transactions={[]} currency="EUR" onClose={noop} />,
    ParseReportModal: () => (
        <ParseReportModal result={{ transactions: [], statements: [] }} error={null} fileName="a.mt940" onClose={noop} />
    ),
};

describe.each(Object.keys(modals))('%s focus handling', (name) => {
    test('moves focus into the dialog on open and back to the opener on close', () => {
        opener.focus();
        expect(document.activeElement).toBe(opener);

        act(() => root.render(modals[name]()));
        const dialog = container.querySelector('[role=dialog]');
        expect(dialog).not.toBeNull();
        expect(document.activeElement).toBe(dialog);

        act(() => root.render(null));
        expect(document.activeElement).toBe(opener);
    });

    test('does not throw when the opener is gone before close', () => {
        opener.focus();
        act(() => root.render(modals[name]()));
        opener.remove();
        expect(() => act(() => root.render(null))).not.toThrow();
    });
});

test('Help from the menu hands focus to the Menu button before the modal mounts', () => {
    let activeWhenOpened;
    act(() => root.render(<AppHeader onHelpOpen={() => { activeWhenOpened = document.activeElement; }} />));
    const menuBtn = container.querySelector('.app-header-menu-btn');
    act(() => { menuBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const help = [...container.querySelectorAll('[role=menuitem]')].find((b) => b.textContent.includes('Help'));
    help.focus();
    act(() => { help.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(activeWhenOpened).toBe(menuBtn);
});
