// Detect browser environment
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener("DOMContentLoaded", () => {
  // Set up browser detection
  const versionInfo = document.querySelector('.info');
  if (versionInfo) {
    const browserName = detectBrowser();
    versionInfo.textContent = `CRM+ Extension v1.0b (${browserName})`;
  }
  
  // Set up header visibility toggle
  const headerVisibilityToggle = document.getElementById("headerVisibilityToggle");
  
  // Initialize the toggle based on current visibility state
  if (headerVisibilityToggle) {
    // Get current visibility state from active tab
    getCurrentHeaderVisibility((isVisible) => {
      console.log("Current header visibility:", isVisible);
      headerVisibilityToggle.checked = isVisible;
    });
    
    // Add event listener for toggle changes
    headerVisibilityToggle.addEventListener("change", () => {
      const isVisible = headerVisibilityToggle.checked;
      console.log("Toggle changed to:", isVisible);
      
      // Apply change to active tab
      applyHeaderVisibility(isVisible);
    });
  } else {
    console.error("Header visibility toggle not found in popup");
  }
});

/**
 * Get current header visibility state from active tab
 * @param {Function} callback - Callback with visibility state
 */
function getCurrentHeaderVisibility(callback) {
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.error("No active tab found.");
      callback(true); // Default to visible
      return;
    }
    
    browserAPI.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        // Get visibility state from localStorage
        const isVisible = localStorage.getItem("crmplus_headerBarVisible") !== "false";
        
        // Also check if header exists and its current state
        const header = document.getElementById("mcp-crm-header");
        if (header) {
          // Return actual display state if header exists
          return header.style.display !== "none";
        }
        
        // Fallback to localStorage value
        return isVisible;
      }
    }).then(results => {
      if (results && results[0] && typeof results[0].result === 'boolean') {
        callback(results[0].result);
      } else {
        callback(true); // Default to visible
      }
    }).catch(() => {
      callback(true); // Default to visible on error
    });
  });
}

/**
 * Apply header visibility setting to the active tab
 * @param {boolean} isVisible - Whether header should be visible
 */
function applyHeaderVisibility(isVisible) {
  console.log("Applying header visibility:", isVisible);
  
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.error("No active tab found.");
      return;
    }
    
    // Use direct scripting to toggle visibility
    browserAPI.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: (visible) => {
        // Set the value in localStorage
        localStorage.setItem("crmplus_headerBarVisible", visible.toString());
        
        // Find the header bar
        const header = document.getElementById("mcp-crm-header");
        if (header) {
          // Update visibility
          header.style.display = visible ? "flex" : "none";
          document.body.style.paddingTop = visible ? "32px" : "0";
          return true;
        }
        return false;
      },
      args: [isVisible]
    }).catch(err => {
      console.error("Error executing script:", err);
      
      // If scripting fails, try messaging as a fallback
      browserAPI.tabs.sendMessage(
        tabs[0].id,
        { action: 'toggleHeaderVisibility', isVisible: isVisible }
      );
    });
  });
}

/**
 * Detect which browser the extension is running in
 * @returns {string} Browser name
 */
function detectBrowser() {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes("Firefox")) {
    return "Firefox";
  } else if (userAgent.includes("Edg")) {
    return "Edge";
  } else {
    return "Chrome";
  }
}