// modules/ui/headerBar.js

// Import utilities from consolidated phoneUtils.js
import {
  getRawPhoneNumber,
  formatPhoneNumber,
  copyToClipboard,
  showToast,
  updatePhoneDisplay,
  detectPhone,
  initPhoneMonitoring,
  handlePhoneCopy,
  clearPhoneDisplay
} from '../phoneUtils.js';

// Import the other dedicated utility modules
import { updateNameDisplay, detectName, initNameMonitoring } from '../nameUtils.js';
import { updateDOBDisplay, detectDOB, initDOBMonitoring, formatDateDisplay } from '../dobUtils.js';
import { detectSRxID, initSRxIDMonitoring } from '../srxIdUtils.js';
// Keep imports but won't create the buttons directly in the header
import { removeAllTags } from '../tagRemoveUtils.js';
import { removeAllAutomations } from '../automationRemoveUtils.js';
import { initHistoryTracking } from '../historyUtils.js';

// Import required UI components
import { createClickableDisplay, updateClickableDisplayValue } from './components/clickableDisplay.js';
import { createActionsGroup } from './components/actionsGroup.js';
import { createDropdownsGroup } from './components/dropdownsGroup.js';
import { createSettingsGroup } from './components/settingsGroup.js';
import { createHeaderStyles } from './styles/headerStyles.js';
import { createHistoryDropdown } from './components/dropdowns/historyDropdown.js';

// Track if the header has been initialized
let headerInitialized = false;

/**
 * Creates a fixed toolbar with various components:
 * - Clickable displays for patient info (Phone, DOB, Name, SRx ID)
 * - Action buttons for automation
 * - Multiple dropdown menus for specialized tasks
 * - Chat integration
 * - History tracking
 * - Settings menu
 */
export function createFixedHeader() {
  // Only show header on contacts or conversations pages
  if (
    window.location.hostname !== 'app.mtncarerx.com' ||
    (!window.location.href.includes('contacts') && !window.location.href.includes('conversations'))
  ) {
    return;
  }

  try {
    // Check if header already exists to avoid duplicates
    if (document.getElementById("mcp-crm-header")) {
      console.log("[uiHeaderBar] Toolbar already exists.");
      return;
    }

    // Apply header styles
    createHeaderStyles();

    const header = document.createElement("div");
    header.id = "mcp-crm-header";

    // Check visibility setting (default to visible if setting doesn't exist)
    // IMPORTANT: Use localStorage instead of browser storage
    const isHeaderVisible = localStorage.getItem("crmplus_headerBarVisible") !== "false"; // default to true
    console.log("[CRM Extension] Header visibility setting:", isHeaderVisible);

    // Set initial visibility
    header.style.display = isHeaderVisible ? "flex" : "none";

    // Detect browser environment for asset URLs
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    // Get extension URL for assets
    const getExtensionAssetUrl = (path) => {
      return browserAPI.runtime.getURL(path);
    };

    // Create logo section with link and icon
    const logoGroup = document.createElement("div");
    logoGroup.className = "group";

    // Create logo link
    const logoLink = document.createElement("a");
    logoLink.href = "https://app.mtncarerx.com/";
    logoLink.className = "logo-link";

    // Create logo icon
    const logoIcon = document.createElement("img");
    logoIcon.src = getExtensionAssetUrl("assets/mcp-favicon.ico");
    logoIcon.alt = "";
    logoIcon.className = "logo-icon";
    logoLink.appendChild(logoIcon);

    // Create logo text
    const logoText = document.createElement("span");
    logoText.className = "logo";
    logoText.textContent = "CRM+";
    logoLink.appendChild(logoText);

    logoGroup.appendChild(logoLink);

    // Create external links group
    const externalLinksGroup = document.createElement("div");
    externalLinksGroup.className = "group external-links";

    // 1. ShipStation link with icon
    const shipStationLink = createTextLinkWithIcon(
      "ShipStation",
      "https://ship15.shipstation.com/onboard",
      "shipstation-link",
      getExtensionAssetUrl("assets/shipstation-favicon.ico")
    );
    externalLinksGroup.appendChild(shipStationLink);

    // 2. Stripe link with icon
    // const stripeLink = createTextLinkWithIcon(
    //   "Stripe",
    //   "https://dashboard.stripe.com/login",
    //   "stripe-link",
    //   getExtensionAssetUrl("assets/stripe-favicon.ico")
    // );
    // externalLinksGroup.appendChild(stripeLink);

    // 3. Webmail link with icon
    const messengerLink = createTextLinkWithIcon(
      "Messenger",
      "https://messenger.mtncarerx.com/",
      "messenger-link",
      getExtensionAssetUrl("assets/mcp-favicon.ico")
    );
    externalLinksGroup.appendChild(messengerLink);

    // Create various clickable displays for patient info
    const nameGroup = createClickableDisplay('name', 'Name');
    const phoneGroup = createClickableDisplay('phone', 'Phone', {
      icon: '📞',
      initialValue: '', // Always start with empty value
      onClick: async (displayElement) => {
        handlePhoneCopy(displayElement);
      }
    });

    const dobGroup = createClickableDisplay('dob', 'DOB');
    const srxIdGroup = createClickableDisplay('srxid', 'SRx ID');

    // Create action buttons group
    const actionsGroup = createActionsGroup();

    // Create dropdowns group
    const dropdownsGroup = createDropdownsGroup();

    // Add spacer to push right-side buttons to the right
    const spacer = document.createElement("div");
    spacer.className = "spacer";

    // Create right-side buttons group to contain Chat and History
    const rightButtonsGroup = document.createElement("div");
    rightButtonsGroup.className = "group right-buttons";
    rightButtonsGroup.style.borderRight = "none"; // Remove right border for consistent look
    rightButtonsGroup.style.display = "flex";
    rightButtonsGroup.style.marginRight = "0";

    // Create chat button with explicit click handler
    // const chatButton = document.createElement("button");
    // chatButton.className = "chat-button btn";
    // chatButton.title = "Mountain Care Chat";
    // chatButton.style.marginRight = "8px";

    // Create the content wrapper to hold the icon and text
    const chatContentWrapper = document.createElement("div");
    chatContentWrapper.style.display = "flex";
    chatContentWrapper.style.alignItems = "center";
    chatContentWrapper.style.justifyContent = "center";

    // Add chat icon
    // const chatIcon = document.createElement("span");
    // chatIcon.className = "icon";
    // chatIcon.innerHTML = '💬';
    // chatIcon.style.marginRight = "4px";

    // Add chat text
    // const chatText = document.createElement("span");
    // chatText.textContent = "Chat";

    // Add badge for notifications
    // const badge = document.createElement("span");
    // badge.className = "badge";
    // Object.assign(badge.style, {
    //   position: 'absolute',
    //   top: '0',
    //   right: '0',
    //   backgroundColor: '#f44336',
    //   color: 'white',
    //   fontSize: '12px',
    //   fontWeight: 'bold',
    //   padding: '2px 6px',
    //   borderRadius: '50%',
    //   display: 'none'
    // });

    // Assemble the chat button
    // chatContentWrapper.appendChild(chatIcon);
    // chatContentWrapper.appendChild(chatText);
    // chatButton.appendChild(chatContentWrapper);
    // chatButton.appendChild(badge);

    // Add explicit click handler
    // chatButton.addEventListener("click", function() {
    //   console.log('[CRM Extension] Chat button clicked');

      // Call the global toggleChatUI function if available
    //   if (typeof window.toggleChatUI === 'function') {
    //     window.toggleChatUI();
    //   } else {
    //     console.error('[CRM Extension] toggleChatUI function not available');

    //     // Fallback: Try to toggle visibility directly
    //     const chatContainer = document.getElementById('hipaa-chat-container');
    //     if (chatContainer) {
    //       chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    //       console.log('[CRM Extension] Toggled chat container visibility as fallback');
    //     } else {
    //       console.error('[CRM Extension] Chat container not found');

    //       // As a last resort, try to initialize the chat UI explicitly
    //       try {
    //         if (typeof initChat === 'function') {
    //           initChat().then(() => {
    //             if (typeof window.toggleChatUI === 'function') {
    //               window.toggleChatUI();
    //             }
    //           });
    //         }
    //       } catch (chatError) {
    //         console.error('[CRM Extension] Failed to initialize chat:', chatError);
    //       }
    //     }
    //   }
    // });

    // Create history dropdown
    const historyDropdown = createHistoryDropdown();

    // Add chat and history to right buttons group
    // rightButtonsGroup.appendChild(chatButton);
    rightButtonsGroup.appendChild(historyDropdown);

    // Create settings section
    const settingsGroup = createSettingsGroup();

    // Add all groups to header - rearranged for better positioning
    header.appendChild(logoGroup);
    header.appendChild(externalLinksGroup); // Add the external links group after the logo
    header.appendChild(nameGroup);
    header.appendChild(phoneGroup);
    header.appendChild(dobGroup);
    header.appendChild(srxIdGroup);
    header.appendChild(dropdownsGroup); // Automation and Tags dropdowns right after SRx ID
    header.appendChild(actionsGroup);
    header.appendChild(spacer); // Spacer to push buttons to the right
    header.appendChild(rightButtonsGroup); // Add the right buttons group (Chat and History)
    header.appendChild(settingsGroup); // Settings stays at the far right

    // Add header to body
    document.body.insertBefore(header, document.body.firstChild); // Ensure header is at the very top

    // Set body padding to match header height (force with !important)
    header.style.position = "fixed";
    header.style.top = "0";
    header.style.left = "0";
    header.style.right = "0";
    header.style.zIndex = "9999";
    header.style.width = "100%";
    header.style.boxSizing = "border-box";
    // Set the height explicitly if not already set in CSS
    header.style.height = "32px";

    // Set initial visibility for automation elements based on setting
    setTimeout(() => {
      try {
        const isAutomationEnabled = localStorage.getItem("crmplus_automationEnabled") === "true";

        // List of all elements affected by the CRM Automation setting
        const automationElements = [
          document.getElementById("crm-automation-dropdown"),   // Automation dropdown
          document.getElementById("crm-tags-dropdown"),         // Tags dropdown
        ];

        // Set visibility for each automation element
        // Fixed logic: enabled = visible, disabled = hidden
        automationElements.forEach(element => {
          if (element) {
            element.style.display = isAutomationEnabled ? "flex" : "none";
            console.log(`[CRM Extension] Initial visibility for ${element.id}: ${isAutomationEnabled ? "visible" : "hidden"}`);
          }
        });

      } catch (err) {
        console.error("[CRM Extension] Error setting initial automation visibility:", err);
      }
    }, 100);

    // Initialize monitoring modules - important to clear phone first
    clearPhoneDisplay(); // Explicitly clear phone display initially

    // Now initialize all monitoring systems
    initNameMonitoring();
    initDOBMonitoring();
    initPhoneMonitoring();
    initSRxIDMonitoring();
    initHistoryTracking(); // Initialize history tracking

    // Initialize HIPAA-compliant chat system
    // initChat();

    // Initialize chat monitoring
    // initChatMonitoring();

    // Handle new chat messages
    // onNewMessages(messages => {
    //   if (messages.length > 0) {
    //     const latestMessage = messages[0];
    //     // Show a toast notification for the latest message
    //     showToast(`New message from ${latestMessage.sender}: ${latestMessage.text.substring(0, 30)}${latestMessage.text.length > 30 ? '...' : ''}`, 3000);
    //   }
    // });

    // // Additional check to clear phone display when URL changes
    // window.addEventListener('popstate', function() {
    //   console.log('[CRM Extension] Navigation detected, clearing phone display');
    //   clearPhoneDisplay();
    // });

    // // As an extra safety measure, check if we're on a patient profile
    // // If not, make sure phone is cleared
    // if (!isPatientProfilePage()) {
    //   clearPhoneDisplay();
    // }

    // Mark header as initialized to prevent duplicate initialization
    headerInitialized = true;
    console.log('[CRM Extension] Header successfully initialized');

  } catch (err) {
    console.error("[CRM Extension] Critical error creating toolbar:", err);
    // Try to recover by attempting to show the toolbar anyway
    try {
      const header = document.getElementById("mcp-crm-header");
      if (header) {
        header.style.display = "flex";
      }
    } catch (e) {
      console.error("[CRM Extension] Failed to recover toolbar:", e);
    }
  }
}

/**
 * Creates a text link with an icon for external resources
 *
 * @param {string} text - Text to display on the link
 * @param {string} url - URL to navigate to
 * @param {string} customClass - Optional custom class for specific styling
 * @param {string} iconUrl - URL to icon image
 * @returns {HTMLElement} The created link element
 */
function createTextLinkWithIcon(text, url, customClass = "", iconUrl = "") {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank"; // Open in new tab
  link.className = `text-link btn ${customClass}`; // Added custom class
  link.rel = "noopener noreferrer"; // Security best practice for external links

  // Create container to center content
  const contentWrapper = document.createElement("div");
  contentWrapper.style.display = "flex";
  contentWrapper.style.alignItems = "center";
  contentWrapper.style.justifyContent = "center";
  contentWrapper.style.width = "100%";

  // Create and add icon if provided
  if (iconUrl) {
    const icon = document.createElement("img");
    icon.src = iconUrl;
    icon.alt = "";
    icon.className = "link-icon";
    icon.style.width = "16px";
    icon.style.height = "16px";
    icon.style.marginRight = "4px";
    contentWrapper.appendChild(icon);
  }

  // Add text
  const textSpan = document.createElement("span");
  textSpan.textContent = text;
  contentWrapper.appendChild(textSpan);

  link.appendChild(contentWrapper);
  return link;
}

/**
 * Check if the current page is a patient profile page
 * MODIFIED: This function is only used for phone display functionality,
 * not to determine if the toolbar should be shown
 *
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
 * Toggle the header bar visibility
 * @param {boolean} isVisible - Whether the header should be visible
 * @returns {boolean} - Success status
 */
export function toggleHeaderVisibility(isVisible) {
  try {
    const header = document.getElementById("mcp-crm-header");
    if (header) {
      console.log(`[CRM Extension] Setting header visibility to: ${isVisible}`);
      header.style.display = isVisible ? "flex" : "none";
      localStorage.setItem("crmplus_headerBarVisible", isVisible.toString());
      return true;
    } else if (isVisible) {
      console.log(`[CRM Extension] Header not found but should be visible, creating it`);
      createFixedHeader();
      return true;
    }
    return false;
  } catch (e) {
    console.error("[CRM Extension] Error toggling header visibility:", e);
    return false;
  }
}

/**
 * Checks if the header is initialized
 * @returns {boolean} True if header is initialized
 */
export function isHeaderInitialized() {
  return headerInitialized;
}

/**
 * Removes the fixed header bar if it exists and cleans up padding/style.
 */
export function removeHeaderBar() {
  const header = document.getElementById("mcp-crm-header");
  if (header) {
    header.remove();
    document.body.classList.add('no-header'); // Optionally keep this if used for other styling
    headerInitialized = false;
    console.log('[CRM Extension] Header removed due to navigation');
  }
}

// Re-add export for removeAllTags and removeAllAutomations to fix import error in apiDropdown.js
export { removeAllTags, removeAllAutomations };
