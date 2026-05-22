export const getElectronAPI = () => {
  if (typeof window === 'undefined') {
    console.error('[getElectronAPI] window is undefined - not in browser context');
    return null;
  }
  
  if (!window.electron) {
    console.error('[getElectronAPI] window.electron is undefined');
    console.log('[getElectronAPI] window keys:', Object.keys(window).slice(0, 10), '...');
    
    // Check if we're in Electron renderer context
    if (window.process && window.process.type === 'renderer') {
      console.error('[getElectronAPI] We ARE in Electron renderer, but window.electron is not exposed!');
      console.error('[getElectronAPI] This means preload script failed to execute');
    } else {
      console.error('[getElectronAPI] We are NOT in Electron renderer process');
      console.log('[getElectronAPI] window.process:', window.process);
      console.log('[getElectronAPI] process.type would be:', typeof process !== 'undefined' ? process.type : 'N/A');
    }
    
    return null;
  }
  
  return window.electron;
};

export const withElectronCheck = (fn) => {
  return async (...args) => {
    const api = getElectronAPI();
    if (!api) {
      throw new Error('Electron API tidak tersedia. Silakan restart aplikasi.');
    }
    return fn(api, ...args);
  };
};
