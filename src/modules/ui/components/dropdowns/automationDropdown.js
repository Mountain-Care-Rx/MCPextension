// modules/ui/components/dropdowns/automationDropdown.js

import { createDropdown } from '../dropdownsGroup.js';
import { showToast } from '../../../phoneUtils.js';

/**
 * A mapping from the button label to the *exact* text as it appears
 * in the final selection dropdown (the "Final Selection").
 *
 * NOTE: Make sure these strings match EXACTLY what appears in the automation dialog.
 */
const finalSelectionMap = {
  // ============ SEMA ============
  "Sema/B12 Refill - Step 2": "Refill - Semaglutide/B12 Injection Refill Order - (Step 2)",
  "Sema/B12 Vial - Step 2":   "Semaglutide/B12 Vial Order - (Step 2)",
  "Sema/B6 Vial - Step 2":    "Semaglutide/B6 Vial Order - (Step 2)",
  "Sema/Lipo Vial - Step 2":  "Semaglutide/Lipo Vial Order - (Step 2)",
  "Sema/NAD+ Vial - Step 2":  "Semaglutide/NAD+ Vial Order - (Step 2)",

  // ============ TIRZ ============
  "Tirz/B6 Refill - Step 2":  "Syringe - Tirzepatide/Pyridoxine Injection Order - (Step 2)",
  "Tirz/B12 Vial - Step 2":   "Tirzepatide/Cyano Vial Order - (Step 2)",
  "Tirz/NAD+ Vial - Step 2":  "Tirzepatide/NAD+ Vial Order - (Step 2)",
  "Tirz/B6 Vial - Step 2":    "Tirzepatide/Pyridoxine Vial Order - (Step 2)"
};

/**
 * Creates the Automation dropdown with nested Sema and Tirz options
 *
 * @returns {HTMLElement} The Automation dropdown element
 */
export function createAutomationDropdown() {
  // Create the main dropdown container
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";
  dropdown.id = "crm-automation-dropdown"; // Add ID for automation control

  // Create the main dropdown button
  const dropdownBtn = document.createElement("button");
  dropdownBtn.className = "dropdown-btn";
  dropdownBtn.textContent = "Automation";

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
  dropdownContent.style.padding = "10px"; // Increased padding for better aesthetics

  // Add Custom styling for automation dropdown buttons
  if (!document.getElementById('automation-dropdown-styles')) {
    const style = document.createElement('style');
    style.id = 'automation-dropdown-styles';
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
      
      /* Button-style options */
      .automation-btn {
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
      .automation-btn:hover {
        background-color: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .automation-btn:active {
        background-color: rgba(255, 255, 255, 0.2);
      }
    `;
    document.head.appendChild(style);
  }

  // ============ SEMA DROPDOWN ITEMS ============
  // Create Sema nested dropdown
  const semaNestedDropdown = document.createElement("div");
  semaNestedDropdown.className = "nested-dropdown";

  const semaNestedBtn = document.createElement("button");
  semaNestedBtn.className = "nested-dropdown-btn";
  semaNestedBtn.textContent = "Sema";

  const semaNestedContent = document.createElement("div");
  semaNestedContent.className = "nested-dropdown-content";

  // Toggle nested dropdown when button is clicked
  semaNestedBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    semaNestedDropdown.classList.toggle("open");
  });

  // Sema Option 1: Sema/B12 Refill - Step 2
  const semaB12RefillItem = document.createElement("button");
  semaB12RefillItem.className = "automation-btn";
  semaB12RefillItem.textContent = "Sema/B12 Refill - Step 2";
  semaB12RefillItem.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Sema/B12 Refill - Step 2"]);
    }, 300);
  });
  semaNestedContent.appendChild(semaB12RefillItem);

  // Sema Option 2: Sema/B12 Vial - Step 2
  const semaB12VialItem = document.createElement("button");
  semaB12VialItem.className = "automation-btn";
  semaB12VialItem.textContent = "Sema/B12 Vial - Step 2";
  semaB12VialItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Sema/B12 Vial - Step 2"]);
    }, 300);
  });
  semaNestedContent.appendChild(semaB12VialItem);

  // Sema Option 3: Sema/B6 Vial - Step 2
  const semaB6VialItem = document.createElement("button");
  semaB6VialItem.className = "automation-btn";
  semaB6VialItem.textContent = "Sema/B6 Vial - Step 2";
  semaB6VialItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Sema/B6 Vial - Step 2"]);
    }, 300);
  });
  semaNestedContent.appendChild(semaB6VialItem);

  // Sema Option 4: Sema/Lipo Vial - Step 2
  const semaLipoVialItem = document.createElement("button");
  semaLipoVialItem.className = "automation-btn";
  semaLipoVialItem.textContent = "Sema/Lipo Vial - Step 2";
  semaLipoVialItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Sema/Lipo Vial - Step 2"]);
    }, 300);
  });
  semaNestedContent.appendChild(semaLipoVialItem);

  // Sema Option 5: Sema/NAD+ Vial - Step 2
  const semaNADVialItem = document.createElement("button");
  semaNADVialItem.className = "automation-btn";
  semaNADVialItem.textContent = "Sema/NAD+ Vial - Step 2";
  semaNADVialItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Sema/NAD+ Vial - Step 2"]);
    }, 300);
  });
  semaNestedContent.appendChild(semaNADVialItem);

  // Assemble Sema nested dropdown
  semaNestedDropdown.appendChild(semaNestedBtn);
  semaNestedDropdown.appendChild(semaNestedContent);

  // Add to main dropdown
  dropdownContent.appendChild(semaNestedDropdown);

  // ============ TIRZ DROPDOWN ITEMS ============
  // Create Tirz nested dropdown
  const tirzNestedDropdown = document.createElement("div");
  tirzNestedDropdown.className = "nested-dropdown";

  const tirzNestedBtn = document.createElement("button");
  tirzNestedBtn.className = "nested-dropdown-btn";
  tirzNestedBtn.textContent = "Tirz";

  const tirzNestedContent = document.createElement("div");
  tirzNestedContent.className = "nested-dropdown-content";

  // Toggle nested dropdown when button is clicked
  tirzNestedBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    tirzNestedDropdown.classList.toggle("open");
  });

  // Tirz Option 1: Tirz/B6 Refill - Step 2
  const tirzB6RefillItem = document.createElement("button");
  tirzB6RefillItem.className = "automation-btn";
  tirzB6RefillItem.textContent = "Tirz/B6 Refill - Step 2";
  tirzB6RefillItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Tirz/B6 Refill - Step 2"]);
    }, 300);
  });
  tirzNestedContent.appendChild(tirzB6RefillItem);

  // Tirz Option 2: Tirz/B12 Vial - Step 2
  const tirzB12VialItem = document.createElement("button");
  tirzB12VialItem.className = "automation-btn";
  tirzB12VialItem.textContent = "Tirz/B12 Vial - Step 2";
  tirzB12VialItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Tirz/B12 Vial - Step 2"]);
    }, 300);
  });
  tirzNestedContent.appendChild(tirzB12VialItem);

  // Tirz Option 3: Tirz/NAD+ Vial - Step 2
  const tirzNADVialItem = document.createElement("button");
  tirzNADVialItem.className = "automation-btn";
  tirzNADVialItem.textContent = "Tirz/NAD+ Vial - Step 2";
  tirzNADVialItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Tirz/NAD+ Vial - Step 2"]);
    }, 300);
  });
  tirzNestedContent.appendChild(tirzNADVialItem);

  // Tirz Option 4: Tirz/B6 Vial - Step 2
  const tirzB6VialItem = document.createElement("button");
  tirzB6VialItem.className = "automation-btn";
  tirzB6VialItem.textContent = "Tirz/B6 Vial - Step 2";
  tirzB6VialItem.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    setTimeout(() => {
      runConsoleBased(finalSelectionMap["Tirz/B6 Vial - Step 2"]);
    }, 300);
  });
  tirzNestedContent.appendChild(tirzB6VialItem);

  // Assemble Tirz nested dropdown
  tirzNestedDropdown.appendChild(tirzNestedBtn);
  tirzNestedDropdown.appendChild(tirzNestedContent);

  // Add to main dropdown
  dropdownContent.appendChild(tirzNestedDropdown);

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
 * Console-based approach to run a workflow using scroll wheel simulation
 *
 * @param {string} finalTextToFind - The exact text to match in the final selection
 */
function runConsoleBased(finalTextToFind) {
  try {
    console.log(`[CRM Extension] Starting workflow for "${finalTextToFind}"`);
    showToast(`Starting workflow for "${finalTextToFind}"`);

    // Step 1: Use the console method to open the automation dialog
    const addButton = Array.from(document.querySelectorAll('button.btn.btn-light2.btn-xs'))
      .find(btn => btn.textContent.trim().includes("Add"));

    if (!addButton) {
      console.error("[CRM Extension] Add Automation button not found");
      showToast("Add Automation button not found");
      return;
    }

    console.log("[CRM Extension] Found Add button, clicking it");
    addButton.click();

    // Step 2: After dialog opens, find and populate the search field
    setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder="Type to search"]');
      if (!searchInput) {
        console.error("[CRM Extension] Search input not found");
        showToast("Search input not found");
        return;
      }

      console.log("[CRM Extension] Found search input, entering 'step 2'");
      searchInput.focus();
      searchInput.value = "step 2";
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Step 3: Wait for initial options to load, then use scroll wheel simulation
      setTimeout(() => {
        // Find the dropdown container
        const containerSelectors = [
          '.v-list', '.dropdown-menu', '.v-select-list', '.vs__dropdown-menu',
          '[role="listbox"]', 'ul', '.v-menu__content'
        ];

        let container = null;
        for (const selector of containerSelectors) {
          const element = document.querySelector(selector);
          if (
            element &&
            element.querySelector('li, .v-list-item, .dropdown-item') &&
            element.scrollHeight > element.clientHeight
          ) {
            container = element;
            console.log(`[CRM Extension] Found scrollable dropdown container: ${selector}`);
            break;
          }
        }

        // Fallback: Find any scrollable element in the dialog
        if (!container) {
          const dialog = document.querySelector('.modal, dialog, [role="dialog"]');
          if (dialog) {
            const scrollables = Array.from(dialog.querySelectorAll('*')).filter(el => {
              return el.scrollHeight > el.clientHeight && el.clientHeight > 50;
            });
            if (scrollables.length > 0) {
              container = scrollables[0];
              console.log('[CRM Extension] Found scrollable element via fallback method');
            }
          }
        }

        if (!container) {
          console.error("[CRM Extension] Could not find scrollable container");
          showToast("Could not find dropdown container");
          return;
        }

        console.log("[CRM Extension] Starting scroll wheel simulation");
        console.log(`[CRM Extension] Container dimensions: ${container.scrollHeight}x${container.clientHeight}`);

        let scrollAttempts = 0;
        const maxScrollAttempts = 20;
        let foundMatch = false;

        function simulateScroll() {
          if (foundMatch || scrollAttempts >= maxScrollAttempts) {
            if (!foundMatch) {
              console.error("[CRM Extension] Max scroll attempts reached without finding match");
              showToast("Option not found after scrolling");
            }
            return;
          }

          scrollAttempts++;
          console.log(`[CRM Extension] Scroll attempt ${scrollAttempts}/${maxScrollAttempts}`);

          // Simulate wheel event
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: 100,
            bubbles: true
          });
          container.dispatchEvent(wheelEvent);

          // Also update scrollTop directly
          container.scrollTop += 100;
          console.log(`[CRM Extension] Scrolled to position: ${container.scrollTop}/${container.scrollHeight}`);

          // After scrolling, check visible options
          setTimeout(() => {
            // Get all visible options
            const options = container.querySelectorAll('li, .v-list-item, .dropdown-item, [role="option"]');
            console.log(`[CRM Extension] Found ${options.length} options after scrolling`);

            for (const option of options) {
              if (!option.textContent) continue;

              const text = option.textContent.trim();
              // Exact match check
              if (
                text === finalTextToFind &&
                !text.includes("Provider Paid") &&
                !text.includes("New Patient")
              ) {
                console.log(`[CRM Extension] Found exact matching option: "${text}"`);

                // Click the option
                try {
                  option.scrollIntoView({ block: "center" });
                  setTimeout(() => {
                    option.click();
                    foundMatch = true;

                    // After selection, find and click the Add button
                    setTimeout(() => {
                      const addDialogButton = Array.from(document.querySelectorAll('button'))
                        .find(btn => btn.textContent.trim() === "Add");

                      if (addDialogButton) {
                        console.log("[CRM Extension] Clicking Add button in dialog");
                        addDialogButton.click();
                        showToast(`Added "${finalTextToFind}" workflow`);
                      } else {
                        console.error("[CRM Extension] Add button in dialog not found");
                        showToast("Add button in dialog not found");
                      }
                    }, 1000);
                  }, 300);
                } catch (e) {
                  console.error("[CRM Extension] Error clicking option:", e);
                }
                break; // Stop checking once we found a match
              }
            }

            // If we still haven't found it, continue scrolling or quit if at bottom
            if (!foundMatch) {
              const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 20;
              if (isAtBottom) {
                console.log("[CRM Extension] Reached bottom of dropdown without finding match");
                showToast(`Reached end without finding "${finalTextToFind}"`);
                return;
              }

              setTimeout(simulateScroll, 500);
            }
          }, 500);
        }

        // Start the scrolling process
        simulateScroll();

      }, 1500); // Wait for initial dropdown to load
    }, 1000);   // Wait for dialog to open
  } catch (error) {
    console.error(`[CRM Extension] Error in workflow:`, error);
    showToast(`Error in workflow: ${error.message}`);
  }
}