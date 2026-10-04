import { useEffect } from 'react';

// One place for Escape-to-dismiss so every dialog closes the same way.
export function useEscapeKey(onClose) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}
