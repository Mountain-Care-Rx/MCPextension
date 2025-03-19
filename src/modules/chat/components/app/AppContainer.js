// chat/components/app/AppContainer.js
// Main application container that orchestrates the chat application

import { getCurrentUser, isAuthenticated, logout } from '../../services/auth';
import { connectToServer, getConnectionStatus, addConnectionStatusListener } from '../../services/messageService.js';
import { logChatEvent } from '../../utils/logger.js';
import { initChat, isChatInitialized } from '../../index.js';
import NotificationSystem from './NotificationSystem.js';

// Import modular rendering components from appcontainer folder
import { createCustomHeader } from './appcontainer/HeaderRenderer.js';
import { renderChatView } from './appcontainer/ChatViewRenderer.js'; 
import { renderAdminView } from './appcontainer/AdminViewRenderer.js';
import { renderSettingsView } from './appcontainer/SettingsViewRenderer.js';

// Import from appcontainer modules
import { initializeAppContainer } from './appcontainer/AppInitializer.js';
import { handleConnectionStatusChange, handleLoginSuccess, 
         handleChannelSelect, handleUserSelect, switchView, 
         toggleUserList, handleLogout } from './appcontainer/EventHandler.js';
import { renderAppContent } from './appcontainer/ContentRenderer.js';
import { applyStyles } from './appcontainer/StylesHelper.js';

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
    this.connectionStatus = 'connected'; // Default to connected for demo
    this.currentView = 'chat'; // 'chat', 'admin', 'settings'
    this.showUserList = true;
    this.selectedChannel = 'general';
    
    // Mock data for rendering
    this.mockData = {};
    
    // Connection status listener unsubscribe function
    this.unsubscribeConnectionStatus = null;
    
    // Bind methods to this instance
    this.handleConnectionStatusChange = handleConnectionStatusChange.bind(this);
    this.handleLoginSuccess = handleLoginSuccess.bind(this);
    this.handleChannelSelect = handleChannelSelect.bind(this);
    this.handleUserSelect = handleUserSelect.bind(this);
    this.switchView = switchView.bind(this);
    this.toggleUserList = toggleUserList.bind(this);
    this.toggleChatVisibility = this.toggleChatVisibility.bind(this);
    this.handleLogout = handleLogout.bind(this);
    this.render = this.render.bind(this);
    this.renderErrorState = this.renderErrorState.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Initialize the container using the modular function
      const result = await initializeAppContainer(this);
      
      // Update container references from initialization
      this.container = result.container;
      this.appElement = result.appElement;
      
      // Get mock data
      this.mockData = result.mockData;
      
      // CRITICAL: Assign the toggle function to the global window object
      // This ensures it's accessible from the header bar's chat button
      // Use a regular function to preserve the correct 'this' context
      window.toggleChatUI = () => {
        this.toggleChatVisibility();
      };
      
      console.log('[CRM Extension] toggleChatUI registered globally', typeof window.toggleChatUI);
      
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
    } catch (error) {
      console.error('[AppContainer] Initialization error:', error);
      this.renderErrorState(error);
    }
  }
  
  /**
   * Method to toggle the visibility of the chat UI.
   * This method is exported to the global window object
   * to allow the header bar's chat button to access it.
   */
  toggleChatVisibility() {
    if (!this.container) {
      console.error('[CRM Extension] Cannot toggle chat: container is null');
      return;
    }
    
    console.log('[CRM Extension] toggleChatVisibility called');
    
    // Toggle display between 'none' and 'flex'
    const currentDisplay = this.container.style.display;
    const newDisplay = currentDisplay === 'none' || currentDisplay === '' ? 'flex' : 'none';
    this.container.style.display = newDisplay;
    
    // If we're showing the container, make sure its content is up to date
    if (newDisplay === 'flex') {
      this.render();
    }
    
    console.log(`[CRM Extension] Chat container toggled to: ${this.container.style.display}`);
  }
  
  /**
   * Render the application
   */
  render() {
    renderAppContent(this);
  }
  
  /**
   * Render error state
   * @param {Error} error - Initialization error
   */
  renderErrorState(error) {
    if (!this.appElement) return;
    
    this.appElement.innerHTML = '';
    
    const errorContainer = document.createElement('div');
    applyStyles(errorContainer, {
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
    applyStyles(errorIcon, {
      fontSize: '48px',
      marginBottom: '16px'
    });
    
    const errorTitle = document.createElement('h2');
    errorTitle.textContent = 'Application Initialization Failed';
    
    const errorMessage = document.createElement('p');
    errorMessage.textContent = error.message || 'An unexpected error occurred.';
    
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry';
    applyStyles(retryButton, {
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
    errorContainer.appendChild(retryButton);
    
    this.appElement.appendChild(errorContainer);
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
      
      // Clean up components
      if (this.notificationSystem) {
        this.notificationSystem.destroy();
      }
      
      // Remove from DOM
      if (this.appElement && this.appElement.parentNode) {
        this.appElement.parentNode.removeChild(this.appElement);
      }
      
      // Remove global reference
      if (typeof window.toggleChatUI === 'function') {
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