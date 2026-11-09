'use client';

import { useEffect } from 'react';

const GlobalErrorHandler = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      if (
        reason instanceof Event ||
        (reason && Object.prototype.toString.call(reason) === '[object Event]')
      ) {
        // Prevent dev overlay crash from harmless browser/extension Event rejections
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn('Suppressed unhandled Event rejection:', reason);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
    };
  }, []);

  return null;
};

export default GlobalErrorHandler;

