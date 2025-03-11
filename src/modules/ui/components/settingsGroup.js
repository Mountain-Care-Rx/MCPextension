// modules/ui/components/settingsGroup.js - Updated with version information display and update status

import { showToast } from '../../phoneUtils.js';

/**
 * Creates the settings group with settings button and dropdown menu
 * 
 * @returns {HTMLElement} The settings group element
 */
export function createSettingsGroup() {
  const settingsGroup = document.createElement("div");
  settingsGroup.className = "group";
  settingsGroup.id = "crm-settings-group";
  settingsGroup.style.position = "relative"; // Make sure position is relative for dropdown positioning
  
  // Create "Settings" button
  const btnSettings = document.createElement("button");
  btnSettings.className = "btn";
  btnSettings.id = "crm-settings-btn";
  
  // Add settings icon
  const settingsIcon = document.createElement("span");
  settingsIcon.className = "btn-icon";
  settingsIcon.innerHTML = "⚙️";
  btnSettings.appendChild(settingsIcon);
  
  // Add button text
  const settingsText = document.createElement("span");
  settingsText.textContent = "Settings";
  btnSettings.appendChild(settingsText);
  
  // Create settings dropdown
  const settingsDropdown = createSettingsDropdown();
  
  // Toggle settings dropdown when settings button is clicked
  btnSettings.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle("show");
  });
  
  // Close settings dropdown when clicking elsewhere
  document.addEventListener("click", (e) => {
    if (e.target !== btnSettings && !btnSettings.contains(e.target) && 
        e.target !== settingsDropdown && !settingsDropdown.contains(e.target)) {
      settingsDropdown.classList.remove("show");
    }
  });
  
  // Add custom styles for settings dropdown
  if (!document.getElementById('settings-dropdown-styles')) {
    const style = document.createElement('style');
    style.id = 'settings-dropdown-styles';
    style.textContent = `
      #mcp-crm-settings-dropdown {
        display: none;
        position: absolute;
        top: calc(100% + 5px); /* Position below the button with 5px gap */
        right: 0;
        z-index: 1000;
        min-width: 230px;
        background-color: #2F3A4B;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        overflow: hidden;
      }
      
      #mcp-crm-settings-dropdown.show {
        display: block;
      }
      
      .settings-header {
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: bold;
        color: #e6e6e6;
      }
      
      .settings-body {
        padding: 10px;
        color: #e6e6e6;
      }
      
      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 13px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 10px;
      }
      
      .setting-item:last-child {
        margin-bottom: 0;
        border-bottom: none;
        padding-bottom: 0;
      }
      
      .setting-label {
        color: #e6e6e6;
        font-weight: normal;
      }
      
      /* Toggle switch styles */
      .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
      }
      
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #555;
        transition: .4s;
        border-radius: 34px;
      }
      
      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      
      input:checked + .slider {
        background-color: #2196F3;
      }
      
      input:focus + .slider {
        box-shadow: 0 0 1px #2196F3;
      }
      
      input:checked + .slider:before {
        transform: translateX(20px);
      }
      
      /* Version info styles */
      .version-info {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        margin-top: 10px;
        padding-top: 10px;
        font-size: 12px;
        color: #e6e6e6;
      }
      
      .version-info p {
        margin: 5px 0;
        color: #e6e6e6;
      }
      
      .version-number {
        font-weight: 600;
        color: #e6e6e6;
      }
      
      .check-updates-btn {
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 4px 8px;
        margin-top: 5px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
        text-align: center;
        color: #e6e6e6;
      }
      
      .check-updates-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .check-updates-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      #crm-update-status {
        margin: 5px 0 0 0;
        padding: 3px 6px;
        font-size: 11px;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.05);
        text-align: center;
        transition: all 0.3s ease;
        color: #e6e6e6;
      }
      
      #last-update-check {
        font-size: 11px;
        margin: 5px 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        color: #e6e6e6;
      }
      
      .check-status {
        font-size: 10px;
        margin-left: 5px;
        padding: 1px 4px;
        border-radius: 3px;
        font-weight: normal;
      }
      
      .loading-text {
        font-style: italic;
        color: #aaa;
      }
      
      /* Section styles */
      .setting-section {
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .setting-section-title {
        font-size: 12px;
        font-weight: bold;
        color: #e6e6e6;
        margin-bottom: 10px;
      }
    `;
    document.head.appendChild(style);
  }
  
  settingsGroup.appendChild(btnSettings);
  settingsGroup.appendChild(settingsDropdown);
  
  return settingsGroup;
}

/**
 * Fetches and displays the last update check information
 * @param {HTMLElement} displayElement - Element to update with the info
 */
function fetchLastUpdateCheckInfo(displayElement) {
  try {
    // Detect browser environment
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    
    // Request last update check data from background script
    browserAPI.runtime.sendMessage({ action: 'getLastUpdateCheck' })
      .then(response => {
        if (response && response.success && response.lastUpdateCheck) {
          const lastCheck = response.lastUpdateCheck;
          
          // Format status text and color based on status and success
          let statusText = "";
          let statusColor = "";
          
          if (lastCheck.success) {
            if (lastCheck.status === "update_available") {
              statusText = "Update available";
              statusColor = "#4CAF50"; // Green
            } else if (lastCheck.status === "no_update") {
              statusText = "No updates needed";
              statusColor = "#2196F3"; // Blue
            } else if (lastCheck.status === "throttled") {
              statusText = "Check throttled";
              statusColor = "#FF9800"; // Orange
            } else {
              statusText = "Completed";
              statusColor = "#2196F3"; // Blue
            }
          } else {
            statusText = "Failed";
            statusColor = "#F44336"; // Red
          }
          
          // Update the display element
          displayElement.innerHTML = `Last Check: <span class="version-number">${lastCheck.formattedTime}</span> <span class="check-status" style="color:${statusColor};font-size:10px;margin-left:5px;">${statusText}</span>`;
        } else {
          // No data available yet
          displayElement.innerHTML = `Last Check: <span class="version-number">No checks recorded</span>`;
        }
      })
      .catch(error => {
        console.error("[CRM Extension] Error fetching last update check:", error);
        displayElement.innerHTML = `Last Check: <span class="version-number">Unknown</span>`;
      });
  } catch (error) {
    console.error("[CRM Extension] Error in fetchLastUpdateCheckInfo:", error);
    displayElement.innerHTML = `Last Check: <span class="version-number">Error</span>`;
  }
}

/**
 * Creates the settings dropdown menu
 * 
 * @returns {HTMLElement} The settings dropdown element
 */
function createSettingsDropdown() {
  const settingsDropdown = document.createElement("div");
  settingsDropdown.id = "mcp-crm-settings-dropdown";
  
  // Create settings header
  const settingsHeader = document.createElement("div");
  settingsHeader.className = "settings-header";
  settingsHeader.textContent = "CRM+ Settings";
  settingsDropdown.appendChild(settingsHeader);
  
  // Create settings body
  const settingsBody = document.createElement("div");
  settingsBody.className = "settings-body";
  settingsDropdown.appendChild(settingsBody);
  
  // Add feature sections
  
  // Section 1: General Settings
  const generalSection = document.createElement("div");
  generalSection.className = "setting-section";
  
  const generalTitle = document.createElement("div");
  generalTitle.className = "setting-section-title";
  generalTitle.textContent = "General Settings";
  generalSection.appendChild(generalTitle);
  
  // Add header visibility setting
  generalSection.appendChild(createSettingItem(
    "Show Header Bar",
    "crmplus_headerBarVisible",
    (enabled) => {
      // Apply the header visibility change directly
      const header = document.getElementById("mcp-crm-header");
      if (header) {
        header.style.display = enabled ? "flex" : "none";
        document.body.style.paddingTop = enabled ? "32px" : "0";
      }
      
      showToast(`Header bar: ${enabled ? "Visible" : "Hidden"}`);
    },
    true // default to true
  ));
  
  // Add to body
  settingsBody.appendChild(generalSection);
  
  // Section 2: Toolbar Links
  const linksSection = document.createElement("div");
  linksSection.className = "setting-section";
  
  const linksTitle = document.createElement("div");
  linksTitle.className = "setting-section-title";
  linksTitle.textContent = "External Links";
  linksSection.appendChild(linksTitle);
  
  // Add ShipStation link visibility setting
  linksSection.appendChild(createSettingItem(
    "Show ShipStation Link",
    "crmplus_showShipStation",
    (enabled) => {
      // Apply visibility change directly
      const shipStationLink = document.querySelector(".shipstation-link");
      if (shipStationLink) {
        shipStationLink.style.display = enabled ? "flex" : "none";
      }
      
      showToast(`ShipStation link: ${enabled ? "Visible" : "Hidden"}`);
    },
    true // default to true
  ));
  
  // Add Stripe link visibility setting
  linksSection.appendChild(createSettingItem(
    "Show Stripe Link",
    "crmplus_showStripe",
    (enabled) => {
      // Apply visibility change directly
      const stripeLink = document.querySelector(".stripe-link");
      if (stripeLink) {
        stripeLink.style.display = enabled ? "flex" : "none";
      }
      
      showToast(`Stripe link: ${enabled ? "Visible" : "Hidden"}`);
    },
    true // default to true
  ));
  
  // Add Webmail link visibility setting
  linksSection.appendChild(createSettingItem(
    "Show Webmail Link",
    "crmplus_showWebmail",
    (enabled) => {
      // Apply visibility change directly
      const webmailLink = document.querySelector(".webmail-link");
      if (webmailLink) {
        webmailLink.style.display = enabled ? "flex" : "none";
      }
      
      showToast(`Webmail link: ${enabled ? "Visible" : "Hidden"}`);
    },
    true // default to true
  ));
  
  // Add to body
  settingsBody.appendChild(linksSection);
  
  // Section 3: Feature Settings
  const featureSection = document.createElement("div");
  featureSection.className = "setting-section";
  
  const featureTitle = document.createElement("div");
  featureTitle.className = "setting-section-title";
  featureTitle.textContent = "Features";
  featureSection.appendChild(featureTitle);
  
  // Add auto-copy setting
  featureSection.appendChild(createSettingItem(
    "Auto-copy phone number on page load",
    "crmplus_autoCopyPhone",
    (enabled) => {
      showToast(`Auto-copy phone: ${enabled ? "Enabled" : "Disabled"}`);
    },
    false // default to false
  ));
  
  // Add automation options setting
  featureSection.appendChild(createSettingItem(
    "CRM Automation",
    "crmplus_automationEnabled",
    (enabled) => {
      // Update visibility of automation elements
      const automationElements = [
        document.getElementById("crm-automation-dropdown"),  // Automation dropdown
        document.getElementById("crm-tags-dropdown"),        // Tags dropdown
      ];
      
      // Set visibility for each automation element
      automationElements.forEach(element => {
        if (element) {
          // Fixed logic: enabled = visible, disabled = hidden
          element.style.display = enabled ? "flex" : "none";
          console.log(`[CRM Extension] Changed visibility for ${element.id}: ${enabled ? "visible" : "hidden"}`);
        } else {
          console.error(`[CRM Extension] Could not find automation element to toggle`);
        }
      });
      
      showToast(`CRM Automation: ${enabled ? "Enabled" : "Disabled"}`);
    },
    true // default to true
  ));
  
  // Add to body
  settingsBody.appendChild(featureSection);
  
  // Add version information section
  const versionInfo = createVersionInfoSection();
  settingsBody.appendChild(versionInfo);
  
  return settingsDropdown;
}

/**
 * Creates the version information section
 * 
 * @returns {HTMLElement} The version info section element
 */
function createVersionInfoSection() {
  // Create container
  const versionInfo = document.createElement("div");
  versionInfo.className = "version-info";
  
  // Get version from manifest (if possible)
  let versionNumber = "Loading...";
  let lastUpdated = "Loading...";
  
  try {
    // Detect browser environment
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    
    // Try to get the manifest info
    const manifest = browserAPI.runtime.getManifest();
    if (manifest && manifest.version) {
      versionNumber = manifest.version;
      
      // Parse date-based version (if applicable)
      if (versionNumber.includes('.')) {
        const parts = versionNumber.split('.');
        if (parts.length === 3 && parts[0].length === 4) { // YYYY.MM.DD format
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          lastUpdated = `${month}/${day}/${year}`;
        }
      }
    }
  } catch (error) {
    console.error("[CRM Extension] Error fetching version:", error);
    versionNumber = "Unknown";
    lastUpdated = "Unknown";
  }
  
  // Create version display
  const versionNumberElem = document.createElement("p");
  versionNumberElem.innerHTML = `Version: <span class="version-number">${versionNumber}</span>`;
  versionInfo.appendChild(versionNumberElem);
  
  // Create last updated display
  const lastUpdatedElem = document.createElement("p");
  lastUpdatedElem.innerHTML = `Last Updated: <span class="version-number">${lastUpdated}</span>`;
  versionInfo.appendChild(lastUpdatedElem);
  
  // Create last check display
  const lastCheckElem = document.createElement("p");
  lastCheckElem.id = "last-update-check";
  lastCheckElem.innerHTML = `Last Check: <span class="loading-text">Loading...</span>`;
  versionInfo.appendChild(lastCheckElem);
  
  // Fetch and display the last update check info
  fetchLastUpdateCheckInfo(lastCheckElem);
  
  // Add check for updates button
  const checkUpdatesBtn = document.createElement("button");
  checkUpdatesBtn.className = "check-updates-btn";
  checkUpdatesBtn.textContent = "Check for Updates";
  checkUpdatesBtn.addEventListener("click", () => {
    // Detect browser environment
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
    
    // Update button state and text
    checkUpdatesBtn.disabled = true;
    checkUpdatesBtn.textContent = "Checking...";
    showToast("Checking for updates...");
    
    // Add a status display element if it doesn't exist
    let statusElement = document.getElementById("crm-update-status");
    if (!statusElement) {
      statusElement = document.createElement("p");
      statusElement.id = "crm-update-status";
      statusElement.style.fontSize = "11px";
      statusElement.style.marginTop = "5px";
      statusElement.style.color = "#e6e6e6";
      statusElement.textContent = ""; // Empty initially
      versionInfo.appendChild(statusElement);
    }
    
    // Send message to background script to check for updates
    browserAPI.runtime.sendMessage({ action: 'checkForUpdates' })
      .then(response => {
        if (response && response.success) {
          showToast("Update check completed");
          
          // Handle different status responses
          if (response.updateStatus === "update_available") {
            statusElement.textContent = `Update available (${response.updateVersion})`;
            statusElement.style.color = "#4CAF50"; // Green color
          } else if (response.updateStatus === "no_update") {
            statusElement.textContent = "You have the latest version";
            statusElement.style.color = "#2196F3"; // Blue color
          } else if (response.updateStatus === "throttled") {
            statusElement.textContent = "Update check throttled, try again later";
            statusElement.style.color = "#FF9800"; // Orange color
          } else if (response.updateStatus === "error") {
            statusElement.textContent = "Error checking for updates";
            statusElement.style.color = "#F44336"; // Red color
          } else {
            statusElement.textContent = "Update check initiated";
            statusElement.style.color = "#e6e6e6"; // Default color
          }
          
          // Update the last check display
          const lastCheckElem = document.getElementById("last-update-check");
          if (lastCheckElem && response.lastCheck) {
            const lastCheck = response.lastCheck;
            let statusText = "";
            let statusColor = "";
            
            if (lastCheck.success) {
              if (lastCheck.status === "update_available") {
                statusText = "Update available";
                statusColor = "#4CAF50"; // Green
              } else if (lastCheck.status === "no_update") {
                statusText = "No updates needed";
                statusColor = "#2196F3"; // Blue
              } else if (lastCheck.status === "throttled") {
                statusText = "Check throttled";
                statusColor = "#FF9800"; // Orange
              } else {
                statusText = "Completed";
                statusColor = "#2196F3"; // Blue
              }
            } else {
              statusText = "Failed";
              statusColor = "#F44336"; // Red
            }
            
            lastCheckElem.innerHTML = `Last Check: <span class="version-number">${lastCheck.formattedTime}</span> <span class="check-status" style="color:${statusColor};font-size:10px;margin-left:5px;">${statusText}</span>`;
          }
        } else {
          showToast("Error checking for updates");
          statusElement.textContent = "Update check failed";
          statusElement.style.color = "#F44336"; // Red color
        }
        
        // Re-enable the button
        checkUpdatesBtn.disabled = false;
        checkUpdatesBtn.textContent = "Check for Updates";
      })
      .catch(error => {
        console.error("[CRM Extension] Error sending update check message:", error);
        showToast("Error checking for updates");
        statusElement.textContent = "Connection failed";
        statusElement.style.color = "#F44336"; // Red color
        
        // Re-enable the button
        checkUpdatesBtn.disabled = false;
        checkUpdatesBtn.textContent = "Check for Updates";
      });
  });
  versionInfo.appendChild(checkUpdatesBtn);
  
  return versionInfo;
}

/**
 * Creates a setting item with toggle switch
 * 
 * @param {string} label - Setting label text
 * @param {string} storageKey - LocalStorage key for the setting
 * @param {Function} changeCallback - Function to call when setting changes
 * @param {boolean} defaultValue - Default value for the setting
 * @returns {HTMLElement} The setting item element
 */
function createSettingItem(label, storageKey, changeCallback, defaultValue = false) {
  const settingItem = document.createElement("div");
  settingItem.className = "setting-item";
  
  // Create label element
  const labelElement = document.createElement("div");
  labelElement.className = "setting-label";
  labelElement.textContent = label;
  settingItem.appendChild(labelElement);
  
  // Create toggle switch
  const toggleSwitch = document.createElement("label");
  toggleSwitch.className = "switch";
  
  // Create toggle input
  const toggleInput = document.createElement("input");
  toggleInput.type = "checkbox";
  
  // Get the saved setting value or use default
  const savedValue = localStorage.getItem(storageKey);
  const isEnabled = savedValue !== null ? savedValue === "true" : defaultValue;
  
  // If no saved value, initialize with default
  if (savedValue === null) {
    localStorage.setItem(storageKey, defaultValue.toString());
  }
  
  toggleInput.checked = isEnabled;
  
  // When toggle changes, save setting and invoke callback
  toggleInput.addEventListener("change", () => {
    const newState = toggleInput.checked;
    // Save to localStorage
    localStorage.setItem(storageKey, newState.toString());
    
    if (changeCallback && typeof changeCallback === 'function') {
      changeCallback(newState);
    }
  });
  
  // Create slider element
  const slider = document.createElement("span");
  slider.className = "slider";
  
  // Assemble toggle switch
  toggleSwitch.appendChild(toggleInput);
  toggleSwitch.appendChild(slider);
  settingItem.appendChild(toggleSwitch);
  
  return settingItem;
}