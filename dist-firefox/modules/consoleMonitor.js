// modules/consoleMonitor.js

/**
 * Monitors console messages and triggers a callback function when specific messages appear.
 * @param {Function} callback - The function to execute when a matching console message is detected.
 */
export function monitorConsoleMessages(callback) {
    // Prevent duplicate monitoring.
    if (window.__crmConsoleMonitor) return;
    window.__crmConsoleMonitor = true;
  
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
  
    // Override console.log.
    console.log = function (...args) {
      originalConsoleLog.apply(console, args);
      // Skip messages from our extension to prevent loops
      if (typeof args[0] === 'string' && args[0].includes('[CRM Extension]')) return;
      handleConsoleMessage(args, "log", callback);
    };
  
    // Override console.error.
    console.error = function (...args) {
      originalConsoleError.apply(console, args);
      // Skip messages from our extension to prevent loops
      if (typeof args[0] === 'string' && args[0].includes('[CRM Extension]')) return;
      handleConsoleMessage(args, "error", callback);
    };
  
    // Override console.warn.
    console.warn = function (...args) {
      originalConsoleWarn.apply(console, args);
      // Skip messages from our extension to prevent loops
      if (typeof args[0] === 'string' && args[0].includes('[CRM Extension]')) return;
      handleConsoleMessage(args, "warn", callback);
    };
  }
    
  /**
   * Handles console messages and executes the callback if a critical keyword is found.
   * @param {Array} args - The console message arguments.
   * @param {string} type - The type of console message (log, error, warn).
   * @param {Function} callback - The callback function to execute.
   */
  function handleConsoleMessage(args, type, callback) {
    const message = args.join(" ");
    const keywords = ["error", "failed", "unauthorized", "critical"];
    if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
      callback(message);
    }
  }