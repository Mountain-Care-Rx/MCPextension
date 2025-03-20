// chat/components/admin/AdminPanel.js
// Main router for admin panel components

import { getCurrentUser } from '../../services/auth';
import { logChatEvent } from '../../utils/logger.js';

import AdminPanelHeader from './AdminPanelHeader.js';
import AdminPanelTabs from './AdminPanelTabs.js';

// Import management components
import UserManager from './UserManager.js';
import ChannelManager from './ChannelManager.js';
import RoleManager from './RoleManager.js';

/**
 * Admin Panel Component
 * Primary router and container for administrative functionality
 */
class AdminPanel {
  /**
   * Create a new AdminPanel
   * @param {HTMLElement} container - The container element
   */
  constructor(container) {
    this.container = container;
    this.panelElement = null;
    this.activeTab = 'users'; // Changed default from dashboard to users to match UI
    
    // Subcomponents
    this.header = null;
    this.tabContent = null;
    this.userManager = null;
    this.channelManager = null;
    this.roleManager = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.switchTab = this.switchTab.bind(this);
    this.renderAccessDenied = this.renderAccessDenied.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the admin panel
   */
  initialize() {
    // Create main panel element
    this.panelElement = document.createElement('div');
    this.panelElement.className = 'admin-panel';
    this.applyStyles(this.panelElement, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#f8f9fa'
    });
    
    // Add to container
    if (this.container) {
      this.container.appendChild(this.panelElement);
    }
    
    // Log initialization
    logChatEvent('admin', 'Admin panel initialized');
    
    // Render the panel
    this.render();
  }
  
  /**
   * Render the admin panel
   */
  render() {
    if (!this.panelElement) return;
    
    // Clear existing content
    this.panelElement.innerHTML = '';
    
    // Check permissions
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isAdmin) {
      this.renderAccessDenied();
      return;
    }
    
    // Create header
    this.header = new AdminPanelHeader(this.panelElement, this.switchTab, this.activeTab);
    
    // Create tab content area
    this.tabContent = document.createElement('div');
    this.tabContent.className = 'tab-content';
    this.applyStyles(this.tabContent, {
      flex: '1',
      padding: '20px',
      backgroundColor: '#ffffff',
      overflowY: 'auto'
    });
    
    // Append tab content to panel
    this.panelElement.appendChild(this.tabContent);
    
    // Render active tab content
    this.renderActiveTab();
  }
  
  /**
   * Render the content for the active tab
   */
  renderActiveTab() {
    // Destroy existing tab components
    this.destroyExistingManagers();
    
    // Use AdminPanelTabs to render the appropriate content
    AdminPanelTabs.renderTab(this.activeTab, this.tabContent, {
      onUserManagerCreated: (manager) => this.userManager = manager,
      onChannelManagerCreated: (manager) => this.channelManager = manager,
      onRoleManagerCreated: (manager) => this.roleManager = manager
    });
    
    // Log active tab render
    logChatEvent('admin', `Rendered ${this.activeTab} tab content`);
  }
  
  /**
   * Destroy existing tab managers
   */
  destroyExistingManagers() {
    if (this.userManager) {
      this.userManager.destroy();
      this.userManager = null;
    }
    
    if (this.channelManager) {
      this.channelManager.destroy();
      this.channelManager = null;
    }
    
    if (this.roleManager) {
      this.roleManager.destroy();
      this.roleManager = null;
    }
  }
  
  /**
   * Switch to a different tab
   * @param {string} tabId - ID of the tab to switch to
   */
  switchTab(tabId) {
    if (this.activeTab === tabId) return;
    
    // Update active tab
    this.activeTab = tabId;
    
    // Log tab switch
    logChatEvent('admin', `Switched to ${tabId} tab`);
    
    // Re-render the tab content without recreating the entire panel
    this.renderActiveTab();
  }
  
  /**
   * Render access denied message
   */
  renderAccessDenied() {
    this.panelElement.innerHTML = '';
    
    const accessDenied = document.createElement('div');
    this.applyStyles(accessDenied, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '20px',
      textAlign: 'center',
      color: '#721c24',
      backgroundColor: '#f8d7da'
    });
    
    const iconElement = document.createElement('div');
    iconElement.innerHTML = '⛔';
    this.applyStyles(iconElement, {
      fontSize: '48px',
      marginBottom: '16px'
    });
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = 'Access Denied';
    this.applyStyles(titleElement, {
      margin: '0 0 10px 0',
      fontSize: '24px'
    });
    
    const messageElement = document.createElement('p');
    messageElement.textContent = 'Administrator privileges are required to access this area.';
    
    accessDenied.appendChild(iconElement);
    accessDenied.appendChild(titleElement);
    accessDenied.appendChild(messageElement);
    
    this.panelElement.appendChild(accessDenied);
    
    // Log access attempt
    logChatEvent('admin', 'Access denied to admin panel');
  }
  
  /**
   * Destroy the admin panel
   */
  destroy() {
    // Destroy all subcomponents
    this.destroyExistingManagers();
    
    // Remove from DOM
    if (this.panelElement && this.panelElement.parentNode) {
      this.panelElement.parentNode.removeChild(this.panelElement);
    }
    
    // Log destruction
    logChatEvent('admin', 'Admin panel destroyed');
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

export default AdminPanel;