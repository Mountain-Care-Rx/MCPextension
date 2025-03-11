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

// Import required UI components
import { createClickableDisplay, updateClickableDisplayValue } from './components/clickableDisplay.js';
import { createActionsGroup } from './components/actionsGroup.js';
import { createDropdownsGroup } from './components/dropdownsGroup.js';
import { createSettingsGroup } from './components/settingsGroup.js';
import { createHeaderStyles } from './styles/headerStyles.js';

// Track if the header has been initialized
let headerInitialized = false;

/**
 * Creates a fixed toolbar with various components:
 * - Clickable displays for patient info (Phone, DOB, Name, SRx ID)
 * - Action buttons for automation
 * - Multiple dropdown menus for specialized tasks
 * - Settings menu
 */
export function createFixedHeader() {
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

    // Create logo section
    const logoGroup = document.createElement("div");
    logoGroup.className = "group";
    
    const logo = document.createElement("div");
    logo.className = "logo";
    logo.textContent = "CRM+";
    logoGroup.appendChild(logo);
    
    // Create external links group
    const externalLinksGroup = document.createElement("div");
    externalLinksGroup.className = "group external-links";
    
    // Detect browser environment
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  // Get extension URL for assets
  const getExtensionAssetUrl = (path) => {
    return browserAPI.runtime.getURL(path);
  };
  
  // 1. ShipStation link
  const shipStationLink = createTextLink(
    "ShipStation",
    "https://ship15.shipstation.com/onboard",
    "shipstation-link"
  );
  externalLinksGroup.appendChild(shipStationLink);
  
  // 2. Stripe link
  const stripeLink = createTextLink(
    "Stripe",
    "https://dashboard.stripe.com/login",
    "stripe-link"
  );
  externalLinksGroup.appendChild(stripeLink);
  
  // 3. Webmail link
  const webmailLink = createTextLink(
    "Webmail",
    "https://p3plzcpnl506102.prod.phx3.secureserver.net:2096/cpsess5640910985/webmail/jupiter/index.html?login=1&post_login=89371011642013",
    "webmail-link"
  );
    externalLinksGroup.appendChild(webmailLink);
    
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
    
    // Add spacer to push settings to the right
    const spacer = document.createElement("div");
    spacer.className = "spacer";
    
    // Create settings section
    const settingsGroup = createSettingsGroup();
    
    // Add all groups to header
    header.appendChild(logoGroup);
    header.appendChild(externalLinksGroup); // Add the external links group after the logo
    header.appendChild(nameGroup);
    header.appendChild(phoneGroup);
    header.appendChild(dobGroup);
    header.appendChild(srxIdGroup);
    header.appendChild(actionsGroup);
    header.appendChild(dropdownsGroup);
    header.appendChild(spacer);
    header.appendChild(settingsGroup);
    
    // Add header to body
    document.body.appendChild(header);
    document.body.style.paddingTop = isHeaderVisible ? "32px" : "0";
    
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
    
    // Additional check to clear phone display when URL changes
    window.addEventListener('popstate', function() {
      console.log('[CRM Extension] Navigation detected, clearing phone display');
      clearPhoneDisplay();
    });
    
    // As an extra safety measure, check if we're on a patient profile
    // If not, make sure phone is cleared
    if (!isPatientProfilePage()) {
      clearPhoneDisplay();
    }
    
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
 * Creates a text link for external resources
 * 
 * @param {string} text - Text to display on the link
 * @param {string} url - URL to navigate to
 * @param {string} customClass - Optional custom class for specific styling
 * @returns {HTMLElement} The created link element
 */
function createTextLink(text, url, customClass = "") {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank"; // Open in new tab
  link.className = `text-link btn ${customClass}`; // Added custom class
  link.textContent = text;
  link.rel = "noopener noreferrer"; // Security best practice for external links
  
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
      
      // Update visibility
      header.style.display = isVisible ? "flex" : "none";
      
      // Update body padding
      document.body.style.paddingTop = isVisible ? "32px" : "0";
      
      // Store in localStorage for persistence, not browser.storage
      localStorage.setItem("crmplus_headerBarVisible", isVisible.toString());
      
      return true;
    } else if (isVisible) {
      // If header doesn't exist but should be visible, create it
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

// Export updateClickableDisplayValue for use by other modules
export { updateClickableDisplayValue };