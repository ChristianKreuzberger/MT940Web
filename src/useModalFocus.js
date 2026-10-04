import { useEffect, useRef } from 'react';

// Moves focus into a dialog on mount and hands it back to whatever had it
// before when the dialog unmounts. Attach the returned ref to the element with
// role="dialog" and give it tabIndex={-1}.
export function useModalFocus() {
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    ref.current?.focus();
    return () => {
      if (opener && opener.isConnected && opener.focus) opener.focus();
    };
  }, []);
  return ref;
}
