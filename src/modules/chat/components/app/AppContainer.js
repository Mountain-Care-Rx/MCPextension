// chat/components/app/AppContainer.js
// Main application container for HIPAA-compliant chat

import { isAuthenticated, getCurrentUser, hasPermission } from '../../services/authService.js';
import { connectToServer, disconnectFromServer, getConnectionStatus, addConnectionStatusListener } from '../../services/messageService.js';
import { logChatEvent } from '../../utils/logger.js';
import { initChat, isChatInitialized } from '../../index.js';

import LoginForm from '../auth/LoginForm.js';
import Header from './Header.js';
import ChannelList from '../admin/channels/ChannelList.js';
import ChannelView from '../admin/channels/ChannelView.js';
import UserList from '../users/UserList.js';
import AdminPanel from '../admin/AdminPanel.js';
import NotificationSystem from './NotificationSystem.js';

/**
 * Main Application Container Component
 * Orchestrates the entire chat application
 */
class AppContainer {
  /**
   * Create a new AppContainer
   * @param {HTMLElement} container - The container element
   */
  constructor(container) {
    this.container = container;
    this.appElement = null;
    
    // Component references
    this.headerComponent = null;
    this.loginFormComponent = null;
    this.channelListComponent = null;
    this.channelViewComponent = null;
    this.userListComponent = null;
    this.adminPanelComponent = null;
    this.notificationSystem = null;
    
    // Application state
    this.connectionStatus = 'disconnected';
    this.currentView = 'chat'; // 'chat', 'admin', 'settings'
    this.showUserList = true;
    
    // Connection status listener unsubscribe function
    this.unsubscribeConnectionStatus = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.handleConnectionStatusChange = this.handleConnectionStatusChange.bind(this);
    this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
    this.handleChannelSelect = this.handleChannelSelect.bind(this);
    this.handleUserSelect = this.handleUserSelect.bind(this);
    this.switchView = this.switchView.bind(this);
    this.toggleUserList = this.toggleUserList.bind(this);
    this.toggleAdminPanel = this.toggleAdminPanel.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    // Create container element
    this.appElement = document.createElement('div');
    this.appElement.className = 'hipaa-chat-app';
    this.applyStyles(this.appElement, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    });
    
    // Add to container
    if (this.container) {
      this.container.appendChild(this.appElement);
    }
    
    // Initialize chat system if not already initialized
    if (!isChatInitialized()) {
      await initChat();
    }
    
    // Subscribe to connection status
    this.unsubscribeConnectionStatus = addConnectionStatusListener(this.handleConnectionStatusChange);
    
    // Get initial connection status
    this.connectionStatus = getConnectionStatus();
    
    // Initialize notification system
    this.notificationSystem = new NotificationSystem();
    
    // Connect to server if already authenticated
    if (isAuthenticated()) {
      connectToServer();
    }
    
    // Render initial state
    this.render();
    
    // Log initialization
    logChatEvent('system', 'Application initialized');
  }
  
  /**
   * Handle connection status change
   * @param {string} status - New connection status
   */
  handleConnectionStatusChange(status) {
    this.connectionStatus = status;
    
    // Update UI
    if (this.headerComponent) {
      this.headerComponent.updateConnectionStatus(status);
    }
    
    // Log status change
    logChatEvent('system', `Connection status changed: ${status}`);
  }
  
  /**
   * Handle successful login
   * @param {Object} user - Logged in user
   */
  handleLoginSuccess(user) {
    // Connect to server
    connectToServer();
    
    // Render main UI
    this.render();
    
    // Log successful login
    logChatEvent('auth', 'User logged in successfully', { username: user.username });
  }
  
  /**
   * Handle channel selection
   * @param {Object} channel - Selected channel
   */
  handleChannelSelect(channel) {
    if (this.channelViewComponent) {
      this.channelViewComponent.updateActiveChannel(channel.id);
    }
  }
  
  /**
   * Handle user selection for direct messages
   * @param {Object} user - Selected user
   */
  handleUserSelect(user) {
    // TODO: Implement direct messaging
    console.log(`[CRM Extension] Selected user for direct message: ${user.username}`);
    
    // Log user selection
    logChatEvent('ui', 'Selected user for direct message', { targetUser: user.username });
  }
  
  /**
   * Switch between application views
   * @param {string} view - View to switch to ('chat', 'admin', 'settings')
   */
  switchView(view) {
    if (this.currentView !== view) {
      this.currentView = view;
      
      // Update header if it exists
      if (this.headerComponent) {
        this.headerComponent.updateActiveView(view);
      }
      
      // Re-render the application
      this.render();
      
      // Log view change
      logChatEvent('ui', `Switched to ${view} view`);
    }
  }
  
  /**
   * Toggle user list visibility
   */
  toggleUserList() {
    this.showUserList = !this.showUserList;
    this.render();
    
    // Log toggle
    logChatEvent('ui', `${this.showUserList ? 'Showed' : 'Hid'} user list`);
  }
  
  /**
   * Toggle admin panel
   */
  toggleAdminPanel() {
    if (this.currentView === 'admin') {
      this.switchView('chat');
    } else {
      this.switchView('admin');
    }
  }
  
  /**
   * Render the application
   */
  render() {
    if (!this.appElement) return;
    
    // Clear existing content
    this.appElement.innerHTML = '';
    
    // Check if authenticated
    const isUserAuthenticated = isAuthenticated();
    
    if (!isUserAuthenticated) {
      // Show login form when not authenticated
      this.loginFormComponent = new LoginForm(this.appElement, this.handleLoginSuccess);
      return;
    }
    
    // Get current user
    const currentUser = getCurrentUser();
    
    // Create header
    this.headerComponent = new Header({
      user: currentUser,
      connectionStatus: this.connectionStatus,
      activeView: this.currentView,
      onViewSwitch: this.switchView,
      onToggleUserList: this.toggleUserList,
      onToggleAdminPanel: this.toggleAdminPanel
    });
    
    this.appElement.appendChild(this.headerComponent.render());
    
    // Create main content area based on current view
    const mainContent = document.createElement('div');
    mainContent.className = 'app-content';
    this.applyStyles(mainContent, {
      display: 'flex',
      flex: '1',
      overflow: 'hidden'
    });
    
    if (this.currentView === 'chat') {
      // Chat view - channels, messages, and users
      this.renderChatView(mainContent);
    } else if (this.currentView === 'admin') {
      // Admin view
      this.renderAdminView(mainContent);
    } else if (this.currentView === 'settings') {
      // Settings view
      this.renderSettingsView(mainContent);
    }
    
    this.appElement.appendChild(mainContent);
  }
  
  /**
   * Render the chat view
   * @param {HTMLElement} container - Container element
   */
  renderChatView(container) {
    // Create layout containers
    const sidebarContainer = document.createElement('div');
    sidebarContainer.className = 'sidebar-container';
    this.applyStyles(sidebarContainer, {
      width: '250px',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    });
    
    const mainContainer = document.createElement('div');
    mainContainer.className = 'main-container';
    this.applyStyles(mainContainer, {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    });
    
    let userListContainer = null;
    if (this.showUserList) {
      userListContainer = document.createElement('div');
      userListContainer.className = 'userlist-container';
      this.applyStyles(userListContainer, {
        width: '250px',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      });
    }
    
    // Add channel list to sidebar
    this.channelListComponent = new ChannelList(sidebarContainer, this.handleChannelSelect);
    
    // Add channel view to main container
    this.channelViewComponent = new ChannelView(mainContainer);
    
    // Add user list if visible
    if (userListContainer) {
      this.userListComponent = new UserList(userListContainer, this.handleUserSelect);
    }
    
    // Add containers to main content
    container.appendChild(sidebarContainer);
    container.appendChild(mainContainer);
    if (userListContainer) {
      container.appendChild(userListContainer);
    }
  }
  
  /**
   * Render the admin view
   * @param {HTMLElement} container - Container element
   */
  renderAdminView(container) {
    // Check admin permissions
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isAdmin) {
      // Show access denied
      const accessDenied = document.createElement('div');
      this.applyStyles(accessDenied, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
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
      
      container.appendChild(accessDenied);
      
      // Log access attempt
      logChatEvent('admin', 'Access denied to admin panel');
      return;
    }
    
    // Create admin panel
    this.adminPanelComponent = new AdminPanel(container);
  }
  
  /**
   * Render the settings view
   * @param {HTMLElement} container - Container element
   */
  renderSettingsView(container) {
    // To be implemented - for now just a placeholder
    const settingsPlaceholder = document.createElement('div');
    this.applyStyles(settingsPlaceholder, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      padding: '20px',
      textAlign: 'center'
    });
    
    const iconElement = document.createElement('div');
    iconElement.innerHTML = '⚙️';
    this.applyStyles(iconElement, {
      fontSize: '48px',
      marginBottom: '16px'
    });
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = 'Settings';
    this.applyStyles(titleElement, {
      margin: '0 0 10px 0',
      fontSize: '24px'
    });
    
    const messageElement = document.createElement('p');
    messageElement.textContent = 'Settings panel will be implemented here.';
    
    settingsPlaceholder.appendChild(iconElement);
    settingsPlaceholder.appendChild(titleElement);
    settingsPlaceholder.appendChild(messageElement);
    
    container.appendChild(settingsPlaceholder);
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
   * Clean up resources
   */
  destroy() {
    // Unsubscribe from events
    if (this.unsubscribeConnectionStatus) {
      this.unsubscribeConnectionStatus();
    }
    
    // Disconnect from server
    disconnectFromServer();
    
    // Clean up components
    if (this.headerComponent) {
      this.headerComponent.destroy();
    }
    
    if (this.loginFormComponent) {
      this.loginFormComponent.destroy();
    }
    
    if (this.channelListComponent) {
      this.channelListComponent.destroy();
    }
    
    if (this.channelViewComponent) {
      this.channelViewComponent.destroy();
    }
    
    if (this.userListComponent) {
      this.userListComponent.destroy();
    }
    
    if (this.adminPanelComponent) {
      this.adminPanelComponent.destroy();
    }
    
    if (this.notificationSystem) {
      this.notificationSystem.destroy();
    }
    
    // Remove from DOM
    if (this.appElement && this.appElement.parentNode) {
      this.appElement.parentNode.removeChild(this.appElement);
    }
    
    // Log destruction
    logChatEvent('system', 'Application destroyed');
  }
}

export default AppContainer;