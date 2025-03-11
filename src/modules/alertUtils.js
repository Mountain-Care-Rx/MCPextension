// modules/alertUtils.js
// Utility module for displaying alert banners for provider-paid and other tag-based alerts

// Track the current state of alert banners
let alertsInitialized = false;
let currentAlerts = new Set();

/**
 * Initialize the alert system
 * Creates necessary CSS and sets up observers for tag changes
 */
export function initAlertSystem() {
  if (alertsInitialized) return;
  
  // Create styles for alerts
  createAlertStyles();
  
  // Start monitoring for provider-paid tag
  startTagMonitoring();
  
  // Mark as initialized
  alertsInitialized = true;
  console.log('[CRM Extension] Alert system initialized');
}

/**
 * Creates and adds CSS styles for alerts
 */
function createAlertStyles() {
  if (document.getElementById('crm-alert-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'crm-alert-styles';
  style.textContent = `
    .crm-alert-banner {
      position: fixed;
      top: 32px; /* Positioned right below the header bar */
      left: 0;
      right: 0;
      width: 100%;
      padding: 4px 15px; /* Reduced vertical padding for smaller height */
      font-size: 13px;
      font-weight: 500;
      z-index: 999990;
      display: flex;
      align-items: center;
      justify-content: center; /* Center contents horizontally */
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transform: translateY(-100%);
      opacity: 0;
      height: 25px; /* Fixed height at 3/4 of original (approx) */
    }
    
    .crm-alert-banner.show {
      transform: translateY(0);
      opacity: 1;
    }
    
    .crm-alert-banner .alert-icon {
      margin-right: 8px;
      font-size: 16px;
    }
    
    .crm-alert-banner .alert-message {
      text-align: center; /* Center the text */
      margin: 0 auto; /* Center with auto margins */
      flex-grow: 0; /* Don't grow to fill space */
    }
    
    .crm-alert-banner .alert-close {
      margin-left: 10px;
      cursor: pointer;
      opacity: 0.7;
      font-size: 16px;
      background: none;
      border: none;
      color: inherit;
      padding: 0 5px;
    }
    
    .crm-alert-banner .alert-close:hover {
      opacity: 1;
    }
    
    /* Provider Paid specific alert styling */
    .crm-alert-banner.provider-paid {
      background-color: #FFAB40; /* Orange */
      color: #5F4200;
      border-bottom: 1px solid #FF9100;
    }
    
    /* Adjust body padding to accommodate the alert banner */
    body.has-alert {
      padding-top: 72px !important; /* 32px (header) + approx alert height */
    }
    
    /* When header is hidden but alert is visible */
    body.no-header.has-alert {
      padding-top: 25px !important; /* Just the alert height */
    }
    
    /* Multiple alerts stacking */
    .crm-alert-banner.second-alert {
      top: 57px;
    }
    
    .crm-alert-banner.third-alert {
      top: 82px;
    }
    
    /* Countdown timer styling */
    .countdown-timer {
      margin-left: 5px;
      font-size: 11px;
      opacity: 0.75;
      background-color: rgba(0, 0, 0, 0.1);
      padding: 1px 4px;
      border-radius: 3px;
      min-width: 30px;
      text-align: center;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Starts monitoring for specific tags like provider-paid
 */
function startTagMonitoring() {
  // Check tags initially
  checkForProviderPaidTag();
  
  // Set up a MutationObserver to watch for changes to tags
  const tagObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Look for added nodes that might contain tags
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        checkForProviderPaidTag();
      }
      
      // Also watch for direct attribute changes on tag elements
      if (mutation.type === 'attributes' && 
          (mutation.target.classList.contains('tag') || 
           mutation.target.classList.contains('tag-label') ||
           mutation.target.classList.contains('provider-paid'))) {
        checkForProviderPaidTag();
      }
    }
  });
  
  // Watch the entire document for tag changes
  tagObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-tag']
  });
  
  // Also check periodically and on URL changes
  setInterval(checkForProviderPaidTag, 3000);
  
  // Check when URL changes
  let lastUrl = window.location.href;
  setInterval(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      setTimeout(checkForProviderPaidTag, 1000); // Check after a delay to allow page to load
    }
  }, 1000);
}

/**
 * Checks if the provider-paid tag is present in the current page
 */
function checkForProviderPaidTag() {
  // Search for provider-paid tag using multiple selectors
  const providerPaidTag = findProviderPaidTag();
  
  if (providerPaidTag) {
    // Tag found, show alert
    showProviderPaidAlert();
  } else {
    // Tag not found, hide alert
    hideAlert('provider-paid');
  }
}

/**
 * Searches for provider-paid tag using multiple selector strategies
 * @returns {Element|null} The found tag element or null
 */
function findProviderPaidTag() {
  // Strategy 1: Look for tag elements with provider-paid text
  const tagElements = document.querySelectorAll('.tag, .tag-label, .pill, .badge');
  for (const tag of tagElements) {
    if (tag.textContent.toLowerCase().includes('provider-paid')) {
      return tag;
    }
  }
  
  // Strategy 2: Look for provider-paid class directly
  const providerPaidElements = document.querySelectorAll('.provider-paid');
  if (providerPaidElements.length > 0) {
    return providerPaidElements[0];
  }
  
  // Strategy 3: Look for data attributes related to tags
  const dataTagElements = document.querySelectorAll('[data-tag="provider-paid"], [data-tag-name="provider-paid"]');
  if (dataTagElements.length > 0) {
    return dataTagElements[0];
  }
  
  // Strategy 4: Check specific containers that might hold tags
  const tagContainers = document.querySelectorAll('.tags-container, .tag-list, .tags');
  for (const container of tagContainers) {
    if (container.textContent.toLowerCase().includes('provider-paid')) {
      return container;
    }
  }
  
  // No provider-paid tag found
  return null;
}

/**
 * Shows the provider-paid alert banner
 */
export function showProviderPaidAlert() {
  // Don't show duplicate alerts
  if (currentAlerts.has('provider-paid')) return;
  
  // Create the alert banner
  const alert = document.createElement('div');
  alert.className = 'crm-alert-banner provider-paid';
  alert.id = 'provider-paid-alert';
  alert.setAttribute('data-alert-type', 'provider-paid');
  
  // Add alert icon
  const alertIcon = document.createElement('span');
  alertIcon.className = 'alert-icon';
  alertIcon.innerHTML = '⚠️';
  alert.appendChild(alertIcon);
  
  // Add alert message with countdown timer
  const alertMessage = document.createElement('span');
  alertMessage.className = 'alert-message';
  alertMessage.textContent = 'This patient has Provider Paid status. Special billing rules apply.';
  
  // Create countdown timer element
  const countdownTimer = document.createElement('span');
  countdownTimer.className = 'countdown-timer';
  countdownTimer.textContent = '60';
  alertMessage.appendChild(countdownTimer);
  
  alert.appendChild(alertMessage);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'alert-close';
  closeButton.innerHTML = '✕';
  closeButton.setAttribute('aria-label', 'Close alert');
  closeButton.addEventListener('click', () => {
    hideAlert('provider-paid');
  });
  alert.appendChild(closeButton);
  
  // Add alert to the page
  document.body.appendChild(alert);
  
  // Position alert based on how many alerts are already showing
  positionAlert(alert);
  
  // Show the alert with animation
  setTimeout(() => {
    alert.classList.add('show');
    document.body.classList.add('has-alert');
  }, 10);
  
  // Add to tracking set
  currentAlerts.add('provider-paid');
  
  // Check if header is visible and adjust body padding appropriately
  const header = document.getElementById('mcp-crm-header');
  if (header && header.style.display === 'none') {
    document.body.classList.add('no-header');
  } else {
    document.body.classList.remove('no-header');
  }
  
  console.log('[CRM Extension] Provider Paid alert shown');
  
  // Start the countdown timer - automatically disappear after 60 seconds
  let secondsLeft = 60;
  const countdownInterval = setInterval(() => {
    secondsLeft--;
    
    // Update the countdown display
    if (countdownTimer) {
      countdownTimer.textContent = secondsLeft;
    }
    
    // When countdown reaches zero, hide the alert
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      hideAlert('provider-paid');
    }
  }, 1000);
}

/**
 * Positions an alert based on how many alerts are already showing
 * @param {HTMLElement} alert - The alert element to position
 */
function positionAlert(alert) {
  const alertCount = currentAlerts.size;
  
  if (alertCount === 1) {
    alert.classList.add('second-alert');
  } else if (alertCount === 2) {
    alert.classList.add('third-alert');
  }
}

/**
 * Hides an alert by type
 * @param {string} alertType - The type of alert to hide
 */
export function hideAlert(alertType) {
  const alert = document.querySelector(`.crm-alert-banner[data-alert-type="${alertType}"]`);
  
  if (!alert) return;
  
  // Remove from DOM
  alert.classList.remove('show');
  
  // Remove from tracking
  currentAlerts.delete(alertType);
  
  // Remove alert after animation completes
  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
    
    // If no more alerts, remove body class
    if (currentAlerts.size === 0) {
      document.body.classList.remove('has-alert');
    }
    
    // Reposition remaining alerts
    repositionRemainingAlerts();
  }, 300);
}

/**
 * Repositions remaining alerts after one is removed
 */
function repositionRemainingAlerts() {
  const alerts = document.querySelectorAll('.crm-alert-banner');
  
  alerts.forEach((alert, index) => {
    // Remove all position classes
    alert.classList.remove('second-alert', 'third-alert');
    
    // Add appropriate class based on index
    if (index === 1) {
      alert.classList.add('second-alert');
    } else if (index === 2) {
      alert.classList.add('third-alert');
    }
  });
}

/**
 * General function to show a custom alert
 * @param {string} message - Alert message
 * @param {string} type - Alert type/class
 * @param {string} id - Unique ID for the alert
 */
export function showCustomAlert(message, type, id) {
  if (currentAlerts.has(id)) return;
  
  // Create the alert banner
  const alert = document.createElement('div');
  alert.className = `crm-alert-banner ${type}`;
  alert.id = `${id}-alert`;
  alert.setAttribute('data-alert-type', id);
  
  // Add alert icon (customize based on type)
  const alertIcon = document.createElement('span');
  alertIcon.className = 'alert-icon';
  
  // Set icon based on type
  if (type.includes('warning')) {
    alertIcon.innerHTML = '⚠️';
  } else if (type.includes('info')) {
    alertIcon.innerHTML = 'ℹ️';
  } else if (type.includes('success')) {
    alertIcon.innerHTML = '✓';
  } else {
    alertIcon.innerHTML = '🔔';
  }
  
  alert.appendChild(alertIcon);
  
  // Add alert message
  const alertMessage = document.createElement('span');
  alertMessage.className = 'alert-message';
  alertMessage.textContent = message;
  alert.appendChild(alertMessage);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'alert-close';
  closeButton.innerHTML = '✕';
  closeButton.setAttribute('aria-label', 'Close alert');
  closeButton.addEventListener('click', () => {
    hideAlert(id);
  });
  alert.appendChild(closeButton);
  
  // Add alert to the page
  document.body.appendChild(alert);
  
  // Position alert based on how many alerts are already showing
  positionAlert(alert);
  
  // Show the alert with animation
  setTimeout(() => {
    alert.classList.add('show');
    document.body.classList.add('has-alert');
  }, 10);
  
  // Add to tracking set
  currentAlerts.add(id);
}