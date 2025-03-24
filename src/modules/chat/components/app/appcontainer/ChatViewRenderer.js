// chat/components/app/appcontainer/ChatViewRenderer.js
// Handles rendering of the chat view component

import MessageInput from '../../messages/MessageInput.js';
import { getChannelMessages } from '../../../utils/storage.js';
import { sendChatMessage } from '../../../services/messageService.js';
import { joinChannel } from '../../../services/channel/channelService.js';

/**
 * Render the chat view
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Rendering options
 * @returns {HTMLElement} The rendered chat view
 */
export function renderChatView(container, options = {}) {
  // Updated parameters: channels, users, and new connectionStatus
  const {
    showUserList = true,
    selectedChannel = 'general',
    channels = [],
    users = [],
    connectionStatus = 'disconnected',
    onChannelSelect = () => {},
    onUserSelect = () => {},
    toggleUserList = () => {}
  } = options;

  // Create layout with a flexible 3-panel design
  const layout = document.createElement('div');
  applyStyles(layout, {
    display: 'flex',
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff'
  });
  
  // Create sidebar for channels (passing connectionStatus)
  const sidebar = createSidebar(channels, selectedChannel, onChannelSelect, connectionStatus);
  
  // Create main content area for chat (passing connectionStatus)
  const chatArea = createChatArea(selectedChannel, channels, toggleUserList, users, connectionStatus);
  
  // Create collapsible users panel
  let userPanel;
  if (showUserList) {
    userPanel = createUserPanel(users, onUserSelect);
  }
  
  // Apply more compact sizing to each panel
  applyStyles(sidebar, {
    flex: '0 0 180px',  // More compact fixed width
    minWidth: '160px',  // Smaller minimum width
    maxWidth: '180px'   // Smaller maximum width
  });
  
  applyStyles(chatArea, {
    flex: '1 1 auto',   // Grow and shrink as needed
    minWidth: '250px'   // Smaller minimum width
  });
  
  if (showUserList && userPanel) {
    applyStyles(userPanel, {
      flex: '0 0 200px',  // More compact fixed width
      minWidth: '180px',  // Smaller minimum width
      maxWidth: '200px'   // Smaller maximum width
    });
  }
  
  // Add all panels to layout
  layout.appendChild(sidebar);
  layout.appendChild(chatArea);
  
  if (showUserList && userPanel) {
    layout.appendChild(userPanel);
  }
  
  container.appendChild(layout);
  return layout;
}

/**
 * Create sidebar with channels
 * @param {Array} channels - Channel list
 * @param {string} selectedChannel - ID of selected channel
 * @param {Function} onChannelSelect - Channel selection callback
 * @param {string} connectionStatus - Current connection status
 * @returns {HTMLElement} Sidebar element
 */
function createSidebar(channels, selectedChannel, onChannelSelect, connectionStatus) {
  const sidebar = document.createElement('div');
  applyStyles(sidebar, {
    height: '100%',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    overflow: 'hidden'
  });
  
  // Sidebar header - more compact
  const sidebarHeader = document.createElement('div');
  applyStyles(sidebarHeader, {
    padding: '10px 12px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  });
  
  const headingText = document.createElement('h2');
  headingText.textContent = 'Channels';
  applyStyles(headingText, {
    margin: '0',
    fontSize: '16px',
    fontWeight: 'bold'
  });
  
  // Channel count badge with connection-based color
  let badgeBgColor = '#e0e0e0'; // Default gray
  if (connectionStatus === 'connected') {
    badgeBgColor = '#4CAF50'; // Green
  } else if (connectionStatus === 'connecting') {
    badgeBgColor = '#FFC107'; // Yellow
  } else if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
    badgeBgColor = '#F44336'; // Red
  }
  
  const channelCount = document.createElement('span');
  channelCount.textContent = channels.length.toString();
  applyStyles(channelCount, {
    backgroundColor: badgeBgColor,
    color: '#333',
    borderRadius: '12px',
    padding: '1px 6px',
    fontSize: '11px',
    fontWeight: 'bold'
  });
  
  sidebarHeader.appendChild(headingText);
  sidebarHeader.appendChild(channelCount);
  
  // Channels container
  const channelsContainer = document.createElement('div');
  applyStyles(channelsContainer, {
    flex: '1',
    overflowY: 'auto',
    padding: '4px 0'
  });
  
  // Group channels by type (supporting both 'type' and 'isPrivate' formats)
  const publicChannels = channels.filter(channel => channel.type === 'public' || (!channel.type && !channel.isPrivate));
  const privateChannels = channels.filter(channel => channel.type === 'private' || (channel.isPrivate));
  
  // Add public channels
  if (publicChannels.length > 0) {
    addChannelGroup(channelsContainer, 'PUBLIC CHANNELS', publicChannels, selectedChannel, onChannelSelect);
  }
  
  // Add private channels
  if (privateChannels.length > 0) {
    addChannelGroup(channelsContainer, 'PRIVATE CHANNELS', privateChannels, selectedChannel, onChannelSelect);
  }
  
  // If no channels, add empty state messaging based on connection status
  if (channels.length === 0) {
    const noChannelsMessage = document.createElement('div');
    if (connectionStatus === 'connected') {
      noChannelsMessage.textContent = 'No channels available. Create a new channel to get started.';
    } else if (connectionStatus === 'connecting') {
      noChannelsMessage.textContent = 'Loading channels...';
    } else {
      noChannelsMessage.textContent = 'Cannot load channels. Check your connection.';
    }
    applyStyles(noChannelsMessage, {
      padding: '10px',
      textAlign: 'center',
      color: '#666'
    });
    channelsContainer.appendChild(noChannelsMessage);
  }
  
  // Add new channel button - more compact
  const newChannelButton = document.createElement('button');
  applyStyles(newChannelButton, {
    margin: '8px',
    padding: '6px 0',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontWeight: 'bold'
  });
  
  const plusIcon = document.createElement('span');
  plusIcon.textContent = '+';
  applyStyles(plusIcon, {
    fontSize: '16px'
  });
  
  const buttonText = document.createElement('span');
  buttonText.textContent = 'New Channel';
  
  newChannelButton.appendChild(plusIcon);
  newChannelButton.appendChild(buttonText);
  
  // Disable new channel button when not connected
  if (connectionStatus !== 'connected') {
    newChannelButton.disabled = true;
    newChannelButton.style.cursor = 'not-allowed';
    newChannelButton.style.opacity = '0.5';
  }
  
  // Hover effect
  newChannelButton.addEventListener('mouseover', () => {
    if (!newChannelButton.disabled) {
      newChannelButton.style.backgroundColor = '#1976D2';
    }
  });
  
  newChannelButton.addEventListener('mouseout', () => {
    if (!newChannelButton.disabled) {
      newChannelButton.style.backgroundColor = '#2196F3';
    }
  });
  
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
 * @param {string} selectedChannel - Selected channel ID
 * @param {Function} onChannelSelect - Channel selection callback
 */
function addChannelGroup(container, title, channels, selectedChannel, onChannelSelect) {
  // Group header
  const groupHeader = document.createElement('div');
  applyStyles(groupHeader, {
    padding: '8px 12px 4px',
    fontSize: '10px',
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  });
  groupHeader.textContent = title;
  
  // Channel list container
  const channelList = document.createElement('div');
  applyStyles(channelList, {
    marginBottom: '10px'
  });
  
  channels.forEach(channel => {
    const channelItem = createChannelItem(channel, channel.id === selectedChannel, onChannelSelect);
    channelList.appendChild(channelItem);
  });
  
  container.appendChild(groupHeader);
  container.appendChild(channelList);
}

/**
 * Create a channel item
 * @param {Object} channel - Channel data
 * @param {boolean} isActive - Whether channel is active
 * @param {Function} onChannelSelect - Channel selection callback
 * @returns {HTMLElement} Channel item element
 */
function createChannelItem(channel, isActive, onChannelSelect) {
  const item = document.createElement('div');
  applyStyles(item, {
    padding: '6px 12px 6px 10px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    color: isActive ? '#2196F3' : '#333',
    backgroundColor: isActive ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
    borderLeft: isActive ? '3px solid #2196F3' : '3px solid transparent'
  });
  
  // Icon: use channel.type if available; otherwise check isPrivate
  const icon = document.createElement('span');
  const channelType = channel.type ? channel.type : (channel.isPrivate ? 'private' : 'public');
  icon.textContent = channelType === 'public' ? '🌐' : '🔒';
  applyStyles(icon, {
    marginRight: '8px',
    fontSize: '14px',
    opacity: '0.7'
  });
  
  // Channel name
  const name = document.createElement('span');
  name.textContent = channel.name;
  applyStyles(name, {
    flex: '1',
    fontWeight: isActive ? 'bold' : 'normal',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  });
  
  // Unread indicator if any
  if (channel.unread && channel.unread > 0) {
    const badge = document.createElement('span');
    badge.textContent = channel.unread > 99 ? '99+' : channel.unread;
    applyStyles(badge, {
      minWidth: '18px',
      height: '18px',
      backgroundColor: isActive ? '#2196F3' : '#f44336',
      color: 'white',
      borderRadius: '9px',
      fontSize: '11px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 4px'
    });
    
    item.appendChild(badge);
  }
  
  // Assemble item
  item.appendChild(icon);
  item.appendChild(name);
  
  // When channel is clicked, select it and join via WebSocket
  item.addEventListener('click', () => {
    onChannelSelect(channel);
    joinChannel(channel.id);
  });
  
  // Hover effects
  item.addEventListener('mouseover', () => {
    if (!isActive) {
      item.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
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
 * @param {string} selectedChannel - ID of selected channel
 * @param {Array} channels - Channel list
 * @param {Function} toggleUserList - Toggle user list callback
 * @param {Array} users - List of users
 * @param {string} connectionStatus - Current connection status
 * @returns {HTMLElement} Chat area element
 */
function createChatArea(selectedChannel, channels, toggleUserList, users, connectionStatus) {
  const chatArea = document.createElement('div');
  applyStyles(chatArea, {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    width: '100%'
  });
  
  // Get channel info (support both formats)
  const channel = channels.find(c => c.id === selectedChannel) || { 
    id: 'general', 
    name: 'General', 
    type: 'public'
  };
  
  // Chat header with channel info and connection status
  const chatHeader = createChatHeader(channel, toggleUserList, connectionStatus);
  
  // Messages container now checks for stored messages and shows appropriate placeholder
  const messagesContainer = createMessagesContainer(channel, connectionStatus);
  
  // Chat input container
  const inputContainer = document.createElement('div');
  applyStyles(inputContainer, {
    width: '100%'
  });
  
  // MessageInput component with connection-aware placeholder
  const messageInput = new MessageInput(inputContainer, {
    channelId: channel.id,
    placeholder: connectionStatus === 'connected' ? `Message #${channel.name}` : `Cannot send message while ${connectionStatus}`,
    maxLength: 2000
  });
  
  chatArea.appendChild(chatHeader);
  chatArea.appendChild(messagesContainer);
  chatArea.appendChild(inputContainer);
  
  return chatArea;
}

/**
 * Create chat header with channel info and connection status indicator
 * @param {Object} channel - Channel object
 * @param {Function} toggleUserList - Toggle user list callback
 * @param {string} connectionStatus - Current connection status
 * @returns {HTMLElement} Chat header element
 */
function createChatHeader(channel, toggleUserList, connectionStatus) {
  const header = document.createElement('div');
  applyStyles(header, {
    padding: '10px 12px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%'
  });
  
  // Channel info section
  const channelInfo = document.createElement('div');
  applyStyles(channelInfo, {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  });
  
  // Channel icon
  const channelIcon = document.createElement('span');
  channelIcon.textContent = channel.type === 'public' ? '🌐' : '🔒';
  applyStyles(channelIcon, {
    fontSize: '16px'
  });
  
  // Channel name
  const channelName = document.createElement('div');
  channelName.textContent = channel.name;
  applyStyles(channelName, {
    fontSize: '16px',
    fontWeight: 'bold'
  });
  
  // Channel type badge
  const channelType = document.createElement('span');
  channelType.textContent = channel.type === 'public' ? 'Public' : 'Private';
  applyStyles(channelType, {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: channel.type === 'public' ? '#e3f2fd' : '#fff3e0',
    color: channel.type === 'public' ? '#1565c0' : '#e65100'
  });
  
  channelInfo.appendChild(channelIcon);
  channelInfo.appendChild(channelName);
  channelInfo.appendChild(channelType);
  
  // Connection status indicator if not connected
  if (connectionStatus !== 'connected') {
    const statusIndicator = document.createElement('span');
    if (connectionStatus === 'connecting') {
      statusIndicator.textContent = '🔄 Connecting...';
      statusIndicator.style.color = '#FFC107';
    } else {
      statusIndicator.textContent = '⚠️ Disconnected';
      statusIndicator.style.color = '#F44336';
    }
    channelInfo.appendChild(statusIndicator);
  }
  
  // Actions area with buttons
  const actions = document.createElement('div');
  applyStyles(actions, {
    display: 'flex',
    gap: '8px'
  });
  
  const searchButton = createIconButton('🔍', 'Search in channel');
  const toggleUsersButton = createIconButton('👥', 'Toggle team members');
  toggleUsersButton.addEventListener('click', toggleUserList);
  
  actions.appendChild(searchButton);
  actions.appendChild(toggleUsersButton);
  
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
function createIconButton(icon, title) {
  const button = document.createElement('button');
  button.textContent = icon;
  button.title = title;
  applyStyles(button, {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
  
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
 * @param {Object} channel - Channel object
 * @param {string} connectionStatus - Current connection status
 * @returns {HTMLElement} Messages container element
 */
function createMessagesContainer(channel, connectionStatus) {
  const container = document.createElement('div');
  applyStyles(container, {
    flex: '1',
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    minHeight: '200px'
  });

  // Attempt to load messages from storage
  const messages = getChannelMessages(channel.id);
  if (messages && messages.length > 0) {
    messages.forEach(message => {
      container.appendChild(createMessageElement(message));
    });
  } else {
    // Placeholder message when no messages exist
    const placeholderMessage = document.createElement('div');
    applyStyles(placeholderMessage, {
      margin: 'auto',
      textAlign: 'center',
      color: '#666',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      maxWidth: '80%'
    });
    
    const placeholderIcon = document.createElement('div');
    placeholderIcon.textContent = '💬';
    applyStyles(placeholderIcon, {
      fontSize: '48px',
      marginBottom: '12px'
    });
    
    const placeholderTitle = document.createElement('div');
    placeholderTitle.textContent = `Welcome to #${channel.name}`;
    applyStyles(placeholderTitle, {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px'
    });
    
    const placeholderText = document.createElement('div');
    if (connectionStatus === 'connected') {
      placeholderText.textContent = 'This is the start of your conversation. Messages are encrypted and will expire after 24 hours.';
    } else if (connectionStatus === 'connecting') {
      placeholderText.textContent = 'Connecting to chat...';
    } else {
      placeholderText.textContent = 'Cannot load messages. Check your connection.';
    }
    applyStyles(placeholderText, {
      fontSize: '14px'
    });
    
    placeholderMessage.appendChild(placeholderIcon);
    placeholderMessage.appendChild(placeholderTitle);
    placeholderMessage.appendChild(placeholderText);
    
    container.appendChild(placeholderMessage);
  }
  
  return container;
}

/**
 * Create a message element for display in the chat
 * @param {Object} message - Message data
 * @returns {HTMLElement} Message element
 */
function createMessageElement(message) {
  // Create container for the message
  const messageElement = document.createElement('div');
  applyStyles(messageElement, {
    padding: '8px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column'
  });
  
  // Avatar with sender's initial
  const avatar = document.createElement('div');
  const initial = (message.senderDisplayName || message.sender || 'U').charAt(0).toUpperCase();
  avatar.textContent = initial;
  const hue = generateColorFromString(message.sender || '');
  applyStyles(avatar, {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: `hsl(${hue}, 70%, 80%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
    fontWeight: 'bold'
  });
  
  // Header with sender name and timestamp
  const header = document.createElement('div');
  header.textContent = `${message.sender || 'Unknown'} • ${formatTimestamp(message.timestamp)}`;
  applyStyles(header, {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px'
  });
  
  // Message text content
  const text = document.createElement('div');
  text.textContent = message.text;
  applyStyles(text, {
    fontSize: '14px'
  });
  
  messageElement.appendChild(avatar);
  messageElement.appendChild(header);
  messageElement.appendChild(text);
  
  return messageElement;
}

/**
 * Create the user panel (team members)
 * @param {Array} users - Users list
 * @param {Function} onUserSelect - User selection callback
 * @returns {HTMLElement} User panel element
 */
function createUserPanel(users, onUserSelect) {
  const panel = document.createElement('div');
  applyStyles(panel, {
    height: '100%',
    borderLeft: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa'
  });

  // Panel header - more compact
  const panelHeader = document.createElement('div');
  applyStyles(panelHeader, {
    padding: '10px 12px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  });
  
  const heading = document.createElement('h2');
  heading.textContent = 'Team Members';
  applyStyles(heading, {
    margin: '0',
    fontSize: '16px',
    fontWeight: 'bold'
  });
  
  // User count badge
  const userCount = document.createElement('span');
  userCount.textContent = users.length.toString();
  applyStyles(userCount, {
    backgroundColor: '#e0e0e0',
    color: '#333',
    borderRadius: '12px',
    padding: '1px 6px',
    fontSize: '11px',
    fontWeight: 'bold'
  });
  
  panelHeader.appendChild(heading);
  panelHeader.appendChild(userCount);

  // Search box - more compact
  const searchBox = document.createElement('div');
  applyStyles(searchBox, {
    padding: '8px 12px',
    borderBottom: '1px solid #e0e0e0'
  });

  const searchContainer = document.createElement('div');
  applyStyles(searchContainer, {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #ddd',
    padding: '0 10px'
  });
  
  const searchIcon = document.createElement('span');
  searchIcon.textContent = '🔍';
  applyStyles(searchIcon, {
    fontSize: '12px',
    color: '#666',
    marginRight: '6px'
  });

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search users...';
  applyStyles(searchInput, {
    width: '100%',
    padding: '6px 0',
    border: 'none',
    borderRadius: '16px',
    fontSize: '13px',
    outline: 'none'
  });

  searchContainer.appendChild(searchIcon);
  searchContainer.appendChild(searchInput);
  searchBox.appendChild(searchContainer);

  // Users container
  const usersContainer = document.createElement('div');
  applyStyles(usersContainer, {
    flex: '1',
    overflowY: 'auto',
    padding: '4px 0'
  });

  // Group users by status
  const onlineUsers = users.filter(user => user.status === 'online');
  const awayUsers = users.filter(user => user.status === 'away');
  const dndUsers = users.filter(user => user.status === 'dnd');
  const offlineUsers = users.filter(user => user.status === 'offline' || !user.status);

  // Add user groups
  if (onlineUsers.length > 0) {
    addUserGroup(usersContainer, 'Online', onlineUsers, onUserSelect);
  }
  
  if (awayUsers.length > 0) {
    addUserGroup(usersContainer, 'Away', awayUsers, onUserSelect);
  }
  
  if (dndUsers.length > 0) {
    addUserGroup(usersContainer, 'Do Not Disturb', dndUsers, onUserSelect);
  }
  
  if (offlineUsers.length > 0) {
    addUserGroup(usersContainer, 'Offline', offlineUsers, onUserSelect);
  }

  // Add components to panel
  panel.appendChild(panelHeader);
  panel.appendChild(searchBox);
  panel.appendChild(usersContainer);

  return panel;
}

/**
 * Add a user group to the users panel
 * @param {HTMLElement} container - Users container
 * @param {string} title - Group title
 * @param {Array} users - User list
 * @param {Function} onUserSelect - User selection callback
 */
function addUserGroup(container, title, users, onUserSelect) {
  // Create group header - more compact
  const groupHeader = document.createElement('div');
  applyStyles(groupHeader, {
    padding: '8px 12px 4px',
    fontSize: '10px',
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  });
  groupHeader.textContent = `${title} — ${users.length}`;
  
  // Create user list
  const userList = document.createElement('div');
  applyStyles(userList, {
    marginBottom: '10px'
  });
  
  // Add users
  users.forEach(user => {
    const userItem = createUserItem(user, user.status === 'online', onUserSelect);
    userList.appendChild(userItem);
  });
  
  // Add to container
  container.appendChild(groupHeader);
  container.appendChild(userList);
}

/**
 * Create a user item
 * @param {Object} user - User data
 * @param {boolean} isOnline - Whether user is online
 * @param {Function} onUserSelect - User selection callback
 * @returns {HTMLElement} User item element
 */
function createUserItem(user, isOnline, onUserSelect) {
  const item = document.createElement('div');
  applyStyles(item, {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    cursor: 'pointer',
    opacity: isOnline ? '1' : '0.7'
  });
  
  // Status indicator
  const statusIndicator = document.createElement('div');
  applyStyles(statusIndicator, {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    marginRight: '8px'
  });
  
  // Set status color
  if (user.status === 'online') {
    statusIndicator.style.backgroundColor = '#4CAF50'; // Green
  } else if (user.status === 'away') {
    statusIndicator.style.backgroundColor = '#FFC107'; // Yellow
  } else if (user.status === 'dnd') {
    statusIndicator.style.backgroundColor = '#F44336'; // Red
  } else {
    statusIndicator.style.backgroundColor = '#9E9E9E'; // Gray
  }
  
  // Avatar - smaller
  const avatar = document.createElement('div');
  
  // Get first letter of display name or username
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();
  avatar.textContent = initial;
  
  // Generate color based on username
  const hue = generateColorFromString(user.username || '');
  const bgColor = `hsl(${hue}, 70%, 80%)`;
  const textColor = `hsl(${hue}, 70%, 30%)`;
  
  applyStyles(avatar, {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: bgColor,
    color: textColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    marginRight: '8px'
  });
  
  // User info
  const userInfo = document.createElement('div');
  applyStyles(userInfo, {
    flex: '1'
  });
  
  // Username/display name
  const displayName = document.createElement('div');
  displayName.textContent = user.displayName || user.username;
  applyStyles(displayName, {
    fontWeight: 'medium',
    fontSize: '13px'
  });
  
  // Role badge for admin/moderator - smaller
  if (user.role === 'admin' || user.role === 'moderator') {
    const roleBadge = document.createElement('span');
    roleBadge.textContent = user.role;
    applyStyles(roleBadge, {
      fontSize: '9px',
      backgroundColor: user.role === 'admin' ? '#f44336' : '#2196F3',
      color: 'white',
      padding: '1px 4px',
      borderRadius: '8px',
      marginLeft: '4px',
      textTransform: 'uppercase',
      fontWeight: 'bold'
    });
    
    displayName.appendChild(roleBadge);
  }
  
  userInfo.appendChild(displayName);

  // If there's a status message
  if (user.statusMessage) {
    const statusText = document.createElement('div');
    statusText.textContent = user.statusMessage;
    applyStyles(statusText, {
      fontSize: '11px',
      color: '#666',
      marginTop: '1px'
    });
    
    userInfo.appendChild(statusText);
  }
  
  // Message icon button for direct messaging - smaller
  const messageButton = document.createElement('button');
  messageButton.innerHTML = '💬';
  messageButton.title = 'Message';
  applyStyles(messageButton, {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
    borderRadius: '4px'
  });
  
  // Add hover effect for message button
  messageButton.addEventListener('mouseover', () => {
    messageButton.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
  });
  
  messageButton.addEventListener('mouseout', () => {
    messageButton.style.backgroundColor = 'transparent';
  });
  
  // Add event listeners
  messageButton.addEventListener('click', (e) => {
    e.stopPropagation();
    onUserSelect(user);
  });
  
  item.addEventListener('click', () => {
    onUserSelect(user);
  });
  
  // Hover effect for item
  item.addEventListener('mouseover', () => {
    item.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
  });
  
  item.addEventListener('mouseout', () => {
    item.style.backgroundColor = 'transparent';
  });
  
  // Assemble item
  item.appendChild(statusIndicator);
  item.appendChild(avatar);
  item.appendChild(userInfo);
  item.appendChild(messageButton);
  
  return item;
}

/**
 * Format a timestamp into a relative time (Today/Yesterday) or full date
 * @param {number|string|Date} timestamp - Input timestamp
 * @returns {string} Formatted time
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = now - date;
  const oneDay = 24 * 60 * 60 * 1000;
  if (diffTime < oneDay && date.getDate() === now.getDate()) {
    // Same day: show time in HH:MM format
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffTime < 2 * oneDay && date.getDate() === now.getDate() - 1) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Generate a color hue from a string
 * @param {string} str - Input string
 * @returns {number} Hue value (0-360)
 */
function generateColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash % 360;
}

/**
 * Apply CSS styles to an element
 * @param {HTMLElement} element - Element to style
 * @param {Object} styles - Styles to apply
 */
function applyStyles(element, styles) {
  Object.assign(element.style, styles);
}

export default { renderChatView };
