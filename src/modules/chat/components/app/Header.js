// chat/components/app/Header.js
// Enhanced Header Component with User Status Integration

import { logout, getCurrentUser } from '../../services/auth';
import { UserStatus } from '../../services/userService.js';
import { logChatEvent } from '../../utils/logger.js';

/**
 * Header Component
 * Provides navigation, user info, and connection status with enhanced user status
 */
class Header {
  /**
   * Create a new Header
   * @param {Object} options - Header options
   */
  constructor(options = {}) {
    this.options = {
      user: null,
      connectionStatus: 'disconnected',
      activeView: 'chat',
      onViewSwitch: () => {},
      onToggleUserList: () => {},
      onToggleAdminPanel: () => {},
      ...options
    };
    
    // Component state
    this.headerElement = null;
    this.connectionIndicator = null;
    this.userStatusComponent = null;
    
    // Status colors mapping
    this.statusColors = {
      [UserStatus.ONLINE]: '#4CAF50',     // Green
      [UserStatus.AWAY]: '#FFC107',       // Yellow
      [UserStatus.BUSY]: '#F44336',       // Red
      [UserStatus.INVISIBLE]: '#9E9E9E'   // Gray
    };
    
    // Bind methods
    this.render = this.render.bind(this);
    this.updateConnectionStatus = this.updateConnectionStatus.bind(this);
    this.updateActiveView = this.updateActiveView.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.createUserAvatar = this.createUserAvatar.bind(this);
  }
  
  /**
   * Render the header
   * @returns {HTMLElement} The rendered header
   */
  render() {
    // Create header element
    this.headerElement = document.createElement('div');
    this.headerElement.className = 'hipaa-chat-header';
    this.applyStyles(this.headerElement, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: '60px',
      backgroundColor: '#2196F3',
      color: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    });
    
    // Create left section (title and nav)
    const leftSection = document.createElement('div');
    this.applyStyles(leftSection, {
      display: 'flex',
      alignItems: 'center'
    });
    
    // App title
    const title = document.createElement('h1');
    title.textContent = 'MCP Chat';
    this.applyStyles(title, {
      margin: '0 20px 0 0',
      fontSize: '18px',
      fontWeight: 'bold'
    });
    
    // Navigation links
    const nav = this.createNavigationLinks();
    
    // Add title and nav to left section
    leftSection.appendChild(title);
    leftSection.appendChild(nav);
    
    // Create center section (connection status)
    const centerSection = document.createElement('div');
    this.connectionIndicator = this.createConnectionIndicator(this.options.connectionStatus);
    centerSection.appendChild(this.connectionIndicator);
    
    // Create right section (user info and actions)
    const rightSection = document.createElement('div');
    this.applyStyles(rightSection, {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    });
    
    // User info container
    const userInfoContainer = document.createElement('div');
    this.applyStyles(userInfoContainer, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    });
    
    // Create and add user avatar
    const userAvatar = this.createUserAvatar();
    
    // Create user details
    const userDetails = this.createUserDetails();
    
    // Add avatar and details to user info container
    userInfoContainer.appendChild(userAvatar);
    userInfoContainer.appendChild(userDetails);
    
    // Toggle user list button
    const toggleUserListButton = this.createToggleUserListButton();
    
    // User menu dropdown
    const userMenu = this.createUserMenu();
    
    // Add elements to right section
    rightSection.appendChild(userInfoContainer);
    rightSection.appendChild(toggleUserListButton);
    rightSection.appendChild(userMenu);
    
    // Add sections to header
    this.headerElement.appendChild(leftSection);
    this.headerElement.appendChild(centerSection);
    this.headerElement.appendChild(rightSection);
    
    return this.headerElement;
  }
  
  /**
   * Create navigation links
   * @returns {HTMLElement} Navigation element
   */
  createNavigationLinks() {
    const nav = document.createElement('nav');
    this.applyStyles(nav, {
      display: 'flex',
      gap: '15px'
    });
    
    // Chat link
    const chatLink = this.createNavLink('Chat', this.options.activeView === 'chat', () => {
      this.options.onViewSwitch('chat');
    });
    
    // Admin link (only for admins)
    let adminLink = null;
    if (this.options.user && this.options.user.role === 'admin') {
      adminLink = this.createNavLink('Admin', this.options.activeView === 'admin', () => {
        this.options.onViewSwitch('admin');
      });
    }
    
    // Settings link
    const settingsLink = this.createNavLink('Settings', this.options.activeView === 'settings', () => {
      this.options.onViewSwitch('settings');
    });
    
    // Add links to nav
    nav.appendChild(chatLink);
    if (adminLink) nav.appendChild(adminLink);
    nav.appendChild(settingsLink);
    
    return nav;
  }
  
  /**
   * Create user avatar with status indicator
   * @returns {HTMLElement} User avatar element
   */
  createUserAvatar() {
    const user = this.options.user;
    if (!user) return document.createElement('div');
    
    const avatar = document.createElement('div');
    
    // Get user's current status
    const status = user.status || UserStatus.ONLINE;
    
    // Create avatar container
    this.applyStyles(avatar, {
      position: 'relative',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: this.generateAvatarColor(user.username),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px'
    });
    
    // Initial or first name
    const initial = (user.displayName || user.username || '?')[0].toUpperCase();
    avatar.textContent = initial;
    
    // Status indicator
    const statusIndicator = document.createElement('div');
    this.applyStyles(statusIndicator, {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: this.statusColors[status],
      border: '2px solid white'
    });
    
    avatar.appendChild(statusIndicator);
    
    return avatar;
  }
  
  /**
   * Generate a color based on username
   * @param {string} username - Username to generate color from
   * @returns {string} Generated color
   */
  generateAvatarColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }
  
  /**
   * Create user details
   * @returns {HTMLElement} User details element
   */
  createUserDetails() {
    const user = this.options.user;
    if (!user) return document.createElement('div');
    
    const detailsContainer = document.createElement('div');
    
    // Username or display name
    const name = document.createElement('div');
    name.textContent = user.displayName || user.username;
    this.applyStyles(name, {
      fontWeight: 'bold',
      fontSize: '14px'
    });
    
    // Status text
    const statusText = document.createElement('div');
    statusText.textContent = this.getStatusLabel(user.status);
    this.applyStyles(statusText, {
      fontSize: '12px',
      color: '#e0e0e0'
    });
    
    detailsContainer.appendChild(name);
    detailsContainer.appendChild(statusText);
    
    return detailsContainer;
  }
  
  /**
   * Get human-readable status label
   * @param {string} status - User status
   * @returns {string} Status label
   */
  getStatusLabel(status) {
    switch (status) {
      case UserStatus.ONLINE:
        return 'Available';
      case UserStatus.AWAY:
        return 'Away';
      case UserStatus.BUSY:
        return 'Do Not Disturb';
      case UserStatus.INVISIBLE:
        return 'Invisible';
      default:
        return 'Online';
    }
  }
  
  /**
   * Create toggle user list button
   * @returns {HTMLElement} Toggle user list button
   */
  createToggleUserListButton() {
    const toggleButton = document.createElement('button');
    toggleButton.title = 'Toggle Team Members';
    toggleButton.innerHTML = '👥';
    
    this.applyStyles(toggleButton, {
      background: 'transparent',
      border: 'none',
      color: 'white',
      fontSize: '20px',
      cursor: 'pointer',
      padding: '5px',
      borderRadius: '50%',
      transition: 'background-color 0.2s'
    });
    
    toggleButton.addEventListener('click', this.options.onToggleUserList);
    
    // Hover effects
    toggleButton.addEventListener('mouseover', () => {
      toggleButton.style.backgroundColor = 'rgba(255,255,255,0.2)';
    });
    
    toggleButton.addEventListener('mouseout', () => {
      toggleButton.style.backgroundColor = 'transparent';
    });
    
    return toggleButton;
  }
  
  /**
   * Create user menu with dropdown
   * @returns {HTMLElement} User menu element
   */
  createUserMenu() {
    const menuContainer = document.createElement('div');
    menuContainer.className = 'user-menu';
    this.applyStyles(menuContainer, {
      position: 'relative'
    });
    
    // Dropdown trigger
    const dropdownTrigger = document.createElement('button');
    this.applyStyles(dropdownTrigger, {
      background: 'transparent',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    });
    
    const moreIcon = document.createElement('span');
    moreIcon.textContent = '⋮';
    this.applyStyles(moreIcon, {
      fontSize: '20px'
    });
    
    dropdownTrigger.appendChild(moreIcon);
    
    // Dropdown menu
    const dropdownMenu = document.createElement('div');
    this.applyStyles(dropdownMenu, {
      display: 'none',
      position: 'absolute',
      top: '100%',
      right: '0',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      borderRadius: '4px',
      minWidth: '180px',
      zIndex: '1000',
      marginTop: '8px'
    });
    
    // Dropdown menu items
    const menuItems = [
      { 
        label: 'Profile', 
        icon: '👤', 
        action: () => console.log('Profile clicked') 
      },
      { 
        label: 'Settings', 
        icon: '⚙️', 
        action: () => this.options.onViewSwitch('settings') 
      },
      { 
        type: 'divider' 
      },
      { 
        label: 'Logout', 
        icon: '🚪', 
        action: this.handleLogout 
      }
    ];
    
    menuItems.forEach(item => {
      if (item.type === 'divider') {
        const divider = document.createElement('hr');
        this.applyStyles(divider, {
          margin: '8px 0',
          border: 'none',
          borderTop: '1px solid #e0e0e0'
        });
        dropdownMenu.appendChild(divider);
        return;
      }
      
      const menuItem = document.createElement('button');
      this.applyStyles(menuItem, {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        background: 'none',
        border: 'none',
        padding: '10px 16px',
        cursor: 'pointer',
        textAlign: 'left'
      });
      
      const icon = document.createElement('span');
      icon.textContent = item.icon;
      this.applyStyles(icon, {
        marginRight: '10px'
      });
      
      const label = document.createElement('span');
      label.textContent = item.label;
      
      menuItem.appendChild(icon);
      menuItem.appendChild(label);
      
      // Hover effects
      menuItem.addEventListener('mouseover', () => {
        menuItem.style.backgroundColor = '#f5f5f5';
      });
      
      menuItem.addEventListener('mouseout', () => {
        menuItem.style.backgroundColor = 'transparent';
      });
      
      menuItem.addEventListener('click', () => {
        item.action();
        dropdownMenu.style.display = 'none';
      });
      
      dropdownMenu.appendChild(menuItem);
    });
    
    // Toggle dropdown
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.style.display = 
        dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdownMenu.style.display = 'none';
    });
    
    menuContainer.appendChild(dropdownTrigger);
    menuContainer.appendChild(dropdownMenu);
    
    return menuContainer;
  }
  
  /**
   * Create a navigation link
   * @param {string} text - Link text
   * @param {boolean} active - Whether link is active
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} Nav link element
   */
  createNavLink(text, active, onClick) {
    const link = document.createElement('button');
    link.textContent = text;
    this.applyStyles(link, {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'white',
      padding: '5px 10px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 'bold' : 'normal',
      borderBottom: active ? '2px solid white' : 'none',
      transition: 'background-color 0.2s'
    });
    
    link.addEventListener('click', onClick);
    
    // Hover effects
    link.addEventListener('mouseover', () => {
      link.style.backgroundColor = 'rgba(255,255,255,0.2)';
    });
    
    link.addEventListener('mouseout', () => {
      link.style.backgroundColor = 'transparent';
    });
    
    return link;
  }
  
  /**
   * Create connection status indicator
   * @param {string} status - Connection status
   * @returns {HTMLElement} Status indicator element
   */
  createConnectionIndicator(status) {
    const statusColors = {
      connected: '#4CAF50',    // Green
      connecting: '#FFC107',   // Yellow
      disconnected: '#F44336', // Red
      error: '#F44336'         // Red
    };
    
    const statusText = {
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected',
      error: 'Connection Error'
    };
    
    const indicator = document.createElement('div');
    this.applyStyles(indicator, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '6px 12px'
    });
    
    // Status dot
    const statusDot = document.createElement('div');
    this.applyStyles(statusDot, {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: statusColors[status] || statusColors.error
    });
    
    // Status label
    const statusLabel = document.createElement('span');
    statusLabel.textContent = statusText[status] || 'Unknown';
    this.applyStyles(statusLabel, {
      fontSize: '12px',
      color: 'white'
    });
    
    indicator.appendChild(statusDot);
    indicator.appendChild(statusLabel);
    
    return indicator;
  }
  
  /**
   * Handle logout process
   */
  handleLogout() {
    try {
      // Log logout event
      logChatEvent('auth', 'User initiated logout');
      
      // Perform logout
      logout('User initiated logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  /**
   * Apply styles to an element
   * @param {HTMLElement} element - Element to style
   * @param {Object} styles - Styles to apply
   */
  applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }
  
  /**
   * Destroy the component
   */
  destroy() {
    // Remove from DOM
    if (this.headerElement && this.headerElement.parentNode) {
      this.headerElement.parentNode.removeChild(this.headerElement);
    }
    
    // Log destruction
    logChatEvent('ui', 'Header component destroyed');
  }
}

export default Header;