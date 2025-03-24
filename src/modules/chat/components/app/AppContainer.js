// chat/components/app/AppContainer.js
// Main application container that orchestrates the chat application

import { getCurrentUser, isAuthenticated, logout } from '../../services/auth';
import { 
  connectToServer, 
  getConnectionStatus, 
  addConnectionStatusListener,
  requestChannelList
} from '../../services/messageService.js';
import { 
  getAvailableChannels, 
  addChannelListListener 
} from '../../services/channel/channelService.js';
import { logChatEvent } from '../../utils/logger.js';
import { initChat, isChatInitialized } from '../../index.js';

import LoginForm from '../auth/LoginForm.js';
import NotificationSystem from './NotificationSystem.js';
import Header from './Header.js'; // Make sure Header is imported directly

// Import modular rendering components from appcontainer folder
import { createCustomHeader } from './appcontainer/HeaderRenderer.js';
import { renderChatView } from './appcontainer/ChatViewRenderer.js'; 
import { renderAdminView } from './appcontainer/AdminViewRenderer.js';
import { renderSettingsView } from './appcontainer/SettingsViewRenderer.js';

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
    this.notificationSystem = null;
    
    // Application state
    this.connectionStatus = 'disconnected'; // Start as disconnected until proven otherwise
    this.currentView = 'chat'; // 'chat', 'admin', 'settings'
    this.showUserList = true;
    this.selectedChannel = 'general';
    
    // Data state
    this.channels = [];
    this.users = [];
    this.messages = {};
    
    // Unsubscribe functions
    this.unsubscribeConnectionStatus = null;
    this.unsubscribeChannelList = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.handleConnectionStatusChange = this.handleConnectionStatusChange.bind(this);
    this.handleChannelListChange = this.handleChannelListChange.bind(this);
    this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
    this.handleChannelSelect = this.handleChannelSelect.bind(this);
    this.handleUserSelect = this.handleUserSelect.bind(this);
    this.switchView = this.switchView.bind(this);
    this.toggleUserList = this.toggleUserList.bind(this);
    this.toggleChatVisibility = this.toggleChatVisibility.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Create a wrapper div that will hold the chat window
      const wrapperDiv = document.createElement('div');
      wrapperDiv.className = 'hipaa-chat-wrapper';
      wrapperDiv.id = 'hipaa-chat-container';
      
      // Position the wrapper in the bottom-right corner of the viewport
      this.applyStyles(wrapperDiv, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999', // High z-index to appear above other elements
        width: '700px', // Fixed width for the chat window
        height: '500px', // Fixed height for the chat window
        boxSizing: 'border-box',
        display: 'none' // Start hidden by default
      });
      
      // If the existing container has a parent, replace it with our wrapper
      if (this.container && this.container.parentNode) {
        this.container.parentNode.replaceChild(wrapperDiv, this.container);
      } 
      // Otherwise, append the wrapper to the body
      else {
        document.body.appendChild(wrapperDiv);
      }
      
      // Use the wrapper as our new container
      this.container = wrapperDiv;
      
      // Create main app element
      this.appElement = document.createElement('div');
      this.appElement.className = 'hipaa-chat-app';
      this.applyStyles(this.appElement, {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        color: '#333',
        backgroundColor: '#fff'
      });
      
      // Add to container
      this.container.appendChild(this.appElement);
      
      
      // CRITICAL FIX: Assign the toggle function to the global window object
      // This ensures it's accessible from the header bar's chat button
      window.toggleChatUI = this.toggleChatVisibility;
      console.log('[CRM Extension] toggleChatUI registered globally', typeof window.toggleChatUI);
      
      // Initialize chat system if not already initialized
      if (!isChatInitialized()) {
        await initChat();
      }
      
      // Subscribe to connection status
      this.unsubscribeConnectionStatus = addConnectionStatusListener(this.handleConnectionStatusChange);
      
      // Subscribe to channel list changes
      this.unsubscribeChannelList = addChannelListListener(this.handleChannelListChange);
      
      // Get initial connection status
      this.connectionStatus = getConnectionStatus();
      
      // Initialize notification system
      this.notificationSystem = new NotificationSystem();
      
      // Connect to server if already authenticated
      if (isAuthenticated()) {
        // Connect to WebSocket server
        await connectToServer();
        
        // Request initial channel list after connection
        setTimeout(() => {
          if (this.connectionStatus === 'connected') {
            requestChannelList();
          }
        }, 1000);
      }
      
      // Render initial state
      this.render();
      
      // Log initialization
      logChatEvent('system', 'Application initialized');
    } catch (error) {
      console.error('[AppContainer] Initialization error:', error);
      this.renderErrorState(error);
    }
  }
  
  /**
   * Handle channel list changes
   * @param {Array} channels - Updated channel list
   */
  handleChannelListChange(channels) {
    console.log('[AppContainer] Channel list updated:', channels);
    this.channels = channels || [];
    
    // Refresh the UI to show updated channels
    this.render();
  }
  
  /**
   * Method to toggle the visibility of the chat UI.
   * This method is exported to the global window object
   * to allow the header bar's chat button to access it.
   */
  toggleChatVisibility() {
    if (!this.container) return;
    
    console.log('[CRM Extension] toggleChatVisibility called');
    
    // Toggle display between 'none' and 'flex'
    const currentDisplay = this.container.style.display;
    const newDisplay = currentDisplay === 'none' || currentDisplay === '' ? 'flex' : 'none';
    this.container.style.display = newDisplay;
    
    // If we're showing the container, make sure its content is up to date
    if (newDisplay === 'flex') {
      this.render();
      
      // If authenticated and connected, refresh channel list
      if (isAuthenticated() && this.connectionStatus === 'connected') {
        requestChannelList();
      }
    }
    
    console.log(`[CRM Extension] Chat container toggled to: ${this.container.style.display}`);
  }
  
  /**
   * Handle connection status change
   * @param {string} status - New connection status
   */
  handleConnectionStatusChange(status) {
    try {
      console.log('[AppContainer] Connection status changed:', status);
      this.connectionStatus = status;
      
      // If we just connected, request channel list
      if (status === 'connected' && isAuthenticated()) {
        requestChannelList();
      }
      
      // Update UI
      this.render();
      
      // Show notification for connection changes
      if (this.notificationSystem) {
        if (status === 'connected') {
          this.notificationSystem.showSuccess('Connected to chat server');
        } else if (status === 'disconnected' || status === 'error') {
          this.notificationSystem.showError(`Disconnected from chat server: ${status}`);
        }
      }
      
      // Log status change
      logChatEvent('system', `Connection status changed: ${status}`);
    } catch (error) {
      console.error('[AppContainer] Connection status change error:', error);
    }
  }
  
  /**
   * Handle successful login
   * @param {Object} user - Logged in user
   */
  handleLoginSuccess(user) {
    try {
      console.log('[AppContainer] Login success handler called', user);
      
      // Validate user object
      if (!user || !user.username) {
        console.error('[AppContainer] Invalid user object received');
        return;
      }
      
      // Connect to server
      connectToServer();
      
      // Render main UI
      this.render();
      
      // Log successful login
      logChatEvent('auth', 'User logged in successfully', { 
        username: user.username,
        userId: user.id,
        role: user.role 
      });
    } catch (error) {
      console.error('[AppContainer] Login success handler error:', error);
      alert('An error occurred during login. Please try again.');
    }
  }
  
  /**
   * Handle channel selection
   * @param {Object} channel - Selected channel
   */
  handleChannelSelect(channel) {
    try {
      console.log(`[AppContainer] Channel selected:`, channel);
      this.selectedChannel = channel.id || channel;
      this.render();
      
      // Log channel selection
      logChatEvent('ui', 'Selected channel', { 
        channelId: this.selectedChannel 
      });
    } catch (error) {
      console.error('[AppContainer] Channel selection error:', error);
    }
  }
  
  /**
   * Handle user selection for direct messages
   * @param {Object} user - Selected user
   */
  handleUserSelect(user) {
    try {
      // TODO: Implement direct messaging
      console.log(`[AppContainer] Selected user for direct message: ${user.username}`);
      
      // Log user selection
      logChatEvent('ui', 'Selected user for direct message', { targetUser: user.username });
    } catch (error) {
      console.error('[AppContainer] User selection error:', error);
    }
  }
  
  /**
   * Switch between application views
   * @param {string} view - View to switch to ('chat', 'admin', 'settings')
   */
  switchView(view) {
    try {
      if (this.currentView !== view) {
        this.currentView = view;
        
        // Re-render the application
        this.render();
        
        // If switching to admin view, refresh channels and users
        if (view === 'admin' && this.connectionStatus === 'connected') {
          requestChannelList();
        }
        
        // Log view change
        logChatEvent('ui', `Switched to ${view} view`);
      }
    } catch (error) {
      console.error('[AppContainer] View switch error:', error);
    }
  }
  
  /**
   * Toggle user list visibility
   */
  toggleUserList() {
    try {
      this.showUserList = !this.showUserList;
      this.render();
      
      // Log toggle
      logChatEvent('ui', `${this.showUserList ? 'Showed' : 'Hid'} user list`);
    } catch (error) {
      console.error('[AppContainer] Toggle user list error:', error);
    }
  }
  
  /**
   * Handle logout process
   */
  handleLogout() {
    try {
      // Call logout service
      logout();
      
      // Reset application state
      this.currentView = 'chat';
      this.showUserList = true;
      this.selectedChannel = 'general';
      this.channels = [];
      
      // Log logout event
      logChatEvent('auth', 'User logged out');
      
      // Clear the app element content
      if (this.appElement) {
        this.appElement.innerHTML = '';
      }
      
      // Render login form
      this.loginFormComponent = new LoginForm(this.appElement, this.handleLoginSuccess);
    } catch (error) {
      console.error('[AppContainer] Logout error:', error);
    }
  }
  
  /**
   * Render the application
   */
  render() {
    try {
      console.log('Rendering application, authenticated:', isAuthenticated(), 'connection:', this.connectionStatus);
      
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
      console.log('Current user:', currentUser);
      
      // Validate current user
      if (!currentUser) {
        console.error('[AppContainer] No current user found');
        this.handleLogout();
        return;
      }
      
      // Use the Header component or custom header
      let headerElement;
      try {
        // First try to use createCustomHeader from the appcontainer
        headerElement = createCustomHeader(null, {
          currentUser,
          connectionStatus: this.connectionStatus,
          activeView: this.currentView,
          onViewSwitch: this.switchView,
          onToggleUserList: this.toggleUserList,
          onLogout: this.handleLogout
        });
      } catch (headerError) {
        console.warn('[AppContainer] Error using createCustomHeader, falling back to Header component:', headerError);
        
        // Fallback to using the Header component directly
        this.headerComponent = new Header({
          user: currentUser,
          connectionStatus: this.connectionStatus,
          activeView: this.currentView,
          onViewSwitch: this.switchView,
          onToggleUserList: this.toggleUserList
        });
        headerElement = this.headerComponent.render();
      }
      
      this.appElement.appendChild(headerElement);
      
      // Create main content area based on current view
      const mainContent = document.createElement('div');
      mainContent.className = 'app-content';
      this.applyStyles(mainContent, {
        display: 'flex',
        flex: '1',
        overflow: 'hidden',
        backgroundColor: '#f5f7f9', // Light gray background
        width: '100%'
      });
      
      // Render the appropriate view
      try {
        if (this.currentView === 'chat') {
          // Chat view - channels, messages, and users
          renderChatView(mainContent, {
            showUserList: this.showUserList,
            selectedChannel: this.selectedChannel,
            channels: this.channels,
            users: this.users,
            connectionStatus: this.connectionStatus,
            onChannelSelect: this.handleChannelSelect,
            onUserSelect: this.handleUserSelect,
            toggleUserList: this.toggleUserList
          });
        } else if (this.currentView === 'admin') {
          // Admin view with management components
          renderAdminView(mainContent, {
            currentUser,
            channels: this.channels,
            connectionStatus: this.connectionStatus
          });
        } else if (this.currentView === 'settings') {
          // Settings view
          renderSettingsView(mainContent, {
            onLogout: this.handleLogout,
            connectionStatus: this.connectionStatus
          });
        }
      } catch (viewError) {
        console.error('[AppContainer] Error rendering view:', viewError);
        // Simple fallback content in case renderers fail
        mainContent.innerHTML = `<div style="padding: 20px; text-align: center;">
          Error loading view: ${viewError.message}<br>
          Connection status: ${this.connectionStatus}<br>
          Please try again or refresh the page.
        </div>`;
      }
      
      this.appElement.appendChild(mainContent);
      
      // Display connection status if not connected
      if (this.connectionStatus !== 'connected') {
        this.renderConnectionStatus();
      }
    } catch (error) {
      console.error('[AppContainer] Render error:', error);
      this.renderErrorState(error);
    }
  }
  
  /**
   * Render connection status overlay
   */
  renderConnectionStatus() {
    if (!this.appElement) return;
    
    // Create status overlay
    const statusOverlay = document.createElement('div');
    this.applyStyles(statusOverlay, {
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      right: '10px',
      padding: '10px 15px',
      backgroundColor: this.connectionStatus === 'connecting' ? '#fff3cd' : '#f8d7da',
      color: this.connectionStatus === 'connecting' ? '#856404' : '#721c24',
      borderRadius: '4px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      zIndex: '100',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    });
    
    // Create status message
    const statusMessage = document.createElement('div');
    
    // Set message based on status
    if (this.connectionStatus === 'connecting') {
      statusMessage.textContent = 'Connecting to chat server...';
    } else if (this.connectionStatus === 'disconnected') {
      statusMessage.textContent = 'Disconnected from chat server. Attempting to reconnect...';
    } else if (this.connectionStatus === 'error') {
      statusMessage.textContent = 'Error connecting to chat server. Please check your network connection.';
    } else if (this.connectionStatus === 'auth_failed') {
      statusMessage.textContent = 'Authentication failed. Please try logging in again.';
    }
    
    // Create retry button
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry Connection';
    this.applyStyles(retryButton, {
      padding: '5px 10px',
      backgroundColor: '#ffffff',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: '10px'
    });
    
    retryButton.addEventListener('click', () => {
      // Try to reconnect
      connectToServer();
    });
    
    // Add elements to overlay
    statusOverlay.appendChild(statusMessage);
    statusOverlay.appendChild(retryButton);
    
    // Add overlay to app
    this.appElement.appendChild(statusOverlay);
  }
  
  /**
   * Render error state
   * @param {Error} error - Initialization error
   */
  renderErrorState(error) {
    if (!this.appElement) return;
    
    this.appElement.innerHTML = '';
    
    const errorContainer = document.createElement('div');
    this.applyStyles(errorContainer, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f8d7da',
      color: '#721c24'
    });
    
    const errorIcon = document.createElement('div');
    errorIcon.textContent = '⚠️';
    this.applyStyles(errorIcon, {
      fontSize: '48px',
      marginBottom: '16px'
    });
    
    const errorTitle = document.createElement('h2');
    errorTitle.textContent = 'Application Initialization Failed';
    
    const errorMessage = document.createElement('p');
    errorMessage.textContent = error.message || 'An unexpected error occurred.';
    
    const errorDetails = document.createElement('pre');
    this.applyStyles(errorDetails, {
      maxWidth: '100%',
      overflow: 'auto',
      textAlign: 'left',
      padding: '10px',
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: '4px',
      fontSize: '12px',
      marginTop: '10px'
    });
    errorDetails.textContent = `Connection Status: ${this.connectionStatus}
Stack: ${error.stack || 'No stack trace available'}`;
    
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry';
    this.applyStyles(retryButton, {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      marginTop: '16px',
      cursor: 'pointer'
    });
    
    retryButton.addEventListener('click', () => this.initialize());
    
    errorContainer.appendChild(errorIcon);
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorMessage);
    errorContainer.appendChild(errorDetails);
    errorContainer.appendChild(retryButton);
    
    this.appElement.appendChild(errorContainer);
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
    try {
      // Unsubscribe from events
      if (this.unsubscribeConnectionStatus) {
        this.unsubscribeConnectionStatus();
      }
      
      if (this.unsubscribeChannelList) {
        this.unsubscribeChannelList();
      }
      
      // Clean up components
      if (this.notificationSystem) {
        this.notificationSystem.destroy();
      }
      
      // Remove from DOM
      if (this.appElement && this.appElement.parentNode) {
        this.appElement.parentNode.removeChild(this.appElement);
      }
      
      // Remove global reference
      if (window.toggleChatUI === this.toggleChatVisibility) {
        delete window.toggleChatUI;
      }
      
      // Log destruction
      logChatEvent('system', 'Application destroyed');
    } catch (error) {
      console.error('[AppContainer] Destruction error:', error);
    }
  }
}

export default AppContainer;