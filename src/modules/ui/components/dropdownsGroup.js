// modules/ui/components/dropdownsGroup.js

import { createTagsDropdown } from './dropdowns/tagsDropdown.js';
import { createAutomationDropdown } from './dropdowns/automationDropdown.js';

/**
 * Creates the dropdowns group containing all dropdown menus
 * 
 * @returns {HTMLElement} The dropdowns group element
 */
export function createDropdownsGroup() {
  const dropdownsGroup = document.createElement("div");
  dropdownsGroup.className = "group";
  dropdownsGroup.id = "crm-dropdowns-group";
  
  // Add all dropdowns to the group
  // We now have just two main dropdowns:
  // - Automation dropdown (with nested Sema and Tirz)
  // - Tags dropdown (with nested tag options)
  dropdownsGroup.appendChild(createAutomationDropdown());
  dropdownsGroup.appendChild(createTagsDropdown());
  
  // Set up global click handler to close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    // Close main dropdowns when clicking outside
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
        
        // Also close any nested dropdowns that might be open
        const nestedDropdowns = dropdown.querySelectorAll('.nested-dropdown');
        nestedDropdowns.forEach(nested => {
          nested.classList.remove('open');
        });
      }
    });
  });
  
  // Add custom dropdown CSS to fix positioning
  addCustomDropdownCSS();
  
  return dropdownsGroup;
}

/**
 * Adds custom CSS to fix dropdown positioning issues
 */
function addCustomDropdownCSS() {
  // Only add the styles once
  if (document.getElementById('custom-dropdown-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'custom-dropdown-styles';
  style.textContent = `
    /* Improved dropdown positioning */
    .dropdown {
      position: relative !important;
    }
    
    .dropdown-content {
      position: absolute !important;
      background-color: #f9f9f9;
      min-width: 220px !important; /* Increased width */
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
      z-index: 999;
      border-radius: 4px;
      margin-top: 5px !important; /* Add space between button and dropdown */
      left: 0;
      top: 100% !important; /* Position below the button */
      display: none;
    }
    
    .dropdown.show .dropdown-content {
      display: block;
    }
    
    /* Improved nested dropdown positioning */
    .nested-dropdown-content {
      margin-top: 3px !important;
    }
    
    /* Style dropdown items */
    .dropdown-item {
      color: #333;
      padding: 10px 14px !important; /* Increased padding */
      text-decoration: none;
      display: block;
      font-size: 14px;
      cursor: pointer;
      border-radius: 3px;
    }
    
    .dropdown-item:hover {
      background-color: #f1f1f1;
    }
    
    /* Fix for Vial-Sema and Vial-Tirz nested dropdowns */
    .nested-dropdown-btn {
      text-align: left !important;
      padding: 8px 12px !important;
    }
    
    /* Force visibility for Tags dropdown */
    #crm-tags-dropdown {
      display: flex !important;
    }
    
    #crm-tags-dropdown .dropdown-content {
      min-width: 220px !important;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Base function for creating a dropdown
 * This is exported to be used by individual dropdown components
 * 
 * @param {string} label - Dropdown button label
 * @param {Array} items - Array of dropdown items
 * @returns {HTMLElement} The dropdown element
 */
export function createDropdown(label, items = []) {
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";
  
  // Create dropdown button
  const dropdownBtn = document.createElement("button");
  dropdownBtn.className = "dropdown-btn";
  dropdownBtn.textContent = label;
  
  // Toggle dropdown menu when button is clicked
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Close any other open dropdowns
    document.querySelectorAll('.dropdown.show').forEach(d => {
      if (d !== dropdown) {
        d.classList.remove('show');
      }
    });
    
    dropdown.classList.toggle("show");
  });
  
  // Create dropdown content container
  const dropdownContent = document.createElement("div");
  dropdownContent.className = "dropdown-content";
  
  // Add dropdown items if provided
  if (items && items.length > 0) {
    items.forEach(item => {
      const dropdownItem = document.createElement("a");
      dropdownItem.className = "dropdown-item";
      dropdownItem.textContent = item.text;
      
      if (item.callback && typeof item.callback === 'function') {
        dropdownItem.addEventListener("click", () => {
          item.callback();
          dropdown.classList.remove("show"); // Close dropdown after selection
        });
      }
      
      dropdownContent.appendChild(dropdownItem);
    });
  } else {
    // Add a placeholder item
    const placeholderItem = document.createElement("a");
    placeholderItem.className = "dropdown-item";
    placeholderItem.textContent = "No actions available";
    placeholderItem.style.color = "#999";
    placeholderItem.style.fontStyle = "italic";
    dropdownContent.appendChild(placeholderItem);
  }
  
  dropdown.appendChild(dropdownBtn);
  dropdown.appendChild(dropdownContent);
  
  return dropdown;
}