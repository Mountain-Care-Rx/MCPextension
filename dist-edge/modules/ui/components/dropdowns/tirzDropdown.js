// modules/ui/components/dropdowns/tirzDropdown.js

import { createDropdown } from '../dropdownsGroup.js';
import { showToast } from '../../../phoneUtils.js';

/**
 * Creates the Tirz dropdown with predefined automation actions
 * 
 * @returns {HTMLElement} The Tirz dropdown element
 */
export function createTirzDropdown() {
  // Add items with specific workflow automation actions
  const items = [
    {
      text: "Tirz/B12 Refill - Step 2",
      callback: () => {
        addTirzB12Step2Workflow();
      }
    }
    // More automation items can be added here in the future
  ];
  
  const dropdown = createDropdown("Tirz", items);
  dropdown.id = "crm-tirz-dropdown"; // Add ID for automation control
  return dropdown;
}

/**
 * Adds the Tirz/B12 Step 2 workflow by clicking the Add button and entering the workflow name
 */
function addTirzB12Step2Workflow() {
  try {
    // Find the Add Automation button on the page
    const addButtons = Array.from(document.querySelectorAll('button.btn.btn-light2.btn-xs'));
    const addButton = addButtons.find(btn => {
      return btn.textContent.trim().includes("Add") && 
             btn.querySelector('i.fas.fa-plus');
    });
    
    if (!addButton) {
      showToast("Add Automation button not found");
      return;
    }
    
    // Click the Add button
    addButton.click();
    showToast("Adding Tirz/B12 workflow...");
    
    // Wait for the popup to appear and find the workflow input field
    setTimeout(() => {
      const workflowInput = document.querySelector('input[placeholder="Type to search"][aria-autocomplete="list"]');
      
      if (!workflowInput) {
        showToast("Workflow input field not found");
        return;
      }
      
      // Set the workflow text
      const workflowText = "Refill - Tirzepatide/B12 Injection Refill Order - (Step 2)";
      workflowInput.value = workflowText;
      
      // Dispatch input event to trigger the search/dropdown
      workflowInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Focus the input to make sure dropdown appears
      workflowInput.focus();
      
      // Wait a moment for the dropdown options to appear, then press Enter
      setTimeout(() => {
        // Press Enter key to select the option
        workflowInput.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', 
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        }));
        
        showToast("Tirz/B12 Step 2 workflow added");
      }, 500);
    }, 500);
    
  } catch (error) {
    console.error("[CRM Extension] Error adding Tirz/B12 workflow:", error);
    showToast("Error adding workflow");
  }
}