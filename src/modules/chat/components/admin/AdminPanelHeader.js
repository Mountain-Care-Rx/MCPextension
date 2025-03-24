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
    
    this.tabNavElement = null;
    this.tabButtons = []; // Store references to tab buttons
    
    // Bind methods
    this.handleTabClick = this.handleTabClick.bind(this);
    this.updateActiveTab = this.updateActiveTab.bind(this);
    
    // Render the header
    this.render();
  }
  
  /**
   * Render the header and tab navigation
   */
  render() {
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
    
    // Clear tab buttons array
    this.tabButtons = [];
    
    // Create tab buttons
    tabs.forEach(tab => {
      const tabButton = this.createTabButton(tab);
      this.tabNavElement.appendChild(tabButton);
      this.tabButtons.push({
        element: tabButton,
        id: tab.id
      });
    });
    
    // Append tab navigation to parent
    this.parentElement.appendChild(this.tabNavElement);
  }
  
  /**
   * Update the active tab styling
   * @param {string} tabId - ID of the new active tab
   */
  updateActiveTab(tabId) {
    // Update internal active tab state
    this.activeTab = tabId;
    
    // Update the visual styling of all tab buttons
    this.tabButtons.forEach(button => {
      if (button.element) {
        const isActive = button.id === tabId;
        
        // Update button styling
        this.applyStyles(button.element, {
          backgroundColor: isActive ? '#ffffff' : 'transparent',
          borderBottom: isActive ? '2px solid #2196F3' : '2px solid transparent',
          fontWeight: isActive ? 'bold' : 'normal',
          color: isActive ? '#2196F3' : '#495057'
        });
        
        // Update active class
        if (isActive) {
          button.element.classList.add('active');
        } else {
          button.element.classList.remove('active');
        }
      }
    });
    
    console.log(`[AdminPanelHeader] Updated active tab styling to: ${tabId}`);
  }
  
  /**
   * Handle tab button click
   * @param {string} tabId - ID of the clicked tab
   * @param {Event} e - Click event
   */
  handleTabClick(tabId, e) {
    e.preventDefault(); // Prevent default button behavior
    e.stopPropagation(); // Prevent event bubbling
    
    console.log(`[AdminPanelHeader] Tab ${tabId} clicked`);
    
    // Call the tab switching callback directly
    if (this.switchTabCallback && typeof this.switchTabCallback === 'function') {
      try {
        // Pass the tab ID to the callback
        this.switchTabCallback(tabId);
        
        // Update tab styling
        this.updateActiveTab(tabId);
        
        // Log tab click
        logChatEvent('admin', `Clicked ${tabId} tab`);
      } catch (error) {
        console.error("[AdminPanelHeader] Error in tab click handler:", error);
      }
    } else {
      console.warn('[AdminPanelHeader] No valid switchTabCallback provided');
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
    
    const isActive = this.activeTab === tab.id;
    
    this.applyStyles(tabButton, {
      padding: '12px 16px',
      backgroundColor: isActive ? '#ffffff' : 'transparent',
      border: 'none',
      borderBottom: isActive ? '2px solid #2196F3' : '2px solid transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: isActive ? 'bold' : 'normal',
      display: 'flex',
      alignItems: 'center',
      color: isActive ? '#2196F3' : '#495057',
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
    
    // Use a simple event listener with console log for debugging
    tabButton.onclick = (e) => {
      console.log(`Direct click on ${tab.id} tab`);
      this.handleTabClick(tab.id, e);
    };
    
    return tabButton;
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
    // Remove event listeners (no longer tracking individual handlers)
    if (this.tabButtons.length > 0) {
      this.tabButtons.forEach(button => {
        if (button.element) {
          // Remove onclick property
          button.element.onclick = null;
        }
      });
      
      // Clear the buttons array
      this.tabButtons = [];
    }
    
    // Remove elements from DOM
    if (this.tabNavElement && this.tabNavElement.parentNode) {
      this.tabNavElement.parentNode.removeChild(this.tabNavElement);
    }
  }
}

export default AdminPanelHeader;