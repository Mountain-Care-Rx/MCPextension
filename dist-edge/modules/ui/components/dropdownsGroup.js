// modules/ui/components/dropdownsGroup.js

// import { createTagsDropdown } from './dropdowns/tagsDropdown.js';
// import { createAutomationDropdown } from './dropdowns/automationDropdown.js';
import { createAPIDropdown } from './dropdowns/apiDropdown.js';
import { createFrequentTagsDropdown } from './dropdowns/tagsDropdown.js';

/**
 * Creates the dropdowns group containing all dropdown menus
 *
 * @returns {HTMLElement} The dropdowns group element
 */
export function createDropdownsGroup() {
  const dropdownsGroup = document.createElement("div");
  dropdownsGroup.className = "group";
  dropdownsGroup.id = "crm-dropdowns-group";
  dropdownsGroup.style.display = "flex";
  dropdownsGroup.style.flexDirection = "row";
  dropdownsGroup.style.justifyContent = "space-between";
  dropdownsGroup.style.alignItems = "center";
  dropdownsGroup.style.width = "100%";

  // Left: API dropdown
  const leftGroup = document.createElement("div");
  leftGroup.style.display = "flex";
  leftGroup.style.flexDirection = "row";
  leftGroup.style.alignItems = "center";
  leftGroup.appendChild(createAPIDropdown());

  // Right: Frequent tags dropdown
  const rightGroup = document.createElement("div");
  rightGroup.style.display = "flex";
  rightGroup.style.flexDirection = "row";
  rightGroup.style.alignItems = "center";
  rightGroup.style.marginLeft = "auto";
  rightGroup.appendChild(createFrequentTagsDropdown());

  dropdownsGroup.appendChild(leftGroup);
  dropdownsGroup.appendChild(rightGroup);

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
      margin-right: 8px !important; /* Ensure space between dropdowns, reduced for tighter layout */
    }

    .dropdown:last-child {
      margin-right: 0 !important; /* Remove margin from the last dropdown */
    }

    .dropdown-content {
      position: absolute !important;
      background-color: #2F3A4B; /* Match toolbar background color */
      min-width: 220px !important; /* Increased width */
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
      z-index: 999;
      border-radius: 4px;
      margin-top: 5px !important; /* Add space between button and dropdown */
      left: 0;
      top: 100% !important; /* Position below the button */
      display: none;
      border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
    }

    /* Ensure right-aligned dropdowns don't overflow */
    #crm-tags-dropdown .dropdown-content {
      right: 0;
      left: auto; /* Override left positioning for Tags dropdown */
    }

    .dropdown.show .dropdown-content {
      display: block;
    }

    /* Improved nested dropdown positioning */
    .nested-dropdown-content {
      margin-top: 3px !important;
      background-color: #2F3A4B; /* Match toolbar background color */
      border-radius: 4px;
      padding: 5px !important;
    }

    /* Style dropdown items */
    .dropdown-item {
      color: #e6e6e6; /* White text for visibility */
      padding: 10px 14px !important; /* Increased padding */
      text-decoration: none;
      display: block;
      font-size: 14px;
      cursor: pointer;
      border-radius: 3px;
      font-weight: normal;
    }

    .dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    /* Fix for Vial-Sema and Vial-Tirz nested dropdowns */
    .nested-dropdown-btn {
      text-align: left !important;
      padding: 8px 12px !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      color: #e6e6e6 !important;
      font-weight: bold !important;
    }

    .nested-dropdown-btn:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
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
