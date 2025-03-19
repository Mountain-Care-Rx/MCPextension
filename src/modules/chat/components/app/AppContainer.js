// chat/components/app/AppContainer.js
// Main application container for HIPAA-compliant chat with enhanced UI

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

// Header bar colors
const HEADER_COLORS = {
  primary: '#343a40',      // Dark gray/blue - main header color
  secondary: '#3a444f',    // Slightly lighter shade for hover effects
  text: '#ffffff',         // White text
  accent: '#2196F3'        // Blue accent color
};

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
    this.connectionStatus = 'connected'; // Default to connected for demo
    this.currentView = 'chat'; // 'chat', 'admin', 'settings'
    this.showUserList = true;
    this.selectedChannel = 'general';
    
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
    this.toggleChatVisibility = this.toggleChatVisibility.bind(this);
    
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
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    });
    
    // Add to container
    if (this.container) {
      this.container.appendChild(this.appElement);
    }
    
    // Mock data for demo
    this.setupMockData();
    
    // Assign the toggle function to a global variable so the chat button can call it
    window.toggleChatUI = this.toggleChatVisibility;
    
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
   * Set up mock data for demo
   */
  setupMockData() {
    // Mock channels
    this.mockChannels = [
      { id: 'general', name: 'General', type: 'public', unread: 0 },
      { id: 'announcements', name: 'Announcements', type: 'public', unread: 2 },
      { id: 'support', name: 'Support', type: 'public', unread: 0 },
      { id: 'billing', name: 'Billing', type: 'private', unread: 3 }
    ];
    
    // Mock team members
    this.mockUsers = [
      { id: 'user1', username: 'john.doe', displayName: 'John Doe', status: 'online' },
      { id: 'user2', username: 'jane.smith', displayName: 'Jane Smith', status: 'away' },
      { id: 'user3', username: 'admin', displayName: 'Admin', status: 'online' },
      { id: 'user4', username: 'support', displayName: 'Support Team', status: 'dnd' }
    ];
    
    // Mock messages for general channel
    this.mockMessages = {
      general: [
        {
          id: 'msg1',
          sender: 'john.doe',
          senderDisplayName: 'John Doe',
          text: 'Hello team! How is everyone doing today?',
          timestamp: '2023-04-15T09:30:00Z'
        },
        {
          id: 'msg2',
          sender: 'jane.smith',
          senderDisplayName: 'Jane Smith',
          text: 'Hi John! Going well here, working on the new reports.',
          timestamp: '2023-04-15T09:32:00Z'
        },
        {
          id: 'msg3',
          sender: 'admin',
          senderDisplayName: 'Admin',
          text: 'Good morning everyone! Just a reminder about the team meeting at 2 PM today.',
          timestamp: '2023-04-15T09:35:00Z'
        },
        {
          id: 'msg4',
          sender: 'john.doe',
          senderDisplayName: 'John Doe',
          text: 'Thanks for the reminder! Ill prepare my updates.',
          timestamp: '2023-04-15T09:36:00Z'
        }
      ],
      announcements: [
        {
          id: 'ann1',
          sender: 'admin',
          senderDisplayName: 'Admin',
          text: 'Important: System maintenance scheduled for this weekend. Please save all your work by Friday 5 PM.',
          timestamp: '2023-04-14T15:00:00Z'
        },
        {
          id: 'ann2',
          sender: 'admin',
          senderDisplayName: 'Admin',
          text: 'New feature release: You can now export reports directly to PDF. Check the documentation for details.',
          timestamp: '2023-04-13T11:00:00Z'
        }
      ]
    };
  }
  
  /**
   * Method to toggle the visibility of the chat UI.
   */
  toggleChatVisibility() {
    if (!this.appElement) return;
    // Toggle display between 'none' and 'flex'
    if (this.appElement.style.display === 'none') {
      this.appElement.style.display = 'flex';
    } else {
      this.appElement.style.display = 'none';
    }
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
    console.log(`[CRM Extension] Channel selected: ${channel.id}`);
    this.selectedChannel = channel.id;
    this.render();
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
    
    // Create custom header for Mountain Care Pharmacy
    this.createCustomHeader(currentUser);
    
    // Create main content area based on current view
    const mainContent = document.createElement('div');
    mainContent.className = 'app-content';
    this.applyStyles(mainContent, {
      display: 'flex',
      flex: '1',
      overflow: 'hidden',
      backgroundColor: '#f5f7f9' // Light gray background
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
   * Create custom header for Mountain Care Pharmacy
   * @param {Object} currentUser - Current user object
   */
  createCustomHeader(currentUser) {
    const header = document.createElement('div');
    header.className = 'mcp-chat-header';
    this.applyStyles(header, {
      backgroundColor: HEADER_COLORS.primary,
      color: HEADER_COLORS.text,
      padding: '0 16px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
      borderBottom: `1px solid ${HEADER_COLORS.secondary}`
    });

    // Left section: Logo and title
    const leftSection = document.createElement('div');
    this.applyStyles(leftSection, {
      display: 'flex',
      alignItems: 'center'
    });

    // Logo icon
    const logoIcon = document.createElement('span');
    logoIcon.textContent = '💬';
    this.applyStyles(logoIcon, {
      fontSize: '20px',
      marginRight: '8px'
    });

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Mountain Care';
    this.applyStyles(title, {
      margin: '0',
      fontSize: '16px',
      fontWeight: 'bold'
    });

    leftSection.appendChild(logoIcon);
    leftSection.appendChild(title);

    // Center section: Navigation tabs
    const centerSection = document.createElement('div');
    this.applyStyles(centerSection, {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '20px'
    });

    // Chat tab
    const chatTab = this.createNavTab('Chat', this.currentView === 'chat', () => this.switchView('chat'));
    centerSection.appendChild(chatTab);

    // Settings tab
    const settingsTab = this.createNavTab('Settings', this.currentView === 'settings', () => this.switchView('settings'));
    centerSection.appendChild(settingsTab);

    // Admin tab (only for admins)
    if (currentUser && currentUser.role === 'admin') {
      const adminTab = this.createNavTab('Admin', this.currentView === 'admin', () => this.switchView('admin'));
      centerSection.appendChild(adminTab);
    }

    // Right section: Connection status and user info
    const rightSection = document.createElement('div');
    this.applyStyles(rightSection, {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    });

    // Connection status indicator
    const connectionStatus = this.createConnectionIndicator(this.connectionStatus);
    
    // User avatar and name
    const userInfo = this.createUserInfo(currentUser);
    
    rightSection.appendChild(connectionStatus);
    rightSection.appendChild(userInfo);

    // Add all sections to header
    header.appendChild(leftSection);
    header.appendChild(centerSection);
    header.appendChild(rightSection);

    this.appElement.appendChild(header);
  }

  /**
   * Create a navigation tab
   * @param {string} text - Tab text
   * @param {boolean} active - Whether tab is active
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} Tab element
   */
  createNavTab(text, active, onClick) {
    const tab = document.createElement('button');
    tab.textContent = text;
    this.applyStyles(tab, {
      backgroundColor: 'transparent',
      border: 'none',
      color: active ? '#fff' : 'rgba(255, 255, 255, 0.7)',
      padding: '8px 16px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 'bold' : 'normal',
      borderBottom: active ? '2px solid #fff' : 'none'
    });

    tab.addEventListener('mouseover', () => {
      if (!active) {
        tab.style.color = 'rgba(255, 255, 255, 0.9)';
      }
    });

    tab.addEventListener('mouseout', () => {
      if (!active) {
        tab.style.color = 'rgba(255, 255, 255, 0.7)';
      }
    });

    tab.addEventListener('click', onClick);
    return tab;
  }

  /**
   * Create connection status indicator
   * @param {string} status - Connection status
   * @returns {HTMLElement} Status indicator element
   */
  createConnectionIndicator(status) {
    const statusColors = {
      connected: '#4CAF50', // Green
      connecting: '#FFC107', // Yellow
      disconnected: '#F44336', // Red
      error: '#F44336' // Red
    };

    const statusText = {
      connected: 'Online',
      connecting: 'Connecting...',
      disconnected: 'Offline',
      error: 'Error'
    };

    const indicator = document.createElement('div');
    indicator.className = 'connection-indicator';
    this.applyStyles(indicator, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      padding: '4px 8px',
      borderRadius: '12px',
      backgroundColor: 'rgba(0, 0, 0, 0.2)'
    });

    const statusDot = document.createElement('span');
    this.applyStyles(statusDot, {
      display: 'inline-block',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: statusColors[status] || '#F44336'
    });

    const statusLabel = document.createElement('span');
    statusLabel.textContent = statusText[status] || 'Unknown';

    indicator.appendChild(statusDot);
    indicator.appendChild(statusLabel);

    return indicator;
  }

  /**
   * Create user info display
   * @param {Object} user - User object
   * @returns {HTMLElement} User info element
   */
  createUserInfo(user) {
    const userInfo = document.createElement('div');
    this.applyStyles(userInfo, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer'
    });

    // User avatar
    const avatar = document.createElement('div');
    const initial = user?.username?.charAt(0)?.toUpperCase() || '?';
    avatar.textContent = initial;
    this.applyStyles(avatar, {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px'
    });

    // Username
    const username = document.createElement('span');
    username.textContent = user?.displayName || user?.username || 'User';
    this.applyStyles(username, {
      fontWeight: 'medium',
      fontSize: '14px'
    });

    userInfo.appendChild(avatar);
    userInfo.appendChild(username);

    // Add dropdown menu for logout, etc.
    userInfo.addEventListener('click', () => {
      // TODO: Implement user menu dropdown
      console.log('User menu clicked');
    });

    return userInfo;
  }
  
  /**
   * Render the chat view
   * @param {HTMLElement} container - Container element
   */
  renderChatView(container) {
    // Create layout with a flexible 3-panel design
    const layout = document.createElement('div');
    this.applyStyles(layout, {
      display: 'flex',
      width: '100%',
      height: '100%'
    });
    
    // Create sidebar for channels
    const sidebarWidth = '220px';
    const sidebar = this.createSidebar(sidebarWidth);
    
    // Create main content area for chat
    const chatArea = this.createChatArea();
    
    // Create collapsible users panel
    const userPanel = this.createUserPanel();
    
    // Add all panels to layout
    layout.appendChild(sidebar);
    layout.appendChild(chatArea);
    
    if (this.showUserList) {
      layout.appendChild(userPanel);
    }
    
    container.appendChild(layout);
  }
  
  /**
   * Create sidebar with channels
   * @param {string} width - Sidebar width
   * @returns {HTMLElement} Sidebar element
   */
  createSidebar(width) {
    const sidebar = document.createElement('div');
    this.applyStyles(sidebar, {
      width: width,
      minWidth: width,
      height: '100%',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa'
    });
    
    // Sidebar header
    const sidebarHeader = document.createElement('div');
    this.applyStyles(sidebarHeader, {
      padding: '16px',
      borderBottom: '1px solid #e0e0e0',
      fontWeight: 'bold',
      fontSize: '16px'
    });
    sidebarHeader.textContent = 'Channels';
    
    // Channels container
    const channelsContainer = document.createElement('div');
    this.applyStyles(channelsContainer, {
      flex: '1',
      overflowY: 'auto',
      padding: '8px 0'
    });
    
    // Add channel groups
    this.addChannelGroup(channelsContainer, 'PUBLIC CHANNELS', 
      this.mockChannels.filter(channel => channel.type === 'public'));
    
    this.addChannelGroup(channelsContainer, 'PRIVATE CHANNELS', 
      this.mockChannels.filter(channel => channel.type === 'private'));
    
    // Add new channel button
    const newChannelButton = document.createElement('button');
    this.applyStyles(newChannelButton, {
      margin: '12px 16px',
      padding: '8px 12px',
      backgroundColor: HEADER_COLORS.primary,
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    });
    
    const plusIcon = document.createElement('span');
    plusIcon.textContent = '+';
    newChannelButton.appendChild(plusIcon);
    
    const buttonText = document.createElement('span');
    buttonText.textContent = 'New Channel';
    newChannelButton.appendChild(buttonText);
    
    // Add components to sidebar
    sidebar.appendChild(sidebarHeader);
    sidebar.appendChild(channelsContainer);
    sidebar.appendChild(newChannelButton);
    
    return sidebar;
  }
  
  /**
   * Add a channel group to the sidebar
   * @param {HTMLElement} container - Channels container
   * @param {string} title - Group title
   * @param {Array} channels - Channel list
   */
  addChannelGroup(container, title, channels) {
    if (!channels || channels.length === 0) return;
    
    // Create group header
    const groupHeader = document.createElement('div');
    this.applyStyles(groupHeader, {
      padding: '8px 16px',
      fontSize: '12px',
      color: '#666',
      fontWeight: 'bold'
    });
    groupHeader.textContent = title;
    
    // Create channel list
    const channelList = document.createElement('div');
    
    // Add channels
    channels.forEach(channel => {
      const channelItem = this.createChannelItem(channel);
      channelList.appendChild(channelItem);
    });
    
    // Add to container
    container.appendChild(groupHeader);
    container.appendChild(channelList);
  }
  
  /**
   * Create a channel item
   * @param {Object} channel - Channel data
   * @returns {HTMLElement} Channel item element
   */
  createChannelItem(channel) {
    const isActive = this.selectedChannel === channel.id;
    
    const item = document.createElement('div');
    this.applyStyles(item, {
      padding: '8px 16px 8px 12px',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '14px',
      color: isActive ? HEADER_COLORS.primary : '#333',
      backgroundColor: isActive ? '#e3f2fd' : 'transparent',
      borderLeft: isActive ? `4px solid ${HEADER_COLORS.primary}` : '4px solid transparent'
    });
    
    // Globe icon for channel type
    const icon = document.createElement('span');
    icon.textContent = channel.type === 'public' ? '🌐' : '🔒';
    this.applyStyles(icon, {
      marginRight: '8px',
      fontSize: '14px',
      opacity: '0.7'
    });
    
    // Channel name
    const name = document.createElement('span');
    name.textContent = channel.name;
    this.applyStyles(name, {
      flex: '1'
    });
    
    // Unread indicator
    if (channel.unread > 0) {
      const badge = document.createElement('span');
      badge.textContent = channel.unread > 9 ? '9+' : channel.unread;
      this.applyStyles(badge, {
        minWidth: '20px',
        height: '20px',
        backgroundColor: isActive ? HEADER_COLORS.primary : '#f44336',
        color: 'white',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 4px'
      });
      item.appendChild(badge);
    }
    
    // Add components to item
    item.appendChild(icon);
    item.appendChild(name);
    
    // Add event listener for channel selection
    item.addEventListener('click', () => {
      this.handleChannelSelect(channel);
    });
    
    // Add hover effect
    item.addEventListener('mouseover', () => {
      if (!isActive) {
        item.style.backgroundColor = '#f0f0f0';
      }
    });
    
    item.addEventListener('mouseout', () => {
      if (!isActive) {
        item.style.backgroundColor = 'transparent';
      }
    });
    
    return item;
  }
  
  /**
   * Create the main chat area
   * @returns {HTMLElement} Chat area element
   */
  createChatArea() {
    const chatArea = document.createElement('div');
    this.applyStyles(chatArea, {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff',
      overflowX: 'hidden'
    });
    
    // Chat header with channel info
    const chatHeader = this.createChatHeader();
    
    // Messages container
    const messagesContainer = this.createMessagesContainer();
    
    // Chat input area
    const inputArea = this.createChatInput();
    
    // Add components to chat area
    chatArea.appendChild(chatHeader);
    chatArea.appendChild(messagesContainer);
    chatArea.appendChild(inputArea);
    
    return chatArea;
  }
  
  /**
   * Create chat header with channel info
   * @returns {HTMLElement} Chat header element
   */
  createChatHeader() {
    const header = document.createElement('div');
    this.applyStyles(header, {
      padding: '12px 16px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff'
    });
    
    // Get selected channel
    const channel = this.mockChannels.find(c => c.id === this.selectedChannel) || { 
      id: 'general', 
      name: 'General', 
      type: 'public' 
    };
    
    // Channel info
    const channelInfo = document.createElement('div');
    this.applyStyles(channelInfo, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });
    
    // Channel icon
    const channelIcon = document.createElement('span');
    channelIcon.textContent = channel.type === 'public' ? '🌐' : '🔒';
    this.applyStyles(channelIcon, {
      fontSize: '18px'
    });
    
    // Channel name
    const channelName = document.createElement('span');
    channelName.textContent = channel.name;
    this.applyStyles(channelName, {
      fontSize: '16px',
      fontWeight: 'bold'
    });
    
    // Channel type badge
    const channelType = document.createElement('span');
    channelType.textContent = channel.type === 'public' ? 'Public' : 'Private';
    this.applyStyles(channelType, {
      fontSize: '12px',
      padding: '2px 8px',
      backgroundColor: channel.type === 'public' ? '#e3f2fd' : '#fff3e0',
      color: channel.type === 'public' ? '#1565c0' : '#e65100',
      borderRadius: '12px'
    });
    
    // Add components to channel info
    channelInfo.appendChild(channelIcon);
    channelInfo.appendChild(channelName);
    channelInfo.appendChild(channelType);
    
    // Actions area
    const actions = document.createElement('div');
    this.applyStyles(actions, {
      display: 'flex',
      gap: '12px'
    });
    
    // Search button
    const searchButton = this.createIconButton('🔍', 'Search in channel');
    
    // Toggle users button
    const toggleUsersButton = this.createIconButton(
      this.showUserList ? '👥' : '👤', 
      this.showUserList ? 'Hide team members' : 'Show team members'
    );
    toggleUsersButton.addEventListener('click', () => {
      this.toggleUserList();
    });
    
    // Add buttons to actions
    actions.appendChild(searchButton);
    actions.appendChild(toggleUsersButton);
    
    // Add components to header
    header.appendChild(channelInfo);
    header.appendChild(actions);
    
    return header;
  }
  
  /**
   * Create an icon button 
   * @param {string} icon - Icon text
   * @param {string} title - Button title
   * @returns {HTMLElement} Button element
   */
  createIconButton(icon, title) {
    const button = document.createElement('button');
    button.textContent = icon;
    button.title = title;
    this.applyStyles(button, {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    // Add hover effect
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#f5f5f5';
    });

    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = 'transparent';
    });

    return button;
  }

  /**
   * Create the messages container for the chat area
   * @returns {HTMLElement} Messages container element
   */
  createMessagesContainer() {
    const container = document.createElement('div');
    this.applyStyles(container, {
      flex: '1',
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });

    // Get messages for selected channel
    const messages = this.mockMessages[this.selectedChannel] || [];

    if (messages.length === 0) {
      // No messages yet
      const emptyState = document.createElement('div');
      this.applyStyles(emptyState, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '16px',
        color: '#666',
        textAlign: 'center'
      });

      const icon = document.createElement('div');
      icon.textContent = '💬';
      this.applyStyles(icon, {
        fontSize: '48px',
        marginBottom: '8px'
      });

      const title = document.createElement('h3');
      title.textContent = 'No messages yet';
      this.applyStyles(title, {
        fontSize: '18px',
        margin: '0',
        fontWeight: 'bold'
      });

      const description = document.createElement('p');
      description.textContent = 'Be the first to send a message in this channel!';
      this.applyStyles(description, {
        fontSize: '14px',
        margin: '0',
        maxWidth: '300px'
      });

      emptyState.appendChild(icon);
      emptyState.appendChild(title);
      emptyState.appendChild(description);

      container.appendChild(emptyState);
    } else {
      // Group messages by date
      const groupedMessages = this.groupMessagesByDate(messages);

      // Add messages to container
      Object.keys(groupedMessages).forEach(date => {
        // Add date separator
        const dateSeparator = this.createDateSeparator(date);
        container.appendChild(dateSeparator);

        // Add messages for this date
        groupedMessages[date].forEach(message => {
          const messageElement = this.createMessageElement(message);
          container.appendChild(messageElement);
        });
      });
    }

    return container;
  }

  /**
   * Group messages by date
   * @param {Array} messages - List of messages
   * @returns {Object} Messages grouped by date
   */
  groupMessagesByDate(messages) {
    const groups = {};

    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  }

  /**
   * Create a date separator for message groups
   * @param {string} date - Date string
   * @returns {HTMLElement} Date separator element
   */
  createDateSeparator(date) {
    const separator = document.createElement('div');
    this.applyStyles(separator, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: '16px 0 8px',
      color: '#666'
    });

    const line1 = document.createElement('div');
    this.applyStyles(line1, {
      flex: '1',
      height: '1px',
      backgroundColor: '#e0e0e0'
    });

    const dateLabel = document.createElement('div');
    dateLabel.textContent = this.formatDateLabel(date);
    this.applyStyles(dateLabel, {
      fontSize: '12px',
      fontWeight: 'bold',
      padding: '2px 8px'
    });

    const line2 = document.createElement('div');
    this.applyStyles(line2, {
      flex: '1',
      height: '1px',
      backgroundColor: '#e0e0e0'
    });

    separator.appendChild(line1);
    separator.appendChild(dateLabel);
    separator.appendChild(line2);

    return separator;
  }

  /**
   * Format date label
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatDateLabel(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Check if date is yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Return formatted date
    return dateString;
  }

  /**
   * Create a message element
   * @param {Object} message - Message data
   * @returns {HTMLElement} Message element
   */
  createMessageElement(message) {
    const messageElement = document.createElement('div');
    this.applyStyles(messageElement, {
      display: 'flex',
      gap: '12px',
      marginBottom: '12px'
    });

    // Avatar
    const avatar = document.createElement('div');
    const initial = message.sender.charAt(0).toUpperCase();
    avatar.textContent = initial;
    this.applyStyles(avatar, {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: this.getAvatarColor(message.sender),
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
      flexShrink: '0'
    });

    // Message content
    const content = document.createElement('div');
    this.applyStyles(content, {
      flex: '1'
    });

    // Message header
    const header = document.createElement('div');
    this.applyStyles(header, {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
      marginBottom: '4px'
    });

    const name = document.createElement('span');
    name.textContent = message.senderDisplayName;
    this.applyStyles(name, {
      fontWeight: 'bold',
      fontSize: '14px'
    });

    const time = document.createElement('span');
    time.textContent = this.formatTime(message.timestamp);
    this.applyStyles(time, {
      color: '#666',
      fontSize: '12px'
    });

    header.appendChild(name);
    header.appendChild(time);

    // Message text
    const text = document.createElement('div');
    text.textContent = message.text;
    this.applyStyles(text, {
      fontSize: '14px',
      lineHeight: '1.4',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    });

    // Add header and text to content
    content.appendChild(header);
    content.appendChild(text);

    // Add avatar and content to message element
    messageElement.appendChild(avatar);
    messageElement.appendChild(content);

    return messageElement;
  }

  /**
   * Get avatar color based on username
   * @param {string} username - Username
   * @returns {string} Color value
   */
  getAvatarColor(username) {
    // Set of colors for avatars
    const colors = [
      '#2196F3', // Blue
      '#4CAF50', // Green
      '#FFC107', // Amber
      '#9C27B0', // Purple
      '#F44336', // Red
      '#009688', // Teal
      '#3F51B5', // Indigo
      '#FF5722'  // Deep Orange
    ];

    // Generate a consistent index based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  /**
   * Format timestamp to show time
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Create the chat input area
   * @returns {HTMLElement} Chat input area element
   */
  createChatInput() {
    const inputArea = document.createElement('div');
    this.applyStyles(inputArea, {
      padding: '16px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#f9f9f9'
    });

    // Create form
    const form = document.createElement('form');
    this.applyStyles(form, {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end'
    });

    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.placeholder = `Message #${this.selectedChannel}`;
    textarea.rows = 1;
    this.applyStyles(textarea, {
      flex: '1',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      resize: 'none',
      fontSize: '14px',
      fontFamily: 'inherit',
      minHeight: '44px',
      maxHeight: '120px'
    });

    // Auto-expand textarea as user types
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = (textarea.scrollHeight) + 'px';
    });

    // Attachments button
    const attachButton = this.createIconButton('📎', 'Add attachment');

    // Emoji button
    const emojiButton = this.createIconButton('😊', 'Add emoji');

    // Send button
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.type = 'submit';
    this.applyStyles(sendButton, {
      padding: '0 16px',
      height: '36px',
      backgroundColor: HEADER_COLORS.primary,
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer'
    });

    // Add hover effect to send button
    sendButton.addEventListener('mouseover', () => {
      sendButton.style.backgroundColor = HEADER_COLORS.secondary;
    });

    sendButton.addEventListener('mouseout', () => {
      sendButton.style.backgroundColor = HEADER_COLORS.primary;
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
      if (text) {
        // In a real app, this would send the message to the server
        console.log(`[CRM Extension] Sending message to #${this.selectedChannel}: ${text}`);
        
        // Reset textarea
        textarea.value = '';
        textarea.style.height = 'auto';
        
        // Focus back on textarea
        textarea.focus();
      }
    });

    // Add components to form
    form.appendChild(textarea);
    form.appendChild(attachButton);
    form.appendChild(emojiButton);
    form.appendChild(sendButton);

    // Add form to input area
    inputArea.appendChild(form);

    return inputArea;
  }

  /**
   * Create the user panel (team members)
   * @returns {HTMLElement} User panel element
   */
  createUserPanel() {
    const userPanelWidth = '240px';
    const panel = document.createElement('div');
    this.applyStyles(panel, {
      width: userPanelWidth,
      minWidth: userPanelWidth,
      height: '100%',
      borderLeft: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa',
      transform: 'translateX(0)',
      transition: 'transform 0.3s ease-in-out',
      position: 'relative'
    });

    // Panel header with close button
    const panelHeader = document.createElement('div');
    this.applyStyles(panelHeader, {
      padding: '14px 16px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '16px',
      fontWeight: 'bold'
    });

    // Header title
    panelHeader.textContent = 'Team Members';

    // Close button
    const closeButton = this.createIconButton('×', 'Hide team members');
    closeButton.addEventListener('click', () => {
      this.toggleUserList();
    });

    panelHeader.appendChild(closeButton);

    // Search box
    const searchBox = document.createElement('div');
    this.applyStyles(searchBox, {
      padding: '12px 16px',
      borderBottom: '1px solid #e0e0e0'
    });

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search users...';
    this.applyStyles(searchInput, {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '16px',
      fontSize: '14px'
    });

    searchBox.appendChild(searchInput);

    // Users container
    const usersContainer = document.createElement('div');
    this.applyStyles(usersContainer, {
      flex: '1',
      overflowY: 'auto',
      padding: '8px 0'
    });

    // User count badge
    const userCountBadge = document.createElement('div');
    userCountBadge.textContent = this.mockUsers.length;
    this.applyStyles(userCountBadge, {
      position: 'absolute',
      right: '16px',
      top: '16px',
      minWidth: '20px',
      height: '20px',
      backgroundColor: '#4CAF50',
      color: 'white',
      borderRadius: '10px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 6px'
    });

    // Group users by status
    const onlineUsers = this.mockUsers.filter(user => user.status === 'online');
    const awayUsers = this.mockUsers.filter(user => user.status === 'away');
    const dndUsers = this.mockUsers.filter(user => user.status === 'dnd');
    const offlineUsers = this.mockUsers.filter(user => user.status === 'offline');

    // Add user groups if they have members
    if (onlineUsers.length > 0) {
      this.addUserGroup(usersContainer, 'Online', onlineUsers);
    }
    
    if (awayUsers.length > 0) {
      this.addUserGroup(usersContainer, 'Away', awayUsers);
    }
    
    if (dndUsers.length > 0) {
      this.addUserGroup(usersContainer, 'Do Not Disturb', dndUsers);
    }
    
    if (offlineUsers.length > 0) {
      this.addUserGroup(usersContainer, 'Offline', offlineUsers);
    }

    // If no users in any category, show empty state
    if (this.mockUsers.length === 0) {
      const emptyState = document.createElement('div');
      this.applyStyles(emptyState, {
        padding: '16px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      });
      emptyState.textContent = 'No users available';
      usersContainer.appendChild(emptyState);
    }

    // Add components to panel
    panel.appendChild(panelHeader);
    panel.appendChild(userCountBadge);
    panel.appendChild(searchBox);
    panel.appendChild(usersContainer);

    return panel;
  }

  /**
   * Add a user group to the users panel
   * @param {HTMLElement} container - Users container
   * @param {string} title - Group title
   * @param {Array} users - User list
   */
  addUserGroup(container, title, users) {
    // Create group header
    const groupHeader = document.createElement('div');
    this.applyStyles(groupHeader, {
      padding: '8px 16px',
      fontSize: '12px',
      color: '#666',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    });
    
    groupHeader.textContent = title;
    
    // Add user count badge
    const countBadge = document.createElement('span');
    countBadge.textContent = users.length;
    this.applyStyles(countBadge, {
      fontSize: '12px',
      backgroundColor: '#eee',
      color: '#666',
      borderRadius: '10px',
      padding: '1px 6px'
    });
    
    groupHeader.appendChild(countBadge);
    
    // Create user list
    const userList = document.createElement('div');
    
    // Add users
    users.forEach(user => {
      const userItem = this.createUserItem(user);
      userList.appendChild(userItem);
    });
    
    // Add to container
    container.appendChild(groupHeader);
    container.appendChild(userList);
  }

  /**
   * Create a user item
   * @param {Object} user - User data
   * @returns {HTMLElement} User item element
   */
  createUserItem(user) {
    const item = document.createElement('div');
    this.applyStyles(item, {
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      fontSize: '14px'
    });
    
    // User avatar
    const avatar = document.createElement('div');
    const initial = user.username.charAt(0).toUpperCase();
    avatar.textContent = initial;
    this.applyStyles(avatar, {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: this.getAvatarColor(user.username),
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
      marginRight: '8px',
      position: 'relative'
    });
    
    // Status indicator
    const statusColors = {
      online: '#4CAF50',
      away: '#FFC107',
      dnd: '#F44336',
      offline: '#9E9E9E'
    };
    
    const statusDot = document.createElement('div');
    this.applyStyles(statusDot, {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: statusColors[user.status] || statusColors.offline,
      border: '2px solid #f8f9fa'
    });
    
    avatar.appendChild(statusDot);
    
    // User name
    const name = document.createElement('span');
    name.textContent = user.displayName;
    this.applyStyles(name, {
      flex: '1'
    });
    
    // Add components to item
    item.appendChild(avatar);
    item.appendChild(name);
    
    // Add event listener for user selection
    item.addEventListener('click', () => {
      this.handleUserSelect(user);
    });
    
    // Add hover effect
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#f0f0f0';
    });
    
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = 'transparent';
    });
    
    return item;
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
    // Create settings layout with improved styling
    const settingsContainer = document.createElement('div');
    this.applyStyles(settingsContainer, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '20px',
      backgroundColor: '#ffffff'
    });
    
    // Create settings header
    const settingsHeader = document.createElement('div');
    this.applyStyles(settingsHeader, {
      marginBottom: '24px',
      borderBottom: '1px solid #e0e0e0',
      paddingBottom: '16px'
    });
    
    const settingsTitle = document.createElement('h2');
    settingsTitle.textContent = 'Settings';
    this.applyStyles(settingsTitle, {
      margin: '0',
      fontSize: '20px',
      color: '#333'
    });
    
    settingsHeader.appendChild(settingsTitle);
    settingsContainer.appendChild(settingsHeader);
    
    // Create settings categories
    const categories = [
      { 
        title: 'Profile', 
        icon: '👤',
        description: 'Manage your personal information and preferences.',
        settings: [
          { name: 'Display Name', type: 'text', placeholder: 'Your display name' },
          { name: 'Email', type: 'email', placeholder: 'Your email address' }
        ]
      },
      { 
        title: 'Notifications', 
        icon: '🔔',
        description: 'Configure how you receive notifications.',
        settings: [
          { name: 'Enable sound', type: 'checkbox' },
          { name: 'Desktop notifications', type: 'checkbox' }
        ]
      },
      { 
        title: 'Appearance', 
        icon: '🎨',
        description: 'Customize the look and feel of the chat.',
        settings: [
          { name: 'Theme', type: 'select', options: ['Light', 'Dark', 'System'] },
          { name: 'Font Size', type: 'select', options: ['Small', 'Medium', 'Large'] }
        ]
      },
      { 
        title: 'Privacy & Security', 
        icon: '🔒',
        description: 'Manage security and privacy settings.',
        settings: [
          { name: 'Change Password', type: 'button', label: 'Change Password' },
          { name: 'Two-Factor Authentication', type: 'checkbox' }
        ]
      }
    ];
    
    // Create settings sections
    categories.forEach(category => {
      const section = this.createSettingsSection(category);
      settingsContainer.appendChild(section);
    });
    
    container.appendChild(settingsContainer);
  }
  
  /**
   * Create a settings section
   * @param {Object} category - Category data
   * @returns {HTMLElement} Settings section element
   */
  createSettingsSection(category) {
    const section = document.createElement('div');
    this.applyStyles(section, {
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px'
    });
    
    // Section header
    const header = document.createElement('div');
    this.applyStyles(header, {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px'
    });
    
    const icon = document.createElement('span');
    icon.textContent = category.icon;
    this.applyStyles(icon, {
      fontSize: '20px',
      marginRight: '8px'
    });
    
    const title = document.createElement('h3');
    title.textContent = category.title;
    this.applyStyles(title, {
      margin: '0',
      fontSize: '16px',
      color: '#333'
    });
    
    header.appendChild(icon);
    header.appendChild(title);
    
    // Description
    const description = document.createElement('p');
    description.textContent = category.description;
    this.applyStyles(description, {
      margin: '0 0 16px 0',
      fontSize: '14px',
      color: '#666'
    });
    
    section.appendChild(header);
    section.appendChild(description);
    
    // Add settings controls
    if (category.settings && category.settings.length) {
      const settingsList = document.createElement('div');
      this.applyStyles(settingsList, {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      });
      
      category.settings.forEach(setting => {
        const settingRow = this.createSettingControl(setting);
        settingsList.appendChild(settingRow);
      });
      
      section.appendChild(settingsList);
    }
    
    return section;
  }
  
  /**
   * Create a setting control
   * @param {Object} setting - Setting data
   * @returns {HTMLElement} Setting control element
   */
  createSettingControl(setting) {
    const row = document.createElement('div');
    this.applyStyles(row, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    });
    
    const label = document.createElement('label');
    label.textContent = setting.name;
    this.applyStyles(label, {
      fontSize: '14px',
      color: '#333'
    });
    
    let control;
    
    switch (setting.type) {
      case 'text':
      case 'email':
        control = document.createElement('input');
        control.type = setting.type;
        control.placeholder = setting.placeholder || '';
        this.applyStyles(control, {
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          width: '200px'
        });
        break;
        
      case 'checkbox':
        control = document.createElement('input');
        control.type = 'checkbox';
        break;
        
      case 'select':
        control = document.createElement('select');
        this.applyStyles(control, {
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          width: '200px'
        });
        
        if (setting.options && setting.options.length) {
          setting.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            control.appendChild(optionElement);
          });
        }
        break;
        
      case 'button':
        control = document.createElement('button');
        control.textContent = setting.label || setting.name;
        this.applyStyles(control, {
          padding: '8px 12px',
          backgroundColor: HEADER_COLORS.primary,
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        });
        break;
        
      default:
        control = document.createElement('span');
        control.textContent = 'Unsupported setting type';
    }
    
    row.appendChild(label);
    row.appendChild(control);
    
    return row;
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