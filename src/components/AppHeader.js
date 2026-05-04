import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, X, ChevronDown } from 'lucide-react';
import './AppHeader.css';

const APP_VERSION = process.env.REACT_APP_VERSION || require('../../package.json').version;

function AppHeader({ onHelpOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHelp = () => {
    setMenuOpen(false);
    onHelpOpen();
  };

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <span className="app-header-icon">💳</span>
        <span className="app-header-title">MT940 Parser</span>
      </div>

      <div className="app-header-menu" ref={menuRef}>
        <button
          className="app-header-menu-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          Menu
          <ChevronDown size={14} className={menuOpen ? 'rotated' : ''} />
        </button>

        {menuOpen && (
          <div className="app-header-dropdown" role="menu">
            <div className="app-header-dropdown-item version-item">
              <Info size={14} />
              Version {APP_VERSION}
            </div>
            <div className="app-header-dropdown-divider" />
            <button
              className="app-header-dropdown-item"
              onClick={handleHelp}
              role="menuitem"
            >
              <HelpCircle size={14} />
              Help
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
