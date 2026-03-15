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
    
    originalError.apply(console, args);
  };
}

export {};
