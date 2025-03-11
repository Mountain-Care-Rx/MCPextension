// content/content.js

import { monitorConsoleMessages } from '../modules/consoleMonitor.js';
import { createFixedHeader, toggleHeaderVisibility } from '../modules/ui/headerBar.js';
import { autoCopyPhone } from '../modules/autoPhoneCopy.js';
import { clearPhoneDisplay } from '../modules/phoneUtils.js';
import { initNameMonitoring } from '../modules/nameUtils.js';
import { initDOBMonitoring } from '../modules/dobUtils.js';
import { initPhoneMonitoring } from '../modules/phoneUtils.js';
import { initSRxIDMonitoring } from '../modules/srxIdUtils.js';
import { initAlertSystem } from '../modules/alertUtils.js'; // New import for alert system

console.log('[CRM Extension] Content script injected.');

// Detect browser environment
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Always check browser storage for visibility setting on startup - NEW
browserAPI.runtime.sendMessage({ action: 'loadSettings' })
  .then(response => {
    if (response && response.success) {
      console.log('[CRM Extension] Settings loaded from browser storage on startup:', response.settings);
      // Only initialize if not already initialized
      if (!document.getElementById("mcp-crm-header")) {
        initializeHeader();
      }
    }
  })
  .catch(error => {
    console.error('[CRM Extension] Error requesting settings on startup:', error);
  });

// Initialize settings by loading from browser storage (don't set defaults here)
// Just check if the setting exists, and if not, let's wait for browser storage
if (localStorage.getItem('crmplus_headerBarVisible') === null) {
  console.log('[CRM Extension] No local toolbar visibility setting, requesting from browser storage');
  browserAPI.runtime.sendMessage({ action: 'loadSettings' })
    .then(response => {
      if (response && response.success) {
        console.log('[CRM Extension] Settings loaded from browser storage:', response.settings);
        initializeHeader();
      } else {
        console.error('[CRM Extension] Failed to load settings, using defaults');
        // If we can't load settings, default to toolbar visible
        localStorage.setItem('crmplus_headerBarVisible', 'true');
        initializeHeader();
      }
    })
    .catch(error => {
      console.error('[CRM Extension] Error requesting settings:', error);
      // If we can't load settings, default to toolbar visible
      localStorage.setItem('crmplus_headerBarVisible', 'true');
      initializeHeader();
    });
} else {
  // Settings already exist in localStorage, proceed with initialization
  console.log('[CRM Extension] Using existing localStorage settings');
  initializeHeader();
}

/**
 * Initialize the header and other features
 */
function initializeHeader() {
  // Get the current visibility setting
  const isHeaderVisible = localStorage.getItem('crmplus_headerBarVisible') !== 'false'; // default to true
  console.log('[CRM Extension] Header visibility setting on init:', isHeaderVisible);
  
  try {
    console.log('[CRM Extension] Creating fixed header...');
    createFixedHeader();
    
    // Explicitly set the visibility based on the setting
    toggleHeaderVisibility(isHeaderVisible);
  } catch (error) {
    console.error('[CRM Extension] Error creating fixed header:', error);
  }
  
  // Initialize other features
  try {
    // Start monitoring console messages.
    monitorConsoleMessages((message) => {
      console.log(`[CRM Extension] Intercepted console message: ${message}`);
    });
  } catch (error) {
    console.error('[CRM Extension] Error initializing console monitor:', error);
  }
  
  try {
    // Automatically copy the phone number when the input is available.
    autoCopyPhone();
  } catch (error) {
    console.error('[CRM Extension] Error initializing auto phone copy:', error);
  }
  
  // Initialize the alert system for provider-paid notifications
  try {
    // Start the alert system for provider-paid and other tag-based alerts
    initAlertSystem();
  } catch (error) {
    console.error('[CRM Extension] Error initializing alert system:', error);
  }
  
  // Make sure phone display is cleared (redundant safety)
  clearPhoneDisplay();
}

// Listen for messages from popup and background
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CRM Extension] Received message:', message);
  
  if (message.action === 'toggleHeaderVisibility') {
    console.log('[CRM Extension] Toggling header visibility to:', message.isVisible);
    try {
      const success = toggleHeaderVisibility(message.isVisible);
      
      // Update localStorage for persistence
      localStorage.setItem('crmplus_headerBarVisible', message.isVisible.toString());
      
      // Sync this change with browser storage (persistent across all tabs)
      browserAPI.runtime.sendMessage({ action: 'syncSettings' })
        .catch(error => console.error('[CRM Extension] Error syncing settings:', error));
      
      sendResponse({ success });
    } catch (error) {
      console.error('[CRM Extension] Error toggling header visibility:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  return false;
});

// Added: Listen for DOMContentLoaded to ensure header is initialized
document.addEventListener('DOMContentLoaded', () => {
  console.log('[CRM Extension] DOM fully loaded, checking visibility setting');
  // Check if header is already initialized
  if (!document.getElementById("mcp-crm-header")) {
    // Force a settings load to ensure header is shown if it should be
    browserAPI.runtime.sendMessage({ action: 'loadSettings' })
      .then(response => {
        if (response && response.success) {
          initializeHeader();
        }
      })
      .catch(() => {
        // If loading fails, default to showing header
        localStorage.setItem('crmplus_headerBarVisible', 'true');
        initializeHeader();
      });
  }
});