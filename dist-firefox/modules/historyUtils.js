// modules/historyUtils.js
// Utility module for tracking patient visit history across browser tabs

// Store history entries in memory for the current session
let historyEntries = [];

// Maximum number of history entries to keep
const MAX_HISTORY_SIZE = 20;

// Retention period in milliseconds (4 hours)
const RETENTION_PERIOD_MS = 4 * 60 * 60 * 1000;

// Key for localStorage
const STORAGE_KEY = 'crmplus_history';

/**
 * Initialize the history system
 */
export function initHistoryTracking() {
  // Load any existing history from localStorage
  loadHistory();
  
  // Set up URL monitoring
  startURLMonitoring();
  
  // Set up cleanup interval to check for expired entries
  startCleanupInterval();
  
  // Set up storage event listener for cross-tab synchronization
  window.addEventListener('storage', handleStorageChange);
  
  console.log('[CRM Extension] History tracking initialized');
}

/**
 * Loads history from localStorage
 */
function loadHistory() {
  try {
    const storedHistory = localStorage.getItem(STORAGE_KEY);
    if (storedHistory) {
      historyEntries = JSON.parse(storedHistory);
      
      // Filter out any expired entries on load
      const now = Date.now();
      historyEntries = historyEntries.filter(entry => {
        return (now - entry.timestamp) < RETENTION_PERIOD_MS;
      });
      
      // Save the filtered list back to localStorage
      saveHistory();
    }
  } catch (error) {
    console.error('[CRM Extension] Error loading history:', error);
    historyEntries = [];
  }
}

/**
 * Saves the current history to localStorage
 */
function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(historyEntries));
  } catch (error) {
    console.error('[CRM Extension] Error saving history:', error);
  }
}

/**
 * Handle storage change event for cross-tab synchronization
 * @param {StorageEvent} event - Storage event
 */
function handleStorageChange(event) {
  if (event.key === STORAGE_KEY) {
    try {
      // Update local memory with the new data from another tab
      if (event.newValue) {
        const newHistory = JSON.parse(event.newValue);
        historyEntries = newHistory;
        console.log('[CRM Extension] History updated from another tab');
      } else {
        // If history was cleared in another tab
        historyEntries = [];
        console.log('[CRM Extension] History cleared from another tab');
      }
    } catch (error) {
      console.error('[CRM Extension] Error processing cross-tab history update:', error);
    }
  }
}

/**
 * Starts monitoring URL changes to detect patient profile visits
 */
function startURLMonitoring() {
  // Track the last URL to detect changes
  let lastUrl = window.location.href;
  
  // Check for changes periodically
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      checkForPatientProfile(currentUrl);
    }
  }, 500);
  
  // Also check on page load
  checkForPatientProfile(window.location.href);
  
  // Set up history API monitoring for single-page application navigation
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    checkForPatientProfile(window.location.href);
  };
  
  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    checkForPatientProfile(window.location.href);
  };
  
  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    checkForPatientProfile(window.location.href);
  });
}

/**
 * Checks if the URL is a patient profile and extracts the patient ID
 * @param {string} url - The URL to check
 */
function checkForPatientProfile(url) {
  if (!url) return;
  
  // Check if URL contains the /detail/ pattern for patient profiles
  const detailMatch = url.match(/\/detail\/([^/]+)/);
  if (detailMatch && detailMatch[1]) {
    const patientId = detailMatch[1];
    
    // Get patient name and phone from the page with an increased delay
    setTimeout(() => {
      const patientName = getPatientName();
      const phoneNumber = getPatientPhone();
      
      // Only add to history if we have a proper name (not "Unknown Patient")
      if (patientName && patientName !== "Unknown Patient") {
        addToHistory(patientId, patientName, phoneNumber, url);
      } else {
        // If name not found yet, try one more time with additional delay
        console.log('[CRM Extension] Patient name not found yet, retrying in 3 seconds...');
        setTimeout(() => {
          const retryName = getPatientName();
          const retryPhone = getPatientPhone();
          
          if (retryName && retryName !== "Unknown Patient") {
            addToHistory(patientId, retryName, retryPhone, url);
          } else {
            console.log('[CRM Extension] Could not retrieve patient info after retry, not adding to history');
          }
        }, 3000); // Additional 3 second retry
      }
    }, 5000); // Increased from 1000ms to 5000ms (5 seconds)
  }
}

/**
 * Gets the patient name from the page
 * @returns {string} The patient name
 */
function getPatientName() {
  // First try to get name from our header display
  const nameElem = document.getElementById('name-text');
  if (nameElem && nameElem.textContent && nameElem.textContent.trim() !== "") {
    return nameElem.textContent.trim();
  }
  
  // Fall back to direct page detection
  // Look for first and last name fields
  const firstNameInput = document.querySelector('input[name="contact.first_name"]');
  const lastNameInput = document.querySelector('input[name="contact.last_name"]');
  
  if (firstNameInput && firstNameInput.value && lastNameInput && lastNameInput.value) {
    return `${firstNameInput.value} ${lastNameInput.value}`.trim();
  }
  
  // Try other selectors
  const nameSelectors = [
    '.patient-name',
    '.contact-name', 
    'h1.name', 
    '.customer-name',
    'span.name',
    '.profile-name',
    'h2.name',
    '.contact-header .name',
    'div[data-field="name"]',
    '.patient-info .name'
  ];
  
  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim() !== "") {
      return element.textContent.trim();
    }
  }
  
  return "Unknown Patient";
}

/**
 * Gets the patient phone from the page
 * @returns {string} The patient phone
 */
function getPatientPhone() {
  // First try to get phone from our header display
  const phoneElem = document.getElementById('phone-text');
  if (phoneElem && phoneElem.textContent && phoneElem.textContent.trim() !== "") {
    return phoneElem.textContent.trim();
  }
  
  // Fall back to direct page detection
  const phoneInput = document.querySelector('input[name="contact.phone"]');
  if (phoneInput && phoneInput.value.trim() !== "") {
    return phoneInput.value.trim();
  }
  
  // Try other selectors
  const phoneSelectors = [
    '.phone-number .number',
    'input[placeholder="Phone"]',
    'input[placeholder="Phone Number"]',
    '.patient-info .phone',
    '.contact-info .phone',
    'span.phone',
    'div[data-field="phone"]',
    'span[data-field="phone_number"]'
  ];
  
  for (const selector of phoneSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Handle input elements vs text elements
      if (element.tagName === 'INPUT') {
        const value = element.value.trim();
        if (value) return value;
      } else {
        const value = element.textContent.trim();
        if (value) return value;
      }
    }
  }
  
  return "";
}

/**
 * Adds a patient visit to the history
 * @param {string} patientId - The patient ID
 * @param {string} patientName - The patient name
 * @param {string} phoneNumber - The patient phone number
 * @param {string} url - The patient profile URL
 */
function addToHistory(patientId, patientName, phoneNumber, url) {
  const now = Date.now();
  const timestamp = now;
  
  // Check if this patient is already in the history
  const existingIndex = historyEntries.findIndex(entry => entry.patientId === patientId);
  
  if (existingIndex !== -1) {
    // Update existing entry and move to top
    const existingEntry = historyEntries[existingIndex];
    existingEntry.timestamp = timestamp;
    existingEntry.patientName = patientName; // Update in case name changed
    existingEntry.phoneNumber = phoneNumber; // Update in case phone changed
    
    // Remove from current position
    historyEntries.splice(existingIndex, 1);
    // Add to top
    historyEntries.unshift(existingEntry);
  } else {
    // Add new entry at the top
    historyEntries.unshift({
      patientId,
      patientName,
      phoneNumber,
      url,
      timestamp
    });
    
    // Trim the history if it exceeds the maximum size
    if (historyEntries.length > MAX_HISTORY_SIZE) {
      historyEntries.pop();
    }
  }
  
  // Save the updated history
  saveHistory();
}

/**
 * Starts a periodic cleanup interval to remove expired entries
 */
function startCleanupInterval() {
  // Check every 5 minutes for expired entries
  setInterval(() => {
    const now = Date.now();
    let entriesRemoved = 0;
    
    historyEntries = historyEntries.filter(entry => {
      const shouldKeep = (now - entry.timestamp) < RETENTION_PERIOD_MS;
      if (!shouldKeep) entriesRemoved++;
      return shouldKeep;
    });
    
    if (entriesRemoved > 0) {
      console.log(`[CRM Extension] Removed ${entriesRemoved} expired history entries`);
      saveHistory();
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Gets all current history entries
 * @returns {Array} The history entries
 */
export function getHistoryEntries() {
  // Always reload from localStorage first to ensure we have the latest data
  loadHistory();
  
  // Run expiration check before returning
  const now = Date.now();
  historyEntries = historyEntries.filter(entry => {
    return (now - entry.timestamp) < RETENTION_PERIOD_MS;
  });
  
  return [...historyEntries];
}

/**
 * Clears all history entries
 */
export function clearHistory() {
  historyEntries = [];
  localStorage.removeItem(STORAGE_KEY);
  console.log('[CRM Extension] History cleared');
}

/**
 * Formats a timestamp to a time string (e.g., "3:45 PM")
 * @param {number} timestamp - The timestamp to format
 * @returns {string} The formatted time string
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}