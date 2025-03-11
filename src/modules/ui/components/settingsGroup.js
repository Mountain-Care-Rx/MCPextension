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
        background-color: #fff;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }
      
      #mcp-crm-settings-dropdown.show {
        display: block;
      }
      
      .settings-header {
        padding: 10px;
        background-color: #f5f5f5;
        border-bottom: 1px solid #ddd;
        font-weight: bold;
        color: #333;
      }
      
      .settings-body {
        padding: 10px;
      }
      
      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 13px;
      }
      
      .setting-item:last-child {
        margin-bottom: 0;
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
        background-color: #ccc;
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
        border-top: 1px solid #eee;
        margin-top: 10px;
        padding-top: 10px;
        font-size: 12px;
        color: #777;
      }
      
      .version-info p {
        margin: 5px 0;
      }
      
      .version-number {
        font-weight: 600;
        color: #333;
      }
      
      .check-updates-btn {
        background-color: #f1f1f1;
        border: 1px solid #ddd;
        border-radius: 3px;
        padding: 4px 8px;
        margin-top: 5px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
        text-align: center;
      }
      
      .check-updates-btn:hover {
        background-color: #e1e1e1;
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
        background-color: #f9f9f9;
        text-align: center;
        transition: all 0.3s ease;
      }
      
      #last-update-check {
        font-size: 11px;
        margin: 5px 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
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
        color: #999;
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
  
  // Add auto-copy setting
  settingsBody.appendChild(createSettingItem(
    "Auto-copy phone number on page load",
    "crmplus_autoCopyPhone",
    (enabled) => {
      showToast(`Auto-copy phone: ${enabled ? "Enabled" : "Disabled"}`);
    }
  ));
  
  // Add automation options setting
  settingsBody.appendChild(createSettingItem(
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
    }
  ));
  
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
      statusElement.style.color = "#666";
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
            statusElement.style.color = "#666"; // Default color
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
        statusElement.style.colorstatusElement.style.color = "#F44336"; // Red color
        
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
 * @returns {HTMLElement} The setting item element
 */
function createSettingItem(label, storageKey, changeCallback) {
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
  
  // Get the saved setting value (default to false/off)
  // Use only localStorage, avoid browser.storage API
  const isEnabled = localStorage.getItem(storageKey) === "true";
  toggleInput.checked = isEnabled;
  
  // When toggle changes, save setting and invoke callback
  toggleInput.addEventListener("change", () => {
    const newState = toggleInput.checked;
    // Save only to localStorage
    localStorage.setItem(storageKey, newState);
    
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