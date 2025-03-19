// chat/components/app/appcontainer/ContentRenderer.js
// Handles rendering of application content

import { isAuthenticated, getCurrentUser } from '../../../services/auth';
import LoginForm from '../../auth/LoginForm.js';
import Header from '../Header.js';
import { createCustomHeader } from './HeaderRenderer.js';
import { renderChatView } from './ChatViewRenderer.js'; 
import { renderAdminView } from './AdminViewRenderer.js';
import { renderSettingsView } from './SettingsViewRenderer.js';
import { applyStyles } from './StylesHelper.js';

/**
 * Render application content based on current state
 * @param {Object} appContainer - The AppContainer instance
 */
export function renderAppContent(appContainer) {
  try {
    console.log('Rendering application, authenticated:', isAuthenticated());
    
    if (!appContainer.appElement) return;
    
    // Clear existing content
    appContainer.appElement.innerHTML = '';
    
    // Check if authenticated
    const isUserAuthenticated = isAuthenticated();
    
    if (!isUserAuthenticated) {
      // Show login form when not authenticated
      appContainer.loginFormComponent = new LoginForm(appContainer.appElement, appContainer.handleLoginSuccess);
      return;
    }
    
    // Get current user
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser);
    
    // Validate current user
    if (!currentUser) {
      console.error('[AppContainer] No current user found');
      appContainer.handleLogout();
      return;
    }
    
    // Use the Header component or custom header
    let headerElement;
    try {
      // First try to use createCustomHeader from the appcontainer
      headerElement = createCustomHeader(null, {
        currentUser,
        connectionStatus: appContainer.connectionStatus,
        activeView: appContainer.currentView,
        onViewSwitch: appContainer.switchView,
        onToggleUserList: appContainer.toggleUserList,
        onLogout: appContainer.handleLogout
      });
    } catch (headerError) {
      console.warn('[AppContainer] Error using createCustomHeader, falling back to Header component:', headerError);
      
      // Fallback to using the Header component directly
      appContainer.headerComponent = new Header({
        user: currentUser,
        connectionStatus: appContainer.connectionStatus,
        activeView: appContainer.currentView,
        onViewSwitch: appContainer.switchView,
        onToggleUserList: appContainer.toggleUserList
      });
      headerElement = appContainer.headerComponent.render();
    }
    
    appContainer.appElement.appendChild(headerElement);
    
    // Create main content area based on current view
    const mainContent = document.createElement('div');
    mainContent.className = 'app-content';
    applyStyles(mainContent, {
      display: 'flex',
      flex: '1',
      overflow: 'hidden',
      backgroundColor: '#f5f7f9', // Light gray background
      width: '100%'
    });
    
    // Render the appropriate view
    try {
      if (appContainer.currentView === 'chat') {
        // Chat view - channels, messages, and users
        renderChatView(mainContent, {
          showUserList: appContainer.showUserList,
          selectedChannel: appContainer.selectedChannel,
          mockChannels: appContainer.mockData.channels,
          mockUsers: appContainer.mockData.users,
          onChannelSelect: appContainer.handleChannelSelect,
          onUserSelect: appContainer.handleUserSelect,
          toggleUserList: appContainer.toggleUserList
        });
      } else if (appContainer.currentView === 'admin') {
        // Admin view with management components
        renderAdminView(mainContent, {
          currentUser
        });
      } else if (appContainer.currentView === 'settings') {
        // Settings view
        renderSettingsView(mainContent, {
          onLogout: appContainer.handleLogout
        });
      }
    } catch (viewError) {
      console.error('[AppContainer] Error rendering view:', viewError);
      // Simple fallback content in case renderers fail
      mainContent.innerHTML = '<div style="padding: 20px; text-align: center;">Error loading view. Please try again.</div>';
    }
    
    appContainer.appElement.appendChild(mainContent);
  } catch (error) {
    console.error('[AppContainer] Render error:', error);
    appContainer.renderErrorState(error);
  }
}