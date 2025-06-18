// modules/srxIdUtils.js
// Targeted utility module for SRx ID detection and management
import { showToast } from './phoneUtils.js';

// Track the last URL to detect navigation
let lastUrl = window.location.href;
// Track the last SRx ID to detect changes
let lastSRxID = "";

/**
 * Updates the SRx ID in the header display
 * @param {string} id - The ID to display
 */
export function updateSRxIDDisplay(id) {
  try {
    // Use updateClickableDisplayValue which is already defined in headerBar.js
    if (typeof updateClickableDisplayValue === 'function') {
      updateClickableDisplayValue('srxid', id);
    } else {
      // Direct DOM manipulation as fallback
      const srxIdText = document.getElementById('srxid-text');
      if (srxIdText) {
        srxIdText.textContent = id;

        // Update the parent data attribute for copy functionality
        const srxIdDisplay = document.getElementById('srxid-display');
        if (srxIdDisplay) {
          srxIdDisplay.setAttribute('data-value', id || '');

          // Remove any previous event listeners by cloning
          const newDisplay = srxIdDisplay.cloneNode(true);
          srxIdDisplay.parentNode.replaceChild(newDisplay, srxIdDisplay);

          // Left click: copy without ^
          newDisplay.addEventListener('click', (e) => {
            if (id) {
              navigator.clipboard.writeText(id);
              showToast('SRx ID copied!');
            }
          });

          // Right click: copy with ^
          newDisplay.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (id) {
              navigator.clipboard.writeText('^' + id);
              showToast('SRx ID copied with ^!');
            }
          });
        }
      }
    }
  } catch (e) {
    console.error("[CRM Extension] Error updating SRx ID display:", e);
  }
}

/**
 * Highly targeted SRx ID detection that focuses specifically on contact.srx_id
 * @returns {boolean} True if an ID was found and updated, false otherwise
 */
export function detectSRxID() {
  try {
    // Specifically target the contact.srx_id input field
    const srxIdInput = document.querySelector('input[name="contact.srx_id"]');

    if (srxIdInput && srxIdInput.value) {
      const srxId = srxIdInput.value.trim();

      // Only proceed if it's a numerical value
      if (srxId && /^\d+$/.test(srxId)) {
        // Update only if the value has changed
        if (srxId !== lastSRxID) {
          console.log("[CRM Extension] Found SRx ID from contact.srx_id input:", srxId);
          lastSRxID = srxId;
          updateSRxIDDisplay(srxId);
          return true;
        }
        return true; // Found but unchanged
      }
    }

    // If we still have a previous ID, keep it
    if (lastSRxID) {
      return true;
    }

    // If we get here, no ID was found
    return false;
  } catch (e) {
    console.error("[CRM Extension] Error detecting SRx ID:", e);
    return false;
  }
}

/**
 * Extract SRx ID from the current URL if present - used only as a backup
 * @returns {string|null} The extracted ID or null if not found
 */
export function extractSRxIDFromURL() {
  try {
    const url = window.location.href;

    // Common URL patterns for IDs
    const patterns = [
      /[?&]id=(\d+)/i,
      /[?&]patient_id=(\d+)/i,
      /[?&]srx_id=(\d+)/i,
      /\/patient\/(\d+)/i,
      /\/customer\/(\d+)/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (e) {
    console.error("[CRM Extension] Error extracting ID from URL:", e);
    return null;
  }
}

/**
 * Sets up continuous monitoring for SRx ID
 * Continuously checks for changes and detects navigation to new profiles
 */
export function initSRxIDMonitoring() {
  // First attempt at direct detection
  detectSRxID();

  // Set up a continuous check
  const checkInterval = setInterval(() => {
    // Check if URL has changed (indicating navigation to a new profile)
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('[CRM Extension] URL changed, resetting SRx ID detection');
      lastUrl = currentUrl;
      lastSRxID = ""; // Reset last SRx ID
      // Reset the display to Loading...
      updateSRxIDDisplay('');
      // Try to detect the new ID immediately
      detectSRxID();
    }

    // Always try to detect
    detectSRxID();

  }, 500); // Check every 500ms

  // Set up MutationObserver to specifically watch for changes to the contact.srx_id input
  try {
    const observer = new MutationObserver((mutations) => {
      // Check if any of the mutations affect our target
      let shouldCheckId = false;

      for (const mutation of mutations) {
        // Check if the target is our input or could contain it
        if (
          (mutation.target.tagName === 'INPUT' && mutation.target.name === 'contact.srx_id') ||
          mutation.target.querySelector && mutation.target.querySelector('input[name="contact.srx_id"]')
        ) {
          shouldCheckId = true;
          break;
        }

        // Check if any added nodes contain our input
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && node.querySelector) { // Element node
              if (
                (node.tagName === 'INPUT' && node.name === 'contact.srx_id') ||
                node.querySelector('input[name="contact.srx_id"]')
              ) {
                shouldCheckId = true;
                break;
              }
            }
          }
        }
      }

      if (shouldCheckId) {
        detectSRxID();
      }
    });

    // Observe changes to the document with focus on input elements
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value']
    });

    console.log('[CRM Extension] SRx ID mutation observer active');
  } catch (err) {
    console.error('[CRM Extension] Error setting up observer for SRx ID:', err);
  }

  // Set up a specific observer for the input's value changes
  setTimeout(() => {
    try {
      const input = document.querySelector('input[name="contact.srx_id"]');
      if (input) {
        // Set up an observer specifically for this input element
        const inputObserver = new MutationObserver((mutations) => {
          detectSRxID();
        });

        inputObserver.observe(input, {
          attributes: true,
          attributeFilter: ['value']
        });

        console.log('[CRM Extension] Direct input observer attached to contact.srx_id');
      }
    } catch (err) {
      console.error('[CRM Extension] Error setting up direct input observer:', err);
    }
  }, 1000); // Give the page a second to load
}
