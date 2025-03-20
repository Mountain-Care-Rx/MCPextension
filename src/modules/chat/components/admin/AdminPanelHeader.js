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
    
    // Define tabs
    const tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'users', label: 'User Management', icon: '👥' },
      { id: 'channels', label: 'Channel Management', icon: '💬' },
      { id: 'roles', label: 'Roles & Permissions', icon: '🔑' },
      { id: 'audit', label: 'Audit Log', icon: '📝' },
      { id: 'settings', label: 'System Settings', icon: '⚙️' }
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
   * Create a tab button
   * @param {Object} tab - Tab configuration
   * @returns {HTMLElement} Tab button element
   */
  createTabButton(tab) {
    const tabButton = document.createElement('button');
    tabButton.className = `tab-button ${this.activeTab === tab.id ? 'active' : ''}`;
    tabButton.setAttribute('data-tab', tab.id);
    
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
      color: this.activeTab === tab.id ? '#2196F3' : '#495057'
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
    
    // Add click event
    tabButton.addEventListener('click', () => {
      this.switchTabCallback(tab.id);
      
      // Visually update tab buttons
      this.updateTabButtonStyles(tab.id);
    });
    
    return tabButton;
  }
  
  /**
   * Update tab button styles when switching tabs
   * @param {string} activeTabId - ID of the active tab
   */
  updateTabButtonStyles(activeTabId) {
    const tabButtons = this.tabNavElement.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
      const isActive = button.getAttribute('data-tab') === activeTabId;
      
      this.applyStyles(button, {
        backgroundColor: isActive ? '#ffffff' : 'transparent',
        borderBottom: isActive ? '2px solid #2196F3' : '2px solid transparent',
        fontWeight: isActive ? 'bold' : 'normal',
        color: isActive ? '#2196F3' : '#495057'
      });
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
}

export default AdminPanelHeader;