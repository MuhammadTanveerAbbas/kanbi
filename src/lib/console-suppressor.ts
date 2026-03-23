// Global error handler for client-side
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Convert object errors to proper Error instances
    if (error && typeof error === 'object' && !error.message) {
      const errorMsg = error.error_description || error.message || 'Unknown error';
      console.error('Unhandled promise rejection:', errorMsg);
      event.preventDefault();
      return;
    }
    
    // Suppress known harmless errors
    const msg = error?.toString() || '';
    if (
      msg.includes('spoofer') ||
      msg.includes('extension') ||
      msg.includes('vendors.chunk.js') ||
      msg.includes('lock request is aborted')
    ) {
      event.preventDefault();
      return;
    }
  });
}

// Suppress known console warnings in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // Suppress React DevTools warning
    if (message.includes('Download the React DevTools')) return;
    
    // Suppress Supabase lock warnings (we've increased timeout)
    if (message.includes('Lock') && message.includes('was not released')) return;
    
    originalWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    
    // Suppress spoofer.js errors (browser extension)
    if (message.includes('spoofer.js')) return;
    
    // Suppress lock abort errors (handled by timeout increase)
    if (message.includes('lock request is aborted')) return;
    
    // Suppress extension errors
    if (message.includes('vendors.chunk.js')) return;
    
    // Suppress [object Object] errors that are already handled
    if (message === '[object Object]') return;
    
    originalError.apply(console, args);
  };
}

export {};
