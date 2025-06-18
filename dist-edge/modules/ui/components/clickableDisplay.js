// modules/ui/components/clickableDisplay.js

import { copyToClipboard, showToast } from '../../phoneUtils.js';

/**
 * Creates a clickable display group for patient information
 * 
 * @param {string} id - ID for the display element
 * @param {string} label - Label text
 * @param {Object} options - Configuration options
 * @param {string} options.icon - Optional icon for the display
 * @param {string} options.initialValue - Initial value to display (defaults to empty string)
 * @param {Function} options.onClick - Custom click handler (defaults to copy-to-clipboard)
 * @returns {HTMLElement} The created display group element
 */
export function createClickableDisplay(id, label, options = {}) {
  // Create display group
  const displayGroup = document.createElement("div");
  displayGroup.className = "group";
  
  // Create label
  const displayLabel = document.createElement("span");
  displayLabel.className = "label";
  displayLabel.textContent = `${label}:`;
  displayGroup.appendChild(displayLabel);
  
  // Create clickable display element
  const displayElement = document.createElement("span");
  displayElement.id = `${id}-display`;
  displayElement.className = "clickable-value";
  
  // Setup data attribute for storing copyable value
  if (options.initialValue) {
    displayElement.setAttribute(`data-value`, options.initialValue);
  }
  
  // Add icon if provided
  if (options.icon) {
    const iconElement = document.createElement("span");
    iconElement.className = "btn-icon";
    iconElement.innerHTML = options.icon;
    displayElement.appendChild(iconElement);
  }
  
  // Add value text
  const textElement = document.createElement("span");
  // Use empty string as default (to match screenshot appearance)
  textElement.textContent = options.initialValue || "";
  textElement.id = `${id}-text`;
  displayElement.appendChild(textElement);
  
  // Default click handler copies the content to clipboard
  const defaultHandler = async () => {
    // Get the value from the data attribute if available, otherwise from text
    const valueToDisplay = displayElement.getAttribute('data-value') || textElement.textContent.trim();
    
    if (valueToDisplay && valueToDisplay !== "") {
      const success = await copyToClipboard(valueToDisplay);
      if (success) {
        showToast(`Copied ${label}: ${valueToDisplay}`);
      } else {
        showToast(`Failed to copy ${label.toLowerCase()}`);
      }
    } else {
      showToast(`No ${label.toLowerCase()} available to copy`);
    }
  };
  
  // Use custom click handler if provided, otherwise use default
  displayElement.addEventListener("click", () => {
    if (options.onClick) {
      options.onClick(displayElement);
    } else {
      defaultHandler();
    }
  });
  
  // Add title/tooltip
  displayElement.title = `Click to copy ${label.toLowerCase()} to clipboard`;
  
  displayGroup.appendChild(displayElement);
  return displayGroup;
}

/**
 * Updates the value of a clickable display element
 * Helper function to be used by other modules
 * 
 * @param {string} id - ID of the display element (without the -display suffix)
 * @param {string} value - Value to set
 * @returns {boolean} - Whether the update was successful
 */
export function updateClickableDisplayValue(id, value) {
  try {
    const displayElement = document.getElementById(`${id}-display`);
    if (!displayElement) return false;
    
    // Update data attribute for copy operations
    if (value) {
      displayElement.setAttribute('data-value', value);
    } else {
      displayElement.removeAttribute('data-value');
    }
    
    // Update displayed text
    const textElement = document.getElementById(`${id}-text`);
    if (textElement) {
      // Show empty string when no value (to match screenshot appearance)
      textElement.textContent = value || "";
    }
    
    return true;
  } catch (error) {
    console.error(`[CRM Extension] Error updating ${id} display:`, error);
    return false;
  }
}