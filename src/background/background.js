// background/background.js

// Detect browser environment
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// List of all settings to synchronize - IMPORTANT: Use consistent keys
const SETTINGS_KEYS = [
  'crmplus_headerBarVisible',  // Consistent key for header visibility
  'crmplus_autoCopyPhone',
  'crmplus_automationEnabled'
];

// Function to check for updates
function checkForUpdates(callback) {
  if (browserAPI.runtime.requestUpdateCheck) {
    console.log("[CRM Extension] Checking for updates...");
    
    browserAPI.runtime.requestUpdateCheck(function(status, details) {
      console.log("[CRM Extension] Update check status:", status);
      
      // Store the last update check time and status
      const now = new Date();
      const lastUpdateCheck = {
        timestamp: now.getTime(),
        formattedTime: now.toLocaleString(),
        status: status,
        success: status !== "error"
      };
      
      // Save to local storage
      browserAPI.storage.local.set({ 'crmplus_lastUpdateCheck': lastUpdateCheck }, function() {
        if (browserAPI.runtime.lastError) {
          console.error("[CRM Extension] Error saving update check data:", browserAPI.runtime.lastError);
        } else {
          console.log("[CRM Extension] Saved update check data:", lastUpdateCheck);
        }
      });
      
      // Create response object with detailed information
      const response = { 
        success: true, 
        message: 'Update check completed',
        updateStatus: status,
        lastCheck: lastUpdateCheck
      };
      
      if (status === "update_available") {
        console.log("[CRM Extension] Update available, version:", details.version);
        response.updateVersion = details.version;
      }
      
      // Execute callback if provided
      if (callback && typeof callback === 'function') {
        callback(response);
      }
    });
  } else {
    console.log("[CRM Extension] Update checking not supported");
    
    // Store failed update check status
    const now = new Date();
    const lastUpdateCheck = {
      timestamp: now.getTime(),
      formattedTime: now.toLocaleString(),
      status: "not_supported",
      success: false
    };
    
    // Save to local storage
    browserAPI.storage.local.set({ 'crmplus_lastUpdateCheck': lastUpdateCheck });
    
    if (callback && typeof callback === 'function') {
      callback({ 
        success: false, 
        message: 'Update checking not supported',
        updateStatus: 'error',
        lastCheck: lastUpdateCheck
      });
    }
  }
}

// Check for updates when the extension starts
checkForUpdates();

// Also check periodically (every 2 hours)
const TWO_HOURS = 2 * 60 * 60 * 1000;
setInterval(checkForUpdates, TWO_HOURS);

// Listen for messages from popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message);
  
  if (message.action === 'toggleHeaderVisibility') {
    // Forward the message to the active tab
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        browserAPI.tabs.sendMessage(
          tabs[0].id, 
          { action: 'toggleHeaderVisibility', isVisible: message.isVisible },
          (response) => {
            if (browserAPI.runtime.lastError) {
              console.error('Error sending message:', browserAPI.runtime.lastError);
              sendResponse({ success: false, error: browserAPI.runtime.lastError.message });
            } else {
              console.log("Received response from content script:", response);
              sendResponse(response);
            }
          }
        );
        return true; // Indicate we'll respond asynchronously
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Indicate we'll respond asynchronously
  } else if (message.action === 'syncSettings') {
    // Synchronize settings between localStorage and browser storage
    syncSettingsFromLocalStorage(sendResponse);
    return true; // Indicate we'll respond asynchronously
  } else if (message.action === 'loadSettings') {
    // Load settings from browser storage
    loadSettingsToLocalStorage(sendResponse);
    return true; // Indicate we'll respond asynchronously
  } else if (message.action === 'checkForUpdates') {
    // Manually check for updates when requested and get the result
    checkForUpdates((response) => {
      console.log("[CRM Extension] Update check result:", response);
      sendResponse(response);
    });
    return true; // Indicate we'll respond asynchronously
  } else if (message.action === 'getLastUpdateCheck') {
    // Return information about the last update check
    browserAPI.storage.local.get('crmplus_lastUpdateCheck', (result) => {
      if (browserAPI.runtime.lastError) {
        console.error("[CRM Extension] Error retrieving last update check:", browserAPI.runtime.lastError);
        sendResponse({ success: false, error: browserAPI.runtime.lastError.message });
      } else {
        console.log("[CRM Extension] Retrieved last update check:", result.crmplus_lastUpdateCheck);
        sendResponse({ 
          success: true, 
          lastUpdateCheck: result.crmplus_lastUpdateCheck || null
        });
      }
    });
    return true; // Indicate we'll respond asynchronously
  }
});

/**
 * Apply toolbar visibility setting to all tabs
 * @param {boolean} isVisible - Whether the toolbar should be visible
 */
function applyToolbarVisibilityToAllTabs(isVisible) {
  // Find all tabs matching the CRM URL pattern
  browserAPI.tabs.query({ url: "*://app.mtncarerx.com/*" }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.log("No matching tabs found for visibility update");
      return;
    }
    
    console.log(`Applying toolbar visibility ${isVisible} to ${tabs.length} tabs`);
    
    // Send message to each tab to update toolbar visibility
    tabs.forEach(tab => {
      browserAPI.tabs.sendMessage(
        tab.id, 
        { action: 'toggleHeaderVisibility', isVisible: isVisible }
      ).catch(err => {
        // Ignore errors - content script might not be loaded yet on some tabs
        console.log(`Could not update tab ${tab.id}, might not be fully loaded`);
      });
    });
  });
}

/**
 * Synchronize settings from localStorage to browser storage
 * @param {Function} callback - Optional callback function
 */
function syncSettingsFromLocalStorage(callback) {
  try {
    // Create object to store all settings
    const settings = {};
    
    // Collect all settings from localStorage
    SETTINGS_KEYS.forEach(key => {
      // Get the value from localStorage
      const value = localStorage.getItem(key);
      if (value !== null) {
        // Convert string "true"/"false" to boolean
        settings[key] = value === "true";
      }
    });
    
    console.log("Syncing settings to browser storage:", settings);
    
    // Save to browser storage
    browserAPI.storage.local.set(settings, () => {
      if (browserAPI.runtime.lastError) {
        console.error('Error syncing settings:', browserAPI.runtime.lastError);
        if (callback) callback({ success: false, error: browserAPI.runtime.lastError.message });
      } else {
        console.log('Settings synced from localStorage to browser storage:', settings);
        
        // If toolbar visibility changed, apply to all tabs
        if ('crmplus_headerBarVisible' in settings) {
          applyToolbarVisibilityToAllTabs(settings.crmplus_headerBarVisible);
        }
        
        if (callback) callback({ success: true, settings });
      }
    });
  } catch (error) {
    console.error('Error in syncSettingsFromLocalStorage:', error);
    if (callback) callback({ success: false, error: error.message });
  }
}

/**
 * Load settings from browser storage to localStorage
 * @param {Function} callback - Optional callback function
 */
function loadSettingsToLocalStorage(callback) {
  try {
    browserAPI.storage.local.get(SETTINGS_KEYS, (result) => {
      if (browserAPI.runtime.lastError) {
        console.error('Error loading settings:', browserAPI.runtime.lastError);
        if (callback) callback({ success: false, error: browserAPI.runtime.lastError.message });
        return;
      }
      
      console.log("Loaded settings from browser storage:", result);
      
      // Store each setting in localStorage
      Object.keys(result).forEach(key => {
        localStorage.setItem(key, result[key].toString());
      });
      
      console.log('Settings loaded from browser storage to localStorage:', result);
      if (callback) callback({ success: true, settings: result });
    });
  } catch (error) {
    console.error('Error in loadSettingsToLocalStorage:', error);
    if (callback) callback({ success: false, error: error.message });
  }
}

// Extension installation and update logic
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('CRM+ Extension installed');
    
    // Set default settings
    const defaultSettings = {
      'crmplus_headerBarVisible': true,  // Toolbar visible by default
      'crmplus_autoCopyPhone': false,    // Auto-copy disabled by default
      'crmplus_automationEnabled': true  // Automation enabled by default
    };
    
    console.log("Setting initial default settings:", defaultSettings);
    
    browserAPI.storage.local.set(defaultSettings, () => {
      console.log('Default settings initialized:', defaultSettings);
      
      // Apply default toolbar visibility to any open tabs
      applyToolbarVisibilityToAllTabs(true);
    });
  } else if (details.reason === 'update') {
    console.log('CRM+ Extension updated to version', browserAPI.runtime.getManifest().version);
    
    // Make sure we have all settings initialized
    browserAPI.storage.local.get(SETTINGS_KEYS, (result) => {
      const updates = {};
      
      // Check each setting and set default if missing
      if (result.crmplus_headerBarVisible === undefined) updates.crmplus_headerBarVisible = true;
      if (result.crmplus_autoCopyPhone === undefined) updates.crmplus_autoCopyPhone = false;
      if (result.crmplus_automationEnabled === undefined) updates.crmplus_automationEnabled = true;
      
      if (Object.keys(updates).length > 0) {
        console.log("Updating missing settings:", updates);
        
        browserAPI.storage.local.set(updates, () => {
          console.log('Missing settings initialized during update:', updates);
          
          // Apply toolbar visibility if it was in the updates
          if ('crmplus_headerBarVisible' in updates) {
            applyToolbarVisibilityToAllTabs(updates.crmplus_headerBarVisible);
          }
        });
      }
    });
  }
});

// Listen for browser startup and apply toolbar visibility from saved settings
browserAPI.runtime.onStartup.addListener(() => {
  console.log('Browser started, initializing CRM+ Extension');
  
  // Check for updates on browser startup
  checkForUpdates();
  
  // Get saved toolbar visibility setting
  browserAPI.storage.local.get('crmplus_headerBarVisible', (result) => {
    // Default to visible if setting doesn't exist
    const isVisible = result.crmplus_headerBarVisible !== false;
    console.log(`Toolbar visibility on startup: ${isVisible}`);
    
    // Apply to all matching tabs
    applyToolbarVisibilityToAllTabs(isVisible);
  });
});

// Add a listener for tab updates to handle page navigation events
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the page is fully loaded and matches our URL pattern
  if (changeInfo.status === 'complete' && tab.url && tab.url.match(/app\.mtncarerx\.com\//)) {
    console.log(`Tab ${tabId} fully loaded, applying visibility setting`);
    
    // Get saved toolbar visibility setting
    browserAPI.storage.local.get('crmplus_headerBarVisible', (result) => {
      // Default to visible if setting doesn't exist
      const isVisible = result.crmplus_headerBarVisible !== false;
      console.log(`Applying toolbar visibility ${isVisible} to tab ${tabId}`);
      
      // Send message to the tab to update toolbar visibility
      browserAPI.tabs.sendMessage(tabId, {
        action: 'toggleHeaderVisibility',
        isVisible: isVisible
      }).catch(err => {
        // Ignore errors - content script might not be loaded yet
        console.log(`Could not update tab ${tabId}, might not be fully loaded`);
      });
    });
  }
});