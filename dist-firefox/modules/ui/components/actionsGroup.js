// modules/ui/components/actionsGroup.js

import { showToast } from '../../phoneUtils.js';

/**
 * Creates the actions group with automation buttons
 * 
 * @returns {HTMLElement} The actions group element
 */
export function createActionsGroup() {
  const actionsGroup = document.createElement("div");
  actionsGroup.className = "group";
  actionsGroup.id = "crm-actions-group";
  
  // We're moving the AutomationTest button to the Automation dropdown
  // Keeping this file empty but maintained for structure
  
  return actionsGroup;
}

/**
 * Creates a button for the actions group
 * 
 * @param {string} text - Button text
 * @param {string} icon - Button icon (emoji)
 * @param {Function} clickHandler - Function to call when button is clicked
 * @returns {HTMLElement} The button element
 */
function createActionButton(text, icon, clickHandler) {
  const button = document.createElement("button");
  button.className = "btn";
  
  // Add icon
  const iconElement = document.createElement("span");
  iconElement.className = "btn-icon";
  iconElement.innerHTML = icon;
  button.appendChild(iconElement);
  
  // Add button text
  const textElement = document.createElement("span");
  textElement.textContent = text;
  button.appendChild(textElement);
  
  // Add click handler
  if (clickHandler && typeof clickHandler === 'function') {
    button.addEventListener("click", clickHandler);
  }
  
  return button;
}

// Keep the function here (with increased timing) as it will be exported
// and used by the automationDropdown.js
/**
 * Complete workflow automation - finds the Add button, clicks it, searches for the workflow,
 * selects the matching option from the dropdown, and clicks the Add button in the modal
 */
export function completeAutomationWorkflow() {
  try {
    console.log("[CRM Extension] Starting automation workflow test");
    
    // Step 1: Find and click the Add button
    const addButton = Array.from(document.querySelectorAll('button.btn.btn-light2.btn-xs'))
      .find(btn => btn.textContent.trim().includes("Add"));
    
    if (!addButton) {
      console.error("[CRM Extension] Add Automation button not found");
      showToast("Add Automation button not found");
      return;
    }
    
    console.log("[CRM Extension] Found Add button, clicking it");
    addButton.click();
    showToast("Opening workflow dialog...");
    
    // Step 2: Wait for the popup and find the input field (increased by 0.3 seconds)
    setTimeout(() => {
      console.log("[CRM Extension] Looking for workflow input field");
      
      // Focus on workflow input field specifically
      const workflowInput = document.querySelector('input[placeholder="Type to search"]');
      
      if (!workflowInput) {
        console.error("[CRM Extension] Workflow input field not found");
        showToast("Workflow input field not found");
        return;
      }
      
      console.log("[CRM Extension] Found workflow input field");
      
      // Step 3: Enter a shorter search term to trigger dropdown options
      const searchTerm = "Refill - Semaglutide";
      
      // Focus the input first
      workflowInput.focus();
      
      // Set the search value
      workflowInput.value = searchTerm;
      
      // Dispatch input event to trigger autocomplete/dropdown
      workflowInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      showToast("Searching for workflow...");
      
      // Step 4: Wait for dropdown options to appear (increased by 0.3 seconds)
      setTimeout(() => {
        console.log("[CRM Extension] Looking for Step 2 option");
        
        // Look for dropdown options with various selectors
        const optionSelectors = [
          '.v-list-item',
          '.dropdown-item',
          '.select-option',
          '.vs__dropdown-option',
          'li.option',
          '.autocomplete-result',
          '.v-select-option'
        ];
        
        let found = false;
        
        // Log all dropdown options found to see what's available
        optionSelectors.forEach(selector => {
          const options = document.querySelectorAll(selector);
          if (options.length > 0) {
            console.log(`[CRM Extension] Found ${options.length} options with selector: ${selector}`);
            options.forEach((opt, idx) => {
              console.log(`Option ${idx}: "${opt.textContent.trim()}"`);
            });
          }
        });
        
        // Try each selector looking SPECIFICALLY for "Step 2"
        for (const selector of optionSelectors) {
          const options = document.querySelectorAll(selector);
          
          // Look through all options to find one with "Step 2"
          for (const option of options) {
            const optionText = option.textContent.trim();
            
            if (optionText.includes("Step 2") && optionText.includes("Semaglutide")) {
              console.log("[CRM Extension] Found Step 2 option:", optionText);
              
              // Click the option
              option.click();
              found = true;
              showToast("Selected Step 2 workflow");
              break;
            }
          }
          
          if (found) break;
        }
        
        // If still not found, try using arrow keys to navigate and select
        if (!found) {
          console.log("[CRM Extension] No Step 2 option found by clicking, trying keyboard navigation");
          
          // Check visible options - maybe it's there but we need to see all options
          const allVisibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   el.textContent.includes("Step 2") &&
                   el.textContent.includes("Semaglutide");
          });
          
          console.log(`[CRM Extension] Found ${allVisibleElements.length} visible elements with "Step 2" text`);
          
          if (allVisibleElements.length > 0) {
            // Try to click the first visible element with Step 2
            allVisibleElements[0].click();
            console.log("[CRM Extension] Clicked visible element with Step 2");
            found = true;
          } else {
            // Try keyboard navigation - down arrow multiple times to find Step 2
            workflowInput.focus();
            
            // Press down arrow multiple times to navigate through options
            for (let i = 0; i < 10; i++) {
              setTimeout(() => {
                // Press down arrow to move through options
                workflowInput.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'ArrowDown', 
                  code: 'ArrowDown',
                  keyCode: 40,
                  which: 40,
                  bubbles: true
                }));
                
                // After each arrow press, check if any highlighted option has "Step 2"
                setTimeout(() => {
                  const highlightedOption = document.querySelector('.active, .highlighted, .selected, .v-list-item--active');
                  if (highlightedOption && highlightedOption.textContent.includes("Step 2")) {
                    console.log("[CRM Extension] Found Step 2 option through keyboard navigation");
                    
                    // Press Enter to select it
                    workflowInput.dispatchEvent(new KeyboardEvent('keydown', {
                      key: 'Enter', 
                      code: 'Enter',
                      keyCode: 13,
                      which: 13,
                      bubbles: true
                    }));
                    
                    found = true;
                  }
                }, 100);
              }, i * 200); // Space out the arrow presses
            }
          }
        }
        
        // Step 5: Wait for selection to complete (increased by 0.3 seconds), then find and click the "Add" button
        setTimeout(() => {
          console.log("[CRM Extension] Looking for Add button in modal");
          
          // Find the Add button in the dialog/modal - using multiple possible strategies
          
          // Method 1: Find all buttons with "Add" text in the current/most recent dialog
          const modalAddButton = Array.from(document.querySelectorAll('.modal button, .dialog button, [role="dialog"] button'))
            .find(btn => btn.textContent.trim() === "Add");
          
          if (modalAddButton) {
            console.log("[CRM Extension] Found modal Add button by text:", modalAddButton);
            modalAddButton.click();
            showToast("Clicked Add button in modal");
            return;
          }
          
          // Method 2: Try to find button with specific class in a modal/dialog footer
          const modalFooterButtons = document.querySelectorAll('.modal-footer button, .dialog-footer button, .v-dialog__footer button');
          console.log(`[CRM Extension] Found ${modalFooterButtons.length} buttons in modal footer`);
          
          for (const btn of modalFooterButtons) {
            console.log(`[CRM Extension] Modal footer button: ${btn.textContent.trim()} - Classes: ${btn.className}`);
            if (btn.textContent.trim() === "Add") {
              btn.click();
              showToast("Clicked Add button in modal footer");
              return;
            }
          }
          
          // Method 3: Try to find a green/primary button that is likely the confirm button
          const confirmButtons = document.querySelectorAll('button.btn-success, button.btn-primary, button.primary, button.confirm-btn');
          console.log(`[CRM Extension] Found ${confirmButtons.length} potential confirm buttons`);
          
          for (const btn of confirmButtons) {
            console.log(`[CRM Extension] Confirm button: ${btn.textContent.trim()} - Classes: ${btn.className}`);
            if (btn.textContent.trim() === "Add") {
              btn.click();
              showToast("Clicked green Add button");
              return;
            }
          }
          
          // Method 4: Last resort - direct CSS selector shown in the screenshot
          const addBtn = document.querySelector('button.btn-success, .add-button, button.add, .v-btn--success');
          if (addBtn) {
            console.log("[CRM Extension] Found Add button by class:", addBtn);
            addBtn.click();
            showToast("Clicked Add button by class");
            return;
          }
          
          // Log failure and all buttons for debugging
          console.error("[CRM Extension] Could not find Add button in modal");
          showToast("Could not find Add button in modal");
          
        }, 2300); // Increased from 2000ms to 2300ms
        
      }, 2300); // Increased from 2000ms to 2300ms
      
    }, 1800); // Increased from 1500ms to 1800ms
    
  } catch (error) {
    console.error("[CRM Extension] Error in automation workflow:", error);
    showToast("Error in automation workflow: " + error.message);
  }
}