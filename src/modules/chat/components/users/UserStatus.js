// chat/components/users/UserStatus.js
// User Status Component for HIPAA-compliant chat

import { getCurrentUser, isAuthenticated } from '../../services/auth';
import { 
  setUserStatus, 
  addUserStatusListener, 
  UserStatus as UserStatusConstants 
} from '../../services/userService.js';
import { logChatEvent } from '../../utils/logger.js';

class UserStatus {
  /**
   * Create a new UserStatus component
   * @param {HTMLElement} container - Container to render into
   * @param {Object} options - Component options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showStatusText: true,
      enableStatusChange: true,
      ...options
    };
    
    // Component state
    this.statusElement = null;
    this.statusMenuOpen = false;
    
    // Status options with detailed information
    this.statusOptions = [
      { 
        value: UserStatusConstants.ONLINE, 
        label: 'Available', 
        icon: '🟢',
        description: 'Ready to chat and collaborate'
      },
      { 
        value: UserStatusConstants.AWAY, 
        label: 'Away', 
        icon: '🟡',
        description: 'Temporarily unavailable'
      },
      { 
        value: UserStatusConstants.BUSY, 
        label: 'Do Not Disturb', 
        icon: '🔴',
        description: 'Focusing on work, minimizing interruptions'
      },
      { 
        value: UserStatusConstants.INVISIBLE, 
        label: 'Invisible', 
        icon: '⚫',
        description: 'Appear offline to other users'
      }
    ];
    
    // Unsubscribe function for user status listener
    this.unsubscribeStatusListener = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.toggleStatusMenu = this.toggleStatusMenu.bind(this);
    this.handleStatusSelect = this.handleStatusSelect.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the status component
   */
  initialize() {
    // Validate container
    if (!this.container) {
      console.warn('[UserStatus] No container provided');
      return;
    }
    
    // Create status element
    this.statusElement = document.createElement('div');
    this.statusElement.className = 'user-status-container';
    this.applyStyles(this.statusElement, {
      position: 'relative',
      display: 'inline-block'
    });
    
    // Add to container
    this.container.appendChild(this.statusElement);
    
    // Set up user status listener
    this.setupUserStatusListener();
    
    // Initial render
    this.render();
    
    // Add click outside handler
    document.addEventListener('click', this.handleClickOutside);
    
    // Log initialization
    logChatEvent('ui', 'User status component initialized');
  }
  
  /**
   * Set up listener for user status updates
   */
  setupUserStatusListener() {
    try {
      // Ensure we're not creating multiple listeners
      if (this.unsubscribeStatusListener) {
        this.unsubscribeStatusListener();
      }
      
      // Subscribe to user status updates
      this.unsubscribeStatusListener = addUserStatusListener(users => {
        // Find current user's status
        const currentUser = getCurrentUser();
        if (currentUser) {
          const userStatus = users.find(u => u.id === currentUser.id);
          if (userStatus && userStatus.status) {
            this.render();
          }
        }
      });
    } catch (error) {
      console.error('[UserStatus] Error setting up status listener:', error);
    }
  }
  
  /**
   * Render the status component
   */
  render() {
    // Clear existing content
    if (this.statusElement) {
      this.statusElement.innerHTML = '';
    }
    
    // Check authentication
    if (!isAuthenticated()) {
      return;
    }
    
    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Determine current status
    const currentStatus = currentUser.status || UserStatusConstants.ONLINE;
    const selectedStatus = this.statusOptions.find(
      status => status.value === currentStatus
    ) || this.statusOptions[0];
    
    // Create status button
    const statusButton = this.createStatusButton(selectedStatus);
    
    // Add status menu if enabled and menu is open
    if (this.statusMenuOpen && this.options.enableStatusChange) {
      const statusMenu = this.createStatusMenu(currentStatus);
      this.statusElement.appendChild(statusMenu);
    }
    
    this.statusElement.appendChild(statusButton);
  }
  
  /**
   * Create status button
   * @param {Object} status - Selected status object
   * @returns {HTMLElement} Status button element
   */
  createStatusButton(status) {
    const button = document.createElement('button');
    button.className = 'status-button';
    this.applyStyles(button, {
      display: 'flex',
      alignItems: 'center',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px'
    });
    
    // Status icon
    const icon = document.createElement('span');
    icon.textContent = status.icon;
    this.applyStyles(icon, {
      marginRight: this.options.showStatusText ? '6px' : '0',
      fontSize: '16px'
    });
    
    button.appendChild(icon);
    
    // Status text (optional)
    if (this.options.showStatusText) {
      const text = document.createElement('span');
      text.textContent = status.label;
      this.applyStyles(text, {
        fontSize: '14px'
      });
      button.appendChild(text);
    }
    
    // Toggle menu on click
    button.addEventListener('click', this.toggleStatusMenu);
    
    // Hover effects
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = 'rgba(0,0,0,0.05)';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = 'transparent';
    });
    
    return button;
  }
  
  /**
   * Create status menu
   * @param {string} currentStatus - Current user status
   * @returns {HTMLElement} Status menu element
   */
  createStatusMenu(currentStatus) {
    const menu = document.createElement('div');
    menu.className = 'status-menu';
    this.applyStyles(menu, {
      position: 'absolute',
      top: '100%',
      right: '0',
      width: '250px',
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: '1000',
      padding: '8px',
      marginTop: '4px'
    });
    
    // Create status options
    this.statusOptions.forEach(status => {
      const statusItem = this.createStatusMenuItem(status, currentStatus);
      menu.appendChild(statusItem);
    });
    
    return menu;
  }
  
  /**
   * Create individual status menu item
   * @param {Object} status - Status option
   * @param {string} currentStatus - Current user status
   * @returns {HTMLElement} Status menu item
   */
  createStatusMenuItem(status, currentStatus) {
    const item = document.createElement('div');
    item.className = `status-menu-item ${status.value === currentStatus ? 'active' : ''}`;
    this.applyStyles(item, {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      cursor: 'pointer',
      borderRadius: '4px',
      backgroundColor: status.value === currentStatus ? 'rgba(33,150,243,0.1)' : 'transparent'
    });
    
    // Status icon
    const icon = document.createElement('span');
    icon.textContent = status.icon;
    this.applyStyles(icon, {
      marginRight: '12px',
      fontSize: '16px'
    });
    
    // Status details container
    const details = document.createElement('div');
    this.applyStyles(details, {
      display: 'flex',
      flexDirection: 'column'
    });
    
    // Status label
    const label = document.createElement('span');
    label.textContent = status.label;
    this.applyStyles(label, {
      fontWeight: 'bold',
      fontSize: '14px'
    });
    
    // Status description
    const description = document.createElement('span');
    description.textContent = status.description;
    this.applyStyles(description, {
      fontSize: '12px',
      color: '#666'
    });
    
    details.appendChild(label);
    details.appendChild(description);
    
    item.appendChild(icon);
    item.appendChild(details);
    
    // Add click handler
    item.addEventListener('click', () => this.handleStatusSelect(status.value));
    
    // Hover effects
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = 'rgba(0,0,0,0.05)';
    });
    
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = 
        status.value === currentStatus ? 'rgba(33,150,243,0.1)' : 'transparent';
    });
    
    return item;
  }
  
  /**
   * Toggle status menu
   * @param {Event} e - Click event
   */
  toggleStatusMenu(e) {
    e.stopPropagation();
    this.statusMenuOpen = !this.statusMenuOpen;
    this.render();
  }
  
  /**
   * Handle status selection
   * @param {string} status - Selected status
   */
  handleStatusSelect(status) {
    try {
      // Close menu
      this.statusMenuOpen = false;
      
      // Update status via service
      setUserStatus(status);
      
      // Update local render
      this.render();
      
      // Log status change
      logChatEvent('ui', 'User status changed', { status });
    } catch (error) {
      console.error('[UserStatus] Error changing status:', error);
    }
  }
  
  /**
   * Handle clicks outside the component
   * @param {Event} e - Click event
   */
  handleClickOutside(e) {
    if (this.statusElement && 
        !this.statusElement.contains(e.target) && 
        this.statusMenuOpen) {
      this.statusMenuOpen = false;
      this.render();
    }
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
   * Cleanup resources
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('click', this.handleClickOutside);
    
    // Unsubscribe from status updates
    if (this.unsubscribeStatusListener) {
      this.unsubscribeStatusListener();
    }
    
    // Remove from DOM
    if (this.statusElement && this.statusElement.parentNode) {
      this.statusElement.parentNode.removeChild(this.statusElement);
    }
    
    // Log destruction
    logChatEvent('ui', 'User status component destroyed');
  }
}

export default UserStatus;