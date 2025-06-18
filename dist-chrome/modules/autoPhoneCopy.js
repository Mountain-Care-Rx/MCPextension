// modules/autoPhoneCopy.js

import { getRawPhoneNumber, formatPhoneNumber, copyToClipboard, showToast } from './phoneUtils.js';

/**
 * Automatically waits for the phone input field (name="contact.phone") to load,
 * retrieves and formats its value (removing non-digit characters and prepending "+1"),
 * copies the formatted number to the clipboard, and shows a toast notification.
 */
export function autoCopyPhone() {
  // Check if auto-copy is enabled in settings (default to disabled/false)
  const isAutoCopyEnabled = localStorage.getItem("crmplus_autoCopyPhone") === "true";
  
  // If auto-copy is disabled, exit early
  if (!isAutoCopyEnabled) {
    console.log("[CRM Extension] Auto-copy phone is disabled");
    return;
  }
  
  // Try to find and copy the phone number if available.
  const tryCopy = () => {
    const raw = getRawPhoneNumber();
    if (raw) {
      const formatted = formatPhoneNumber(raw);
      if (formatted) {
        copyToClipboard(formatted)
          .then(success => {
            if (success) {
              showToast("Phone number auto-copied: " + formatted);
              return true;
            }
          });
      }
    }
    return false;
  };

  // First, check immediately.
  if (tryCopy()) return;

  // Set up a MutationObserver to watch for the phone input or its value change.
  const observer = new MutationObserver((mutations, obs) => {
    if (tryCopy()) {
      obs.disconnect();
    }
  });

  observer.observe(document.body, { 
    childList: true, 
    subtree: true, 
    attributes: true,
    characterData: true
  });

  // Fallback: after 5 seconds, disconnect the observer and try one more time.
  setTimeout(() => {
    observer.disconnect();
    tryCopy();
  }, 5000);
}