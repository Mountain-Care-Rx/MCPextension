// modules/ui/components/dropdowns/vialTirzDropdown.js

import { createDropdown } from '../dropdownsGroup.js';
import { showToast } from '../../../phoneUtils.js';

/**
 * Creates the Vial Tirz dropdown with predefined options
 * 
 * @returns {HTMLElement} The Vial Tirz dropdown element
 */
export function createVialTirzDropdown() {
  // You can add items here as they are needed
  // For now, we'll return an empty dropdown as a placeholder
  // Example of how to add items:
  /*
  const items = [
    {
      text: "Option 1",
      callback: () => {
        // Action for Option 1
        showToast("Selected Vial Tirz Option 1");
      }
    },
    {
      text: "Option 2",
      callback: () => {
        // Action for Option 2
        showToast("Selected Vial Tirz Option 2");
      }
    }
  ];
  */
  
  const items = [];
  
  return createDropdown("Vial Tirz", items);
}