// chat/components/admin/AdminPanelHeader.js
// Header and tab navigation for admin panel

import { logChatEvent } from '../../utils/logger.js';

/**
 * Admin Panel Header Component
 * Manages the header and tab navigation for the admin panel
 */
class AdminPanelHeader {
  /**
   * Create a new AdminPanelHeader
   * @param {HTMLElement} parentElement - The parent element to append header to
   * @param {Function} switchTabCallback - Callback to switch tabs
   * @param {string} activeTab - Currently active tab
   */
  constructor(parentElement, switchTabCallback, activeTab) {
    this.parentElement = parentElement;
    this.switchTabCallback = switchTabCallback;
    this.activeTab = activeTab;
    
    this.headerElement = null;
    this.tabNavElement = null;
    this.tabButtonClickHandlers = new Map(); // Store references to event handlers
    
    // Bind methods
    this.handleTabClick = this.handleTabClick.bind(this);
    
    // Render the header
    this.render();
  }
  
  /**
   * Render the header and tab navigation
   */
  render() {
    // Create header
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'admin-header';
    this.applyStyles(this.headerElement, {
      padding: '16px',
      backgroundColor: '#343a40',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    });
    
    const headerTitle = document.createElement('h2');
    headerTitle.textContent = 'MCP Chat Administration';
    this.applyStyles(headerTitle, {
      margin: '0',
      fontSize: '18px',
      fontWeight: 'bold'
    });
    
    this.headerElement.appendChild(headerTitle);
    
    // Create tab navigation
    this.tabNavElement = document.createElement('div');
    this.tabNavElement.className = 'admin-tabs';
    this.applyStyles(this.tabNavElement, {
      display: 'flex',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #dee2e6'
    });
    
    // Define tabs - simplified to match UI screenshot
    const tabs = [
      { id: 'users', label: 'Users', icon: '👥' },
      { id: 'channels', label: 'Channels', icon: '💬' },
      { id: 'roles', label: 'Roles & Permissions', icon: '🔑' },
      { id: 'audit', label: 'Audit Log', icon: '📝' }
    ];
    
    // Create tab buttons
    tabs.forEach(tab => {
      const tabButton = this.createTabButton(tab);
      this.tabNavElement.appendChild(tabButton);
    });
    
    // Append header and tab navigation to parent
    this.parentElement.appendChild(this.headerElement);
    this.parentElement.appendChild(this.tabNavElement);
  }
  
  /**
   * Handle tab button click
   * @param {string} tabId - ID of the clicked tab
   * @param {Event} e - Click event
   */
  handleTabClick(tabId, e) {
    e.preventDefault(); // Prevent default button behavior
    e.stopPropagation(); // Prevent event bubbling
    
    console.log(`Tab ${tabId} clicked`); // Add debugging log
    
    // Call the tab switching callback
    if (this.switchTabCallback && typeof this.switchTabCallback === 'function') {
      this.switchTabCallback(tabId);
      
      // Update active tab for this instance
      this.activeTab = tabId;
      
      // Update visual styles
      this.updateTabButtonStyles(tabId);
      
      // Log tab click
      logChatEvent('admin', `Clicked ${tabId} tab`);
    } else {
      console.warn('No valid switchTabCallback provided');
    }
  }
  
  /**
   * Create a tab button
   * @param {Object} tab - Tab configuration
   * @returns {HTMLElement} Tab button element
   */
  createTabButton(tab) {
    const tabButton = document.createElement('button');
    tabButton.className = `tab-button ${this.activeTab === tab.id ? 'active' : ''}`;
    tabButton.setAttribute('data-tab', tab.id);
    tabButton.id = `tab-${tab.id}`; // Add an ID for easier debugging
    
    this.applyStyles(tabButton, {
      padding: '12px 16px',
      backgroundColor: this.activeTab === tab.id ? '#ffffff' : 'transparent',
      border: 'none',
      borderBottom: this.activeTab === tab.id ? '2px solid #2196F3' : '2px solid transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: this.activeTab === tab.id ? 'bold' : 'normal',
      display: 'flex',
      alignItems: 'center',
      color: this.activeTab === tab.id ? '#2196F3' : '#495057',
      pointerEvents: 'auto' // Ensure clicks are registered
    });
    
    const tabIcon = document.createElement('span');
    tabIcon.textContent = tab.icon;
    this.applyStyles(tabIcon, {
      marginRight: '8px',
      fontSize: '16px'
    });
    
    const tabLabel = document.createElement('span');
    tabLabel.textContent = tab.label;
    
    tabButton.appendChild(tabIcon);
    tabButton.appendChild(tabLabel);
    
    // Create a bound click handler for this specific tab
    const clickHandler = this.handleTabClick.bind(this, tab.id);
    
    // Store the click handler for cleanup
    this.tabButtonClickHandlers.set(tabButton, clickHandler);
    
    // Add click event
    tabButton.addEventListener('click', clickHandler);
    
    return tabButton;
  }
  
  /**
   * Update tab button styles when switching tabs
   * @param {string} activeTabId - ID of the active tab
   */
  updateTabButtonStyles(activeTabId) {
    if (!this.tabNavElement) return;
    
    const tabButtons = this.tabNavElement.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
      const isActive = button.getAttribute('data-tab') === activeTabId;
      
      this.applyStyles(button, {
        backgroundColor: isActive ? '#ffffff' : 'transparent',
        borderBottom: isActive ? '2px solid #2196F3' : '2px solid transparent',
        fontWeight: isActive ? 'bold' : 'normal',
        color: isActive ? '#2196F3' : '#495057'
      });
      
      // Add or remove active class
      if (isActive) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }
  
  /**
   * Apply CSS styles to an element
   * @param {HTMLElement} element - Element to style
   * @param {Object} styles - Styles to apply
   */
  applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }
  
  /**
   * Destroy the component and remove listeners
   */
  destroy() {
    // Remove event listeners properly
    if (this.tabNavElement) {
      const tabButtons = this.tabNavElement.querySelectorAll('.tab-button');
      tabButtons.forEach(button => {
        const handler = this.tabButtonClickHandlers.get(button);
        if (handler) {
          button.removeEventListener('click', handler);
        }
      });
      
      // Clear the handlers map
      this.tabButtonClickHandlers.clear();
    }
    
    // Remove elements from DOM
    if (this.headerElement && this.headerElement.parentNode) {
      this.headerElement.parentNode.removeChild(this.headerElement);
    }
    
    if (this.tabNavElement && this.tabNavElement.parentNode) {
      this.tabNavElement.parentNode.removeChild(this.tabNavElement);
    }
  }
}

export default AdminPanelHeader;