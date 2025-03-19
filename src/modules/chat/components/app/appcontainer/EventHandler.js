// chat/components/app/appcontainer/EventHandler.js
// Handles all event handlers for the application

import { connectToServer } from '../../../services/messageService.js';
import { logout } from '../../../services/auth';
import { logChatEvent } from '../../../utils/logger.js';
import LoginForm from '../../auth/LoginForm.js';

/**
 * Handle connection status change
 * @param {string} status - New connection status
 */
export function handleConnectionStatusChange(status) {
  try {
    this.connectionStatus = status;
    
    // Update UI
    this.render();
    
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
export function handleLoginSuccess(user) {
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
export function handleChannelSelect(channel) {
  try {
    console.log(`[AppContainer] Channel selected: ${channel.id}`);
    this.selectedChannel = channel.id;
    this.render();
  } catch (error) {
    console.error('[AppContainer] Channel selection error:', error);
  }
}

/**
 * Handle user selection for direct messages
 * @param {Object} user - Selected user
 */
export function handleUserSelect(user) {
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
export function switchView(view) {
  try {
    if (this.currentView !== view) {
      this.currentView = view;
      
      // Re-render the application
      this.render();
      
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
export function toggleUserList() {
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
export function handleLogout() {
  try {
    // Call logout service
    logout();
    
    // Reset application state
    this.currentView = 'chat';
    this.showUserList = true;
    this.selectedChannel = 'general';
    
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