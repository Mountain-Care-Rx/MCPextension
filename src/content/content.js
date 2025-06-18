// content/content.js

import { monitorConsoleMessages } from '../modules/consoleMonitor.js';
import { createFixedHeader, toggleHeaderVisibility, removeHeaderBar } from '../modules/ui/headerBar.js';
import { autoCopyPhone } from '../modules/autoPhoneCopy.js';
import { clearPhoneDisplay } from '../modules/phoneUtils.js';
import { initNameMonitoring } from '../modules/nameUtils.js';
import { initDOBMonitoring } from '../modules/dobUtils.js';
import { initPhoneMonitoring } from '../modules/phoneUtils.js';
import { initSRxIDMonitoring } from '../modules/srxIdUtils.js';
import { initAlertSystem } from '../modules/alertUtils.js'; // Alert system
import { initTagRemoval } from '../modules/tagRemoveUtils.js'; // Tag removal system
import { initAutomationRemoval } from '../modules/automationRemoveUtils.js'; // Automation removal system

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
}

// --- HEADER PADDING MANAGEMENT ---
const HEADER_HEIGHT = 32;

function getMainContentElement() {
  // Try common main content containers in order of preference
  return (
    document.querySelector('#app > div > div:last-child') || // Vue/React root
    document.querySelector('.main-content') ||
    document.querySelector('#app') ||
    document.body
  );
}

function addHeaderPadding() {
  const main = getMainContentElement();
  if (main) {
    main.style.paddingTop = HEADER_HEIGHT + 'px';
    // Debug: log the element and its outerHTML
    console.log('[CRM Extension] addHeaderPadding: applying to', main, main.outerHTML);
    // As a fallback, also apply to all parent elements up to body
    let parent = main.parentElement;
    while (parent && parent !== document.body) {
      parent.style.paddingTop = HEADER_HEIGHT + 'px';
      parent = parent.parentElement;
    }
  } else {
    console.warn('[CRM Extension] addHeaderPadding: no main content element found');
  }
}

function removeHeaderPadding() {
  const main = getMainContentElement();
  if (main) {
    main.style.paddingTop = '';
    // Remove from all parent elements up to body
    let parent = main.parentElement;
    while (parent && parent !== document.body) {
      parent.style.paddingTop = '';
      parent = parent.parentElement;
    }
    console.log('[CRM Extension] removeHeaderPadding: removed from', main, main.outerHTML);
  }
}

// Patch createFixedHeader and removeHeaderBar to always adjust padding
const _origCreateFixedHeader = createFixedHeader;
const _origRemoveHeaderBar = removeHeaderBar;

function patchedCreateFixedHeader() {
  _origCreateFixedHeader();
  addHeaderPadding();
}

function patchedRemoveHeaderBar() {
  _origRemoveHeaderBar();
  removeHeaderPadding();
}

// Replace the originals for this script's context
window.createFixedHeader = patchedCreateFixedHeader;
window.removeHeaderBar = patchedRemoveHeaderBar;

// Use the patched versions everywhere in this file
// ...replace all createFixedHeader/removeHeaderBar calls below...
// (For this file, just use the patched names directly)

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
});

///////////////////////
// SPA URL Watcher  //
///////////////////////

(function setupUrlWatcher() {
  let lastUrl = location.href;
  let headerCheckTimeout = null;

  function urlMatchesHeaderCriteria(url) {
    try {
      const u = new URL(url, location.origin);
      return (
        u.hostname === 'app.mtncarerx.com' &&
        (u.href.includes('contacts') || u.href.includes('conversations'))
      );
    } catch {
      return false;
    }
  }

  function handleUrlChange() {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;
    if (headerCheckTimeout) clearTimeout(headerCheckTimeout);
    headerCheckTimeout = setTimeout(() => {
      if (urlMatchesHeaderCriteria(currentUrl)) {
        if (!document.getElementById('mcp-crm-header')) {
          patchedCreateFixedHeader();
          const isHeaderVisible = localStorage.getItem('crmplus_headerBarVisible') !== 'false';
          toggleHeaderVisibility(isHeaderVisible);
        }
      } else {
        if (document.getElementById('mcp-crm-header')) {
          patchedRemoveHeaderBar();
        }
      }
    }, 100);
  }

  const observer = new MutationObserver(handleUrlChange);
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(handleUrlChange, 500);
})();
