// content/content.js

import { monitorConsoleMessages } from '../modules/consoleMonitor.js';
import { createFixedHeader, toggleHeaderVisibility } from '../modules/ui/headerBar.js';
import { autoCopyPhone } from '../modules/autoPhoneCopy.js';
import { clearPhoneDisplay } from '../modules/phoneUtils.js';
import { initNameMonitoring } from '../modules/nameUtils.js';
import { initDOBMonitoring } from '../modules/dobUtils.js';
import { initPhoneMonitoring } from '../modules/phoneUtils.js';
import { initSRxIDMonitoring } from '../modules/srxIdUtils.js';
import { initAlertSystem } from '../modules/alertUtils.js'; // Alert system
import { initTagRemoval } from '../modules/tagRemoveUtils.js'; // Tag removal system
import { initAutomationRemoval } from '../modules/automationRemoveUtils.js'; // Automation removal system

// Import initChat and initChatUI from the chat module
import { initChat, initChatUI } from '../modules/chat/index.js';

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
  
  // Initialize the tag removal system
  try {
    // Start the tag removal system
    initTagRemoval();
  } catch (error) {
    console.error('[CRM Extension] Error initializing tag removal system:', error);
  }
  
  // Initialize the automation removal system
  try {
    // Start the automation removal system
    initAutomationRemoval();
  } catch (error) {
    console.error('[CRM Extension] Error initializing automation removal system:', error);
  }
  
  // Make sure phone display is cleared (redundant safety)
  clearPhoneDisplay();
  
  // Initialize chat system and UI
  try {
    // Initialize chat system
    initChat().then(() => {
      console.log('[CRM Extension] Chat system initialized successfully');
      
      // Explicitly initialize the chat UI after a short delay
      setTimeout(() => {
        if (typeof initChatUI === 'function') {
          initChatUI();
          console.log('[CRM Extension] Explicitly initialized Chat UI');
        } else {
          console.error('[CRM Extension] initChatUI function not found');
        }
      }, 500);
    });
  } catch (error) {
    console.error('[CRM Extension] Error initializing chat system:', error);
  }
}

// Add debugging for chat button clicks
document.addEventListener('click', function(event) {
  const chatButton = event.target.closest('.chat-button');
  if (chatButton) {
    console.log('[CRM Extension] Chat button clicked (global event listener)');
    
    // Debug info
    console.log('window.toggleChatUI exists:', typeof window.toggleChatUI === 'function');
    console.log('Chat container exists:', !!document.getElementById('hipaa-chat-container'));
    
    // As a fallback, try to ensure the chat UI is available
    if (!document.getElementById('hipaa-chat-container')) {
      console.log('[CRM Extension] Chat container not found, initializing chat UI...');
      
      try {
        if (typeof initChatUI === 'function') {
          initChatUI();
          
          // Try to toggle the chat UI after a short delay
          setTimeout(() => {
            if (typeof window.toggleChatUI === 'function') {
              window.toggleChatUI();
            } else {
              const container = document.getElementById('hipaa-chat-container');
              if (container) {
                container.style.display = container.style.display === 'none' ? 'flex' : 'none';
              }
            }
          }, 100);
        }
      } catch (error) {
        console.error('[CRM Extension] Error initializing chat UI:', error);
      }
    }
  }
});

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
  
  // Add handler for explicit chat initialization
  if (message.action === 'initializeChat') {
    try {
      initChat().then(() => {
        if (typeof initChatUI === 'function') {
          initChatUI();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'initChatUI function not found' });
        }
      });
    } catch (error) {
      console.error('[CRM Extension] Error initializing chat:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  return false;
});

// Listen for DOMContentLoaded to ensure header is initialized
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
  
  // Also ensure chat system is initialized
  if (!document.getElementById('hipaa-chat-container')) {
    try {
      initChat().then(() => {
        if (typeof initChatUI === 'function') {
          initChatUI();
        }
      });
    } catch (error) {
      console.error('[CRM Extension] Error initializing chat on DOMContentLoaded:', error);
    }
  }
});

// Initialize chat explicitly for good measure
try {
  window.addEventListener('load', () => {
    console.log('[CRM Extension] Window loaded, initializing chat...');
    initChat().then(() => {
      if (typeof initChatUI === 'function') {
        initChatUI();
      }
    });
  });
} catch (error) {
  console.error('[CRM Extension] Critical error initializing chat on window.load:', error);
}