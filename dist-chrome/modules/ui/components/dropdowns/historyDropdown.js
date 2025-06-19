// modules/ui/components/dropdowns/historyDropdown.js

import { getHistoryEntries, clearHistory, formatTime } from '../../../historyUtils.js';
import { showToast } from '../../../phoneUtils.js';

/**
 * Creates the History dropdown with patient visit history
 * 
 * @returns {HTMLElement} The History dropdown element
 */
export function createHistoryDropdown() {
  // Create the main dropdown container
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";
  dropdown.id = "crm-history-dropdown";
  
  // Create the main dropdown button
  const dropdownBtn = document.createElement("button");
  dropdownBtn.className = "dropdown-btn";
  dropdownBtn.textContent = "History";
  
  // Toggle dropdown menu when button is clicked
  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    
    // Close any other open dropdowns
    document.querySelectorAll('.dropdown.show').forEach(d => {
      if (d !== dropdown) {
        d.classList.remove('show');
      }
    });
    
    // Toggle dropdown visibility
    dropdown.classList.toggle("show");
    
    // Update history items when dropdown is opened
    if (dropdown.classList.contains('show')) {
      updateHistoryItems(dropdown);
    }
  });
  
  // Create the dropdown content container
  const dropdownContent = document.createElement("div");
  dropdownContent.className = "dropdown-content";
  dropdownContent.id = "crm-history-content";
  dropdownContent.style.width = "300px"; // Wider to accommodate patient info
  dropdownContent.style.maxHeight = "400px"; // Add max height for scrolling
  dropdownContent.style.overflowY = "auto"; // Enable vertical scrolling
  dropdownContent.style.right = "0"; // Position from right edge
  dropdownContent.style.left = "auto"; // Override default left position
  
  // Add custom styles for history dropdown
  if (!document.getElementById('history-dropdown-styles')) {
    const style = document.createElement('style');
    style.id = 'history-dropdown-styles';
    style.textContent = `
      #crm-history-dropdown .dropdown-content {
        padding: 0;
        right: 0;
        left: auto;
      }
      
      /* For small screens, make sure the dropdown doesn't extend beyond viewport */
      @media screen and (max-width: 768px) {
        #crm-history-dropdown .dropdown-content {
          right: 0;
          left: auto;
          max-width: 100vw;
          width: 280px; /* Slightly smaller on small screens */
        }
      }
      
      .history-header {
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .history-title {
        font-weight: bold;
        color: #e6e6e6;
        font-size: 14px;
      }
      
      .history-clear-btn {
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 11px;
        cursor: pointer;
        color: #e6e6e6;
        transition: background-color 0.2s;
      }
      
      .history-clear-btn:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .history-empty {
        padding: 20px;
        text-align: center;
        color: #aaa;
        font-style: italic;
        font-size: 13px;
      }
      
      .history-item {
        padding: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .history-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .history-item:last-child {
        border-bottom: none;
      }
      
      .history-item-row {
        display: flex;
        margin-bottom: 3px;
        width: 100%;
      }
      
      .history-item-time {
        color: #aaa;
        font-size: 11px;
        width: 60px;
        flex-shrink: 0;
        margin-right: 5px;
      }
      
      .history-item-name {
        font-weight: bold;
        color: #e6e6e6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 1;
      }
      
      .history-item-phone {
        color: #ccc;
        font-size: 12px;
        margin-left: 65px; /* Align with name (time width + margin) */
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create header with title and clear button
  const historyHeader = document.createElement("div");
  historyHeader.className = "history-header";
  
  const historyTitle = document.createElement("div");
  historyTitle.className = "history-title";
  historyTitle.textContent = "Recent Patients";
  historyHeader.appendChild(historyTitle);
  
  const clearButton = document.createElement("button");
  clearButton.className = "history-clear-btn";
  clearButton.textContent = "Clear All";
  clearButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from closing dropdown
    clearHistory();
    updateHistoryItems(dropdown);
    showToast("History cleared");
  });
  historyHeader.appendChild(clearButton);
  
  dropdownContent.appendChild(historyHeader);
  
  // Initially populate with empty state (will be updated when opened)
  const emptyState = document.createElement("div");
  emptyState.className = "history-empty";
  emptyState.textContent = "No patient history yet";
  dropdownContent.appendChild(emptyState);
  
  // Assemble the dropdown
  dropdown.appendChild(dropdownBtn);
  dropdown.appendChild(dropdownContent);
  
  return dropdown;
}

/**
 * Updates the history items in the dropdown
 * @param {HTMLElement} dropdown - The dropdown element
 */
function updateHistoryItems(dropdown) {
  const dropdownContent = dropdown.querySelector('#crm-history-content');
  if (!dropdownContent) return;
  
  // Get updated history entries
  const entries = getHistoryEntries();
  
  // Clear existing content (except the header)
  const header = dropdownContent.querySelector('.history-header');
  dropdownContent.innerHTML = '';
  if (header) {
    dropdownContent.appendChild(header);
  }
  
  // Show empty state if no entries
  if (entries.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "history-empty";
    emptyState.textContent = "No patient history yet";
    dropdownContent.appendChild(emptyState);
    return;
  }
  
  // Add each history entry as a clickable item
  entries.forEach(entry => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.addEventListener("click", () => {
      // Navigate to the patient profile
      window.location.href = entry.url;
      // Close the dropdown
      dropdown.classList.remove('show');
    });
    
    // First row: Time and Name
    const nameRow = document.createElement("div");
    nameRow.className = "history-item-row";
    
    const timeElem = document.createElement("div");
    timeElem.className = "history-item-time";
    timeElem.textContent = formatTime(entry.timestamp);
    
    const nameElem = document.createElement("div");
    nameElem.className = "history-item-name";
    nameElem.textContent = entry.patientName || "Unknown Patient";
    
    nameRow.appendChild(timeElem);
    nameRow.appendChild(nameElem);
    historyItem.appendChild(nameRow);
    
    // Second row: Phone number
    if (entry.phoneNumber) {
      const phoneElem = document.createElement("div");
      phoneElem.className = "history-item-phone";
      phoneElem.textContent = entry.phoneNumber;
      historyItem.appendChild(phoneElem);
    }
    
    dropdownContent.appendChild(historyItem);
  });
}