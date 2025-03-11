// phoneUtils.js - Enhanced utilities for phone number handling

// Track the last URL to detect navigation
let lastUrl = window.location.href;
// Track the last phone number to detect changes
let lastPhoneNumber = "";

/**
 * Returns the raw phone number from the page using multiple detection strategies
 * @returns {string} The detected raw phone number or empty string if not found
 */
export function getRawPhoneNumber() {
  // Check if we're actually on a patient profile page
  if (!isPatientProfilePage()) {
    return "";
  }

  const phoneInput = document.querySelector('input[name="contact.phone"]');
  if (phoneInput && phoneInput.value.trim() !== "") {
    return phoneInput.value.trim();
  }
  
  const phoneElement = document.querySelector('.phone-number .number');
  if (phoneElement && phoneElement.textContent.trim() !== "") {
    return phoneElement.textContent.trim();
  }
  
  // Additional selectors to try
  const additionalSelectors = [
    'input[placeholder="Phone"]',
    'input[placeholder="Phone Number"]',
    '.patient-info .phone',
    '.contact-info .phone',
    'span.phone',
    'label[for*="phone"]',
    '.phone-display',
    'div[data-field="phone"]',
    'span[data-field="phone_number"]'
  ];
  
  // Try each additional selector
  for (const selector of additionalSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Handle input elements vs text elements
      if (element.tagName === 'INPUT') {
        const value = element.value.trim();
        if (value) return value;
      } else if (element.tagName === 'LABEL') {
        // If it's a label, try to find the associated input
        const inputId = element.getAttribute('for');
        if (inputId) {
          const input = document.getElementById(inputId);
          if (input && input.value.trim()) {
            return input.value.trim();
          }
        }
        // Also check if there's an input inside the label's parent
        const parentInput = element.parentElement?.querySelector('input');
        if (parentInput && parentInput.value.trim()) {
          return parentInput.value.trim();
        }
      } else {
        const value = element.textContent.trim();
        if (value) return value;
      }
    }
  }
  
  return "";
}

/**
 * Check if the current page is a patient profile page
 * @returns {boolean} True if on a patient profile page
 */
function isPatientProfilePage() {
  // Check URL patterns that would indicate a patient profile
  const url = window.location.href;
  
  // Check common patient profile URL patterns
  const patientUrlPatterns = [
    /\/patient\/\d+/i,
    /\/contact\/\d+/i,
    /\/profile\/\d+/i,
    /[?&]patient_id=\d+/i,
    /[?&]contact_id=\d+/i
  ];
  
  if (patientUrlPatterns.some(pattern => pattern.test(url))) {
    return true;
  }
  
  // Check for presence of patient profile elements
  const profileElements = [
    'input[name="contact.phone"]',
    'input[name="contact.first_name"]',
    'input[name="contact.last_name"]',
    'input[name="contact.date_of_birth"]',
    '.patient-info',
    '.contact-details',
    '.patient-header',
    '.patient-profile'
  ];
  
  return profileElements.some(selector => document.querySelector(selector) !== null);
}

/**
 * Updates the phone number in the header display
 * @param {string} phone - The phone number to display
 */
export function updatePhoneDisplay(phone) {
  try {
    // If phone is empty, use empty display state
    const displayValue = phone ? formatPhoneForDisplay(phone) : "";
    
    // Use updateClickableDisplayValue which is defined in headerBar.js
    if (typeof updateClickableDisplayValue === 'function') {
      updateClickableDisplayValue('phone', displayValue);
    } else {
      // Direct DOM manipulation as fallback
      const phoneTextElem = document.getElementById('phone-text');
      if (phoneTextElem) {
        phoneTextElem.textContent = displayValue;
        
        // Update the parent data attribute for copy functionality
        const phoneDisplayElem = document.getElementById('phone-display');
        if (phoneDisplayElem) {
          if (phone) {
            phoneDisplayElem.setAttribute('data-value', phone);
          } else {
            phoneDisplayElem.removeAttribute('data-value');
          }
        }
      }
    }
  } catch (e) {
    console.error("[CRM Extension] Error updating phone display:", e);
  }
}

/**
 * Completely clear the phone display
 */
export function clearPhoneDisplay() {
  // First reset our tracking variable
  lastPhoneNumber = "";
  
  // Then update the display with empty value
  updatePhoneDisplay("");
  
  // Also explicitly clean up any data attributes to be safe
  try {
    const phoneDisplayElem = document.getElementById('phone-display');
    if (phoneDisplayElem) {
      phoneDisplayElem.removeAttribute('data-value');
    }
  } catch (e) {
    console.error("[CRM Extension] Error clearing phone display:", e);
  }
}

/**
 * Formats a phone number for display in a user-friendly format
 * @param {string} rawPhone - Raw phone number
 * @returns {string} Formatted phone number for display
 */
export function formatPhoneForDisplay(rawPhone) {
  if (!rawPhone) return "";
  
  // Remove any non-digit characters
  const digits = rawPhone.replace(/\D/g, "");
  
  if (digits.length === 0) return "";
  
  // For typical US 10-digit number
  if (digits.length === 10) {
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }
  // For US number with country code
  else if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
  }
  // For other lengths, just format with spaces for readability
  else if (digits.length > 4) {
    // Try to break into chunks of 3-4 digits
    let formatted = '';
    for (let i = 0; i < digits.length; i += 3) {
      if (i + 4 >= digits.length && digits.length % 3 !== 0) {
        // Last chunk might be 4 digits
        formatted += ' ' + digits.substring(i);
        break;
      } else {
        formatted += ' ' + digits.substring(i, i + 3);
      }
    }
    return formatted.trim();
  }
  
  // If all else fails, return the raw digits with reasonable spacing
  return digits.replace(/(\d{3})/g, '$1 ').trim();
}

/**
 * Detects phone number from various page elements
 * @returns {boolean} True if a phone number was found and updated, false otherwise
 */
export function detectPhone() {
  try {
    // Explicitly check if we're on a patient profile page first
    if (!isPatientProfilePage()) {
      // If not on a profile page, make sure the display is cleared
      if (lastPhoneNumber) {
        clearPhoneDisplay();
      }
      return false;
    }
    
    const raw = getRawPhoneNumber();
    if (raw) {
      // Check if the phone number has changed
      if (raw !== lastPhoneNumber) {
        lastPhoneNumber = raw;
        updatePhoneDisplay(raw);
        return true;
      }
      return true; // Phone number found but unchanged
    }
    
    // If we get here, no phone number was found - clear value if we previously had one
    if (lastPhoneNumber) {
      clearPhoneDisplay();
    }
    return false;
  } catch (e) {
    console.error("[CRM Extension] Error detecting phone number:", e);
    return false;
  }
}

/**
 * Sets up continuous monitoring for phone number
 * Continuously checks for changes and detects navigation to new profiles
 */
export function initPhoneMonitoring() {
  // Make sure display starts empty
  clearPhoneDisplay();
  
  // First attempt at direct detection
  detectPhone();
  
  // Set up a check that runs frequently
  const checkInterval = setInterval(() => {
    // Check if URL has changed (indicating navigation to a new profile or away from a profile)
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log('[CRM Extension] URL changed, resetting phone detection');
      lastUrl = currentUrl;
      
      // Always clear on URL change first
      clearPhoneDisplay();
      
      // Then try to detect if we're on a profile page
      detectPhone();
    } else {
      // Regular detection on the same page
      detectPhone();
    }
  }, 200); // Check every 200ms for responsive updates
  
  // Set up MutationObserver to watch for DOM changes that might contain phone numbers
  try {
    const phoneObserver = new MutationObserver((mutations) => {
      // Immediately check for phone number on any DOM change
      detectPhone();
    });
    
    // Observe changes to the body with a focus on input elements and text
    const targetNode = document.body;
    phoneObserver.observe(targetNode, { 
      childList: true, 
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['value']
    });
    
    console.log('[CRM Extension] Phone number mutation observer active');
  } catch (err) {
    console.error('[CRM Extension] Error setting up phone mutation observer:', err);
  }
}

/**
 * Handle phone number copying with formatting
 * @param {Element} displayElement - The display element containing the phone number
 */
export function handlePhoneCopy(displayElement) {
  const raw = getRawPhoneNumber();
  if (!raw) {
    showToast("No phone number found");
    return;
  }
  
  const formatted = formatPhoneNumber(raw);
  if (!formatted) {
    showToast("Invalid phone number format");
    return;
  }
  
  // Store the raw phone number in data attribute
  displayElement.setAttribute('data-value', raw);
  
  copyToClipboard(formatted)
    .then(success => {
      if (success) {
        showToast("Copied: " + formatted);
      } else {
        showToast("Failed to copy phone number");
      }
    });
}

/**
 * Formats a raw phone number string by removing non-digits and prefixing with "+1"
 * @param {string} raw - Raw phone number string
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  // Only format if we have enough digits for a valid phone number
  if (digits.length < 7) return "";
  return "+1" + digits;
}

/**
 * Copies the formatted text to clipboard using browser-compatible methods
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Whether copy was successful
 */
export async function copyToClipboard(text) {
  // First try using the Clipboard API (modern browsers)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback method:", err);
    }
  }
  
  // Fallback for Firefox (execCommand method)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    
    // Make the textarea invisible but part of the DOM
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    
    document.body.appendChild(textarea);
    
    // Special handling for Firefox
    textarea.focus();
    textarea.select();
    
    // Execute the copy command
    const successful = document.execCommand("copy");
    
    // Clean up
    document.body.removeChild(textarea);
    
    return successful;
  } catch (e) {
    console.error("All clipboard methods failed:", e);
    return false;
  }
}

/**
 * Creates and displays a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, duration = 2000) {
  // Check if a toast container already exists
  let toastContainer = document.getElementById("crm-plus-toast-container");
  
  // Create a toast container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "crm-plus-toast-container";
    toastContainer.style.position = "fixed";
    toastContainer.style.bottom = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "100000";
    document.body.appendChild(toastContainer);
  }
  
  // Create the toast
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "10px";
  toast.style.borderRadius = "5px";
  toast.style.marginTop = "10px";
  toast.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  toast.style.transition = "opacity 0.5s, transform 0.5s";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  
  // Add the toast to the container
  toastContainer.appendChild(toast);
  
  // Force reflow to enable transition from initial state
  void toast.offsetWidth;
  
  // Show the toast with animation
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  
  // Hide and remove after duration
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    
    // Remove from DOM after transition
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // Remove container if empty
      if (toastContainer.childNodes.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 500);
  }, duration);
}