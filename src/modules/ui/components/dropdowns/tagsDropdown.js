// modules/ui/components/dropdowns/tagsDropdown.js

import { createDropdown } from '../dropdownsGroup.js';
import { showToast } from '../../../phoneUtils.js';

/**
 * Creates the Tags dropdown with both direct tag options and nested Vial dropdowns
 * 
 * @returns {HTMLElement} The Tags dropdown element
 */
export function createTagsDropdown() {
  // Create the main dropdown container
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";
  dropdown.id = "crm-tags-dropdown"; // Add ID for future reference
  
  // Create the main dropdown button
  const dropdownBtn = document.createElement("button");
  dropdownBtn.className = "dropdown-btn";
  dropdownBtn.textContent = "Tags";
  
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
  
  // Create the dropdown content container
  const dropdownContent = document.createElement("div");
  dropdownContent.className = "dropdown-content";
  dropdownContent.style.padding = "10px"; // Increased padding
  
  // Add Custom styling for nested dropdowns and button-style options
  if (!document.getElementById('tags-dropdown-styles')) {
    const style = document.createElement('style');
    style.id = 'tags-dropdown-styles';
    style.textContent = `
      .nested-dropdown {
        margin-bottom: 8px;
        width: 100%;
        position: relative;
      }
      .nested-dropdown-btn {
        width: 100%;
        text-align: left;
        padding: 8px 12px;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        color: #e6e6e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .nested-dropdown-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      .nested-dropdown-btn:after {
        content: "▼";
        font-size: 8px;
        color: #e6e6e6;
      }
      .nested-dropdown-content {
        display: none;
        padding: 5px 0 5px 10px;
        margin-top: 3px !important;
      }
      .nested-dropdown.open .nested-dropdown-content {
        display: block;
      }
      
      /* Button-style tag options */
      .tag-btn {
        display: block;
        width: 100%;
        padding: 8px 12px;
        margin-bottom: 8px;
        background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 4px;
        text-align: left;
        font-size: 13px;
        color: #e6e6e6;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: normal;
      }
      .tag-btn:hover {
        background-color: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .tag-btn:active {
        background-color: rgba(255, 255, 255, 0.2);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add direct tag options to the main dropdown as buttons
  // Create Refill-Sema-Inj button
  const semaRefillTag = document.createElement("button");
  semaRefillTag.className = "tag-btn";
  semaRefillTag.textContent = "Refill-Sema-Inj";
  semaRefillTag.addEventListener("click", () => {
    selectTagOption("refill-sema-inj");
    dropdown.classList.remove("show"); // Close dropdown after selection
  });
  dropdownContent.appendChild(semaRefillTag);
  
  // Create Refill-Tirz-Inj button
  const tirzRefillTag = document.createElement("button");
  tirzRefillTag.className = "tag-btn";
  tirzRefillTag.textContent = "Refill-Tirz-Inj";
  tirzRefillTag.addEventListener("click", () => {
    selectTagOption("refill-tirz-inj");
    dropdown.classList.remove("show"); // Close dropdown after selection
  });
  dropdownContent.appendChild(tirzRefillTag);
  
  // ============ VIAL-SEMA DROPDOWN ITEMS ============
  // Create Vial-Sema nested dropdown
  const vialSemaNestedDropdown = document.createElement("div");
  vialSemaNestedDropdown.className = "nested-dropdown";

  const vialSemaNestedBtn = document.createElement("button");
  vialSemaNestedBtn.className = "nested-dropdown-btn";
  vialSemaNestedBtn.textContent = "Vial-Sema";

  const vialSemaNestedContent = document.createElement("div");
  vialSemaNestedContent.className = "nested-dropdown-content";

  // Toggle nested dropdown when button is clicked
  vialSemaNestedBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    vialSemaNestedDropdown.classList.toggle("open");
  });

  // Vial-Sema Option 1: Vial-Sema-B12
  const vialSemaB12Item = document.createElement("button");
  vialSemaB12Item.className = "tag-btn";
  vialSemaB12Item.textContent = "Vial-Sema-B12";
  vialSemaB12Item.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    closeAllDropdowns();
    setTimeout(() => {
      selectTagOption("vial-sema-b12");
    }, 300);
  });
  vialSemaNestedContent.appendChild(vialSemaB12Item);

  // Vial-Sema Option 2: Vial-Sema-B6
  const vialSemaB6Item = document.createElement("button");
  vialSemaB6Item.className = "tag-btn";
  vialSemaB6Item.textContent = "Vial-Sema-B6";
  vialSemaB6Item.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      selectTagOption("vial-sema-b6");
    }, 300);
  });
  vialSemaNestedContent.appendChild(vialSemaB6Item);

  // Vial-Sema Option 3: Vial-Sema-Lipo
  const vialSemaLipoItem = document.createElement("button");
  vialSemaLipoItem.className = "tag-btn";
  vialSemaLipoItem.textContent = "Vial-Sema-Lipo";
  vialSemaLipoItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      selectTagOption("vial-sema-lipo");
    }, 300);
  });
  vialSemaNestedContent.appendChild(vialSemaLipoItem);

  // Vial-Sema Option 4: Vial-Sema-NAD+
  const vialSemaNADItem = document.createElement("button");
  vialSemaNADItem.className = "tag-btn";
  vialSemaNADItem.textContent = "Vial-Sema-NAD+";
  vialSemaNADItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      selectTagOption("vial-sema-nad+");
    }, 300);
  });
  vialSemaNestedContent.appendChild(vialSemaNADItem);

  // Assemble Vial-Sema nested dropdown
  vialSemaNestedDropdown.appendChild(vialSemaNestedBtn);
  vialSemaNestedDropdown.appendChild(vialSemaNestedContent);

  // Add to main dropdown
  dropdownContent.appendChild(vialSemaNestedDropdown);

  // ============ VIAL-TIRZ DROPDOWN ITEMS ============
  // Create Vial-Tirz nested dropdown
  const vialTirzNestedDropdown = document.createElement("div");
  vialTirzNestedDropdown.className = "nested-dropdown";

  const vialTirzNestedBtn = document.createElement("button");
  vialTirzNestedBtn.className = "nested-dropdown-btn";
  vialTirzNestedBtn.textContent = "Vial-Tirz";

  const vialTirzNestedContent = document.createElement("div");
  vialTirzNestedContent.className = "nested-dropdown-content";

  // Toggle nested dropdown when button is clicked
  vialTirzNestedBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    vialTirzNestedDropdown.classList.toggle("open");
  });

  // Vial-Tirz Option 1: Vial-Tirz-Cyano
  const vialTirzCyanoItem = document.createElement("button");
  vialTirzCyanoItem.className = "tag-btn";
  vialTirzCyanoItem.textContent = "Vial-Tirz-Cyano";
  vialTirzCyanoItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      selectTagOption("vial-tirz-cyano");
    }, 300);
  });
  vialTirzNestedContent.appendChild(vialTirzCyanoItem);

  // Vial-Tirz Option 2: Vial-Tirz-NAD+
  const vialTirzNADItem = document.createElement("button");
  vialTirzNADItem.className = "tag-btn";
  vialTirzNADItem.textContent = "Vial-Tirz-NAD+";
  vialTirzNADItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      selectTagOption("vial-tirz-nad+");
    }, 300);
  });
  vialTirzNestedContent.appendChild(vialTirzNADItem);

  // Vial-Tirz Option 3: Vial-Tirz-Pyr
  const vialTirzPyrItem = document.createElement("button");
  vialTirzPyrItem.className = "tag-btn";
  vialTirzPyrItem.textContent = "Vial-Tirz-Pyr";
  vialTirzPyrItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      selectTagOption("vial-tirz-pyridoxine");
    }, 300);
  });
  vialTirzNestedContent.appendChild(vialTirzPyrItem);

  // Assemble Vial-Tirz nested dropdown
  vialTirzNestedDropdown.appendChild(vialTirzNestedBtn);
  vialTirzNestedDropdown.appendChild(vialTirzNestedContent);

  // Add to main dropdown
  dropdownContent.appendChild(vialTirzNestedDropdown);
  
  // Assemble the main dropdown
  dropdown.appendChild(dropdownBtn);
  dropdown.appendChild(dropdownContent);
  
  return dropdown;
}

/**
 * Helper to close all open dropdowns and nested dropdowns
 */
function closeAllDropdowns() {
  document.querySelectorAll('.dropdown.show').forEach(d => d.classList.remove('show'));
  document.querySelectorAll('.nested-dropdown.open').forEach(d => d.classList.remove('open'));
}

/**
 * Selects a tag option from the dropdown
 * 
 * @param {string} tagText - The text of the tag to select
 */
function selectTagOption(tagText) {
  // Find the Tags input field with expanded selectors
  let tagInput = findTagInput();
  
  if (tagInput) {
    // Focus on the input field to open the dropdown
    tagInput.focus();
    
    // Try to find the tag in the list of options
    // Wait a moment for the dropdown to appear
    setTimeout(() => {
      // Type the text to filter the dropdown
      tagInput.value = tagText;
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Wait for the filtered dropdown to update
      setTimeout(() => {
        // Look for the option in the dropdown that contains our text
        const options = document.querySelectorAll('.v-list-item, .dropdown-item, .select-option, li');
        let found = false;
        
        for (const option of options) {
          if (option.textContent.toLowerCase().includes(tagText)) {
            // Click the option to select it
            option.click();
            found = true;
            showToast(`Selected tag: ${tagText}`);
            break;
          }
        }
        
        // If we can't find the exact option, try alternative approaches
        if (!found) {
          // Try looking for a more generic class that might contain dropdown options
          const allElements = document.querySelectorAll('*');
          for (const elem of allElements) {
            if (elem.textContent.trim().toLowerCase() === tagText) {
              // If we find text content that matches exactly, try clicking it
              elem.click();
              found = true;
              showToast(`Selected tag: ${tagText}`);
              break;
            }
          }
          
          // If still not found, try keyboard navigation - press Enter key
          if (!found) {
            // Press Enter key to attempt to select the filtered option
            tagInput.dispatchEvent(new KeyboardEvent('keydown', { 
              key: 'Enter', 
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true 
            }));
          }
        }
      }, 300); // Wait for dropdown to filter
    }, 300); // Wait for dropdown to appear
  } else {
    showToast("Tags field not found");
  }
}

/**
 * Enhanced function to find the tag input field with multiple strategies
 * @returns {HTMLElement|null} The found tag input element or null
 */
function findTagInput() {
  // Try several strategies to find the tag input field
  
  // Strategy 1: Original selector - looking for "Add Tags" placeholder
  let tagInput = document.querySelector('input[placeholder="Add Tags"]');
  if (tagInput) return tagInput;
  
  // Strategy 2: Broader placeholder pattern - any input with "tag" in placeholder
  const tagInputs = Array.from(document.querySelectorAll('input[placeholder]')).filter(input => {
    return input.placeholder.toLowerCase().includes('tag');
  });
  if (tagInputs.length > 0) return tagInputs[0];
  
  // Strategy 3: Input within element with tag-related class
  const tagContainers = document.querySelectorAll('.tag-input, .tags-input, .tag-container');
  for (const container of tagContainers) {
    const input = container.querySelector('input');
    if (input) return input;
  }
  
  // Strategy 4: Looking for smartList.bulkTags placeholder (from your example)
  tagInput = document.querySelector('input[placeholder="smartList.bulkTags.addTags"]');
  if (tagInput) return tagInput;
  
  // Strategy 5: Generic attribute search - looking for any input that might be for tags
  const possibleTagInputs = document.querySelectorAll('.hl-text-input');
  if (possibleTagInputs.length > 0) {
    return possibleTagInputs[0]; // Return the first one as best guess
  }
  
  // If no tag input found with any strategy
  console.error('[CRM Extension] Could not find tag input field with any strategy');
  
  // One last attempt - log all inputs to help diagnose
  const allInputs = document.querySelectorAll('input');
  console.log('[CRM Extension] All inputs on page:', allInputs);
  
  return null;
}