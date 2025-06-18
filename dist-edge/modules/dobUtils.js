// modules/dobUtils.js
// Utility module for date of birth detection and management

import { showToast } from './phoneUtils.js';
// Track the last URL to detect navigation
let lastUrl = window.location.href;

/**
 * Updates the DOB in the header display
 * @param {string} dob - The DOB to display
 */
export function updateDOBDisplay(dob) {
  try {
    // Use updateClickableDisplayValue which is defined in headerBar.js
    if (typeof updateClickableDisplayValue === 'function') {
      updateClickableDisplayValue('dob', dob);
    } else {
      // Direct DOM manipulation as fallback
      const dobTextElem = document.getElementById('dob-text');
      if (dobTextElem) {
        dobTextElem.textContent = dob;

        // Update the parent data attribute for copy functionality
        const dobDisplayElem = document.getElementById('dob-display');
        if (dobDisplayElem) {
          dobDisplayElem.setAttribute('data-value', dob);
          // Remove previous event listeners by cloning
          const newDisplay = dobDisplayElem.cloneNode(true);
          dobDisplayElem.parentNode.replaceChild(newDisplay, dobDisplayElem);
          // Left click: copy as displayed
          newDisplay.addEventListener('click', (e) => {
            if (dob) {
              navigator.clipboard.writeText(dob);
              if (typeof showToast === 'function') {
                showToast('DOB copied!');
              }
            }
          });
          // Right click: copy with [ prefix
          newDisplay.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (dob) {
              navigator.clipboard.writeText('[' + dob);
              if (typeof showToast === 'function') {
                showToast('DOB copied with [!');
              }
            }
          });
        }
      }
    }
  } catch (e) {
    console.error("[CRM Extension] Error updating DOB display:", e);
  }
}

/**
 * Helper to format different date strings consistently
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return "";

  // Handle "Feb 12th 1809" format
  if (dateStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(st|nd|rd|th)?\s+\d{4}$/)) {
    try {
      // Extract just the date parts
      const parts = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(st|nd|rd|th)?\s+(\d{4})/);
      if (parts) {
        const month = parts[1];
        const day = parts[2];
        const year = parts[4];

        // Convert month name to number
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthNum = monthNames.indexOf(month) + 1;

        return `${monthNum.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
      }
    } catch (e) {
      console.error("[CRM Extension] Error parsing date:", e);
    }
  }

  // Try to parse as date object if it's another format
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
  } catch (e) {
    console.error("[CRM Extension] Error parsing date as Date object:", e);
  }

  // If all else fails, just return the original
  return dateStr;
}

/**
 * Detects DOB from various page elements
 * @returns {boolean} True if a DOB was found and updated, false otherwise
 */
export function detectDOB() {
  try {
    // Direct access to DOB field using the selector that works in the console
    const dobInput = document.querySelector('input[name="contact.date_of_birth"]');
    if (dobInput && dobInput.value) {
      const formattedDOB = formatDateDisplay(dobInput.value);
      updateDOBDisplay(formattedDOB);
      return true;
    }

    // Try alternative selectors for DOB
    const dobSelectors = [
      '.dob',
      '.patient-dob',
      '.contact-dob',
      'span[data-field="date_of_birth"]',
      'div[data-field="dob"]',
      '.patient-info .dob',
      '.contact-info .dob'
    ];

    for (const selector of dobSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim() !== "") {
        const formattedDOB = formatDateDisplay(element.textContent.trim());
        updateDOBDisplay(formattedDOB);
        return true;
      }
    }

    // If we get here, no DOB was found - clear value
    return false;
  } catch (e) {
    console.error("[CRM Extension] Error detecting DOB:", e);
    return false;
  }
}

/**
 * Sets up continuous monitoring for DOB
 * Continuously checks for changes and detects navigation to new profiles
 */
export function initDOBMonitoring() {
  // First attempt at direct detection
  detectDOB();

  // Set up a continuous check that never stops
  const checkInterval = setInterval(() => {
    // Check if URL has changed (indicating navigation to a new profile)
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('[CRM Extension] URL changed, resetting DOB detection');
      lastUrl = currentUrl;
      // Reset the display to Loading...
      updateDOBDisplay('');
      // Try to detect the new DOB immediately
      detectDOB();
    }

    // Always try to detect if the display shows 'Loading...'
    const dobText = document.getElementById('dob-text');
    if (dobText && (dobText.textContent === 'Loading...' || !dobText.textContent)) {
      detectDOB();
    }
  }, 1000); // Check every second

  // Optional: Add a navigation observer as a backup
  try {
    const navigationObserver = new MutationObserver((mutations) => {
      // Look for significant DOM changes that might indicate page navigation
      const significantChanges = mutations.some(mutation =>
        mutation.addedNodes.length > 5 || mutation.removedNodes.length > 5
      );

      if (significantChanges) {
        console.log('[CRM Extension] Significant DOM changes detected, rechecking DOB');
        // Reset the display to Loading...
        updateDOBDisplay('');
        // Try to detect the new DOB
        detectDOB();
      }
    });

    // Observe changes to the body or main content container
    const targetNode = document.querySelector('main') || document.body;
    navigationObserver.observe(targetNode, {
      childList: true,
      subtree: true
    });
  } catch (err) {
    console.error('[CRM Extension] Error setting up navigation observer for DOB:', err);
  }
}
