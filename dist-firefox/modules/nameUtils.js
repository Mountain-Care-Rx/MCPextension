// modules/nameUtils.js
// Utility module for patient name detection and management
import { showToast } from './phoneUtils.js';
// Track the last URL to detect navigation
let lastUrl = window.location.href;

/**
 * Updates the patient name in the header display
 * @param {string} name - The name to display
 */
export function updateNameDisplay(name) {
  try {
    // Use updateClickableDisplayValue which is defined in headerBar.js
    if (typeof updateClickableDisplayValue === 'function') {
      updateClickableDisplayValue('name', name);
    } else {
      // Direct DOM manipulation as fallback
      const nameTextElem = document.getElementById('name-text');
      if (nameTextElem) {
        nameTextElem.textContent = name;

        // Update the parent data attribute for copy functionality
        const nameDisplayElem = document.getElementById('name-display');
        if (nameDisplayElem) {
          nameDisplayElem.setAttribute('data-value', name);
          // Remove previous event listeners by cloning
          const newDisplay = nameDisplayElem.cloneNode(true);
          nameDisplayElem.parentNode.replaceChild(newDisplay, nameDisplayElem);
          // Left click: copy as displayed
          newDisplay.addEventListener('click', (e) => {
            if (name) {
              navigator.clipboard.writeText(name);
              if (typeof showToast === 'function') {
                showToast('Name copied!');
              } else {
                alert('Name copied!');
              }
            }
          });
          // Right click: copy as LASTNAME, FIRSTNAME
          newDisplay.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent default context menu
            if (name) {
              // Try to split into first and last name
              const parts = name.trim().split(/\s+/);
              let formatted = name;
              if (parts.length >= 2) {
                const first = parts[0];
                const last = parts.slice(1).join(' ');
                formatted = `${last}, ${first}`;
              }
              navigator.clipboard.writeText(formatted);
              if (typeof showToast === 'function') {
                showToast('Name copied as LASTNAME, FIRSTNAME!');
              }
            }
          });
        }
      }
    }
  } catch (e) {
    console.error("[CRM Extension] Error updating name display:", e);
  }
}

/**
 * Detects patient name from various page elements
 * @returns {boolean} True if a name was found and updated, false otherwise
 */
export function detectName() {
  try {
    // Look for first and last name fields
    const firstNameInput = document.querySelector('input[name="contact.first_name"]');
    const lastNameInput = document.querySelector('input[name="contact.last_name"]');

    // Check if we have both first and last name
    if (firstNameInput && firstNameInput.value && lastNameInput && lastNameInput.value) {
      const fullName = `${firstNameInput.value} ${lastNameInput.value}`;
      updateNameDisplay(fullName);
      return true;
    }

    // Try to find name from other elements if input fields are not available
    const nameElements = document.querySelectorAll('.patient-name, .contact-name, h1.name, .customer-name');
    for (const elem of nameElements) {
      if (elem && elem.textContent && elem.textContent.trim() !== "") {
        const fullName = elem.textContent.trim();
        updateNameDisplay(fullName);
        return true;
      }
    }

    // Additional selector attempts
    const additionalSelectors = [
      'span.name',
      '.profile-name',
      'h2.name',
      '.contact-header .name',
      'div[data-field="name"]',
      '.patient-info .name'
    ];

    for (const selector of additionalSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim() !== "") {
        const fullName = element.textContent.trim();
        updateNameDisplay(fullName);
        return true;
      }
    }

    // If we get here, no name was found - clear value
    return false;
  } catch (e) {
    console.error("[CRM Extension] Error detecting name:", e);
    return false;
  }
}

/**
 * Sets up continuous monitoring for patient name
 * Continuously checks for changes and detects navigation to new profiles
 */
export function initNameMonitoring() {
  // First attempt at direct detection
  detectName();

  // Set up a continuous check that never stops
  const checkInterval = setInterval(() => {
    // Check if URL has changed (indicating navigation to a new profile)
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('[CRM Extension] URL changed, resetting name detection');
      lastUrl = currentUrl;
      // Reset the display to Loading...
      updateNameDisplay('');
      // Try to detect the new name immediately
      detectName();
    }

    // Always try to detect if the display shows 'Loading...'
    const nameText = document.getElementById('name-text');
    if (nameText && (nameText.textContent === 'Loading...' || !nameText.textContent)) {
      detectName();
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
        console.log('[CRM Extension] Significant DOM changes detected, rechecking name');
        // Reset the display to Loading...
        updateNameDisplay('');
        // Try to detect the new name
        detectName();
      }
    });

    // Observe changes to the body or main content container
    const targetNode = document.querySelector('main') || document.body;
    navigationObserver.observe(targetNode, {
      childList: true,
      subtree: true
    });
  } catch (err) {
    console.error('[CRM Extension] Error setting up navigation observer for name:', err);
  }
}
