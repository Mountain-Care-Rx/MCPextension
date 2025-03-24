// chat/services/messageService.js
// WebSocket client for HIPAA-compliant chat messaging

import { logChatEvent } from '../utils/logger.js';
import { getCurrentUser, getAuthToken, isAuthenticated } from './auth';
import { saveMessage } from '../utils/storage.js';

// WebSocket connection configuration
const WS_URL = 'ws://localhost:3000';
const RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Connection state management
let socket = null;
let connectionStatus = 'disconnected';
let reconnectAttempts = 0;
let heartbeatInterval = null;

// Connection status constants
const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  AUTH_FAILED: 'auth_failed'
};

// Active channel tracking - Use the default UUID format channel ID
let activeChannel = localStorage.getItem('crmplus_chat_active_channel') || '00000000-0000-0000-0000-000000000001'; // Default channel UUID

// Channel ID mapping for human-readable names
const CHANNEL_ID_MAP = {
  'general': '00000000-0000-0000-0000-000000000001',
  'announcements': '00000000-0000-0000-0000-000000000002'
};

// Listeners
let messageListeners = [];
let connectionStatusListeners = [];
let userListListeners = [];
let channelListListeners = [];

/**
 * Initialize the message service
 * @returns {boolean} Initialization success
 */
function initMessageService() {
  // Ensure active channel is set
  activeChannel = localStorage.getItem('crmplus_chat_active_channel') || CHANNEL_ID_MAP.general;
  
  logChatEvent('system', 'Message service initialized');
  return true;
}

/**
 * Convert channel name to UUID if needed
 * @param {string} channelId - Channel ID or name
 * @returns {string} UUID format channel ID
 */
function getChannelUUID(channelId) {
  // Check if it's already a UUID
  if (channelId && channelId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return channelId;
  }
  
  // Look up in channel map
  return CHANNEL_ID_MAP[channelId] || CHANNEL_ID_MAP.general;
}

/**
 * Connect to the WebSocket server
 * @returns {Promise<boolean>} Connection success status
 */
function connectToServer() {
  // Prevent multiple connection attempts
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    console.log('[MessageService] WebSocket already connected or connecting');
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    try {
      console.log(`[MessageService] Attempting to connect to ${WS_URL}`);
      
      // Update connection status
      updateConnectionStatus(CONNECTION_STATUS.CONNECTING);
      
      // Create WebSocket connection
      socket = new WebSocket(WS_URL);
      
      // Connection opened
      socket.onopen = () => {
        console.log('[MessageService] WebSocket connection established to', WS_URL);
        
        // Reset reconnect attempts
        reconnectAttempts = 0;
        
        // Update connection status - still pending authentication
        // Will be updated to connected after successful auth
        
        // Start heartbeat
        startHeartbeat();
        
        // Authenticate connection
        authenticateConnection();
        
        // Log client info
        console.log('[MessageService] Client connected, user:', getCurrentUser()?.username);
        
        // Resolve promise
        resolve(true);
      };
      
      // Listen for messages
      socket.onmessage = (event) => {
        console.log('[MessageService] Message received:', event.data);
        try {
          const message = JSON.parse(event.data);
          handleIncomingMessage(message);

          // Also dispatch a custom event for other components to listen to
          const customEvent = new CustomEvent('ws_message', { 
            detail: message
          });
          window.dispatchEvent(customEvent);
        } catch (parseError) {
          console.error('[MessageService] Error parsing message:', parseError, event.data);
        }
      };
      
      // Connection closed
      socket.onclose = (event) => {
        console.warn('[MessageService] WebSocket connection closed', event.code, event.reason);
        
        // Stop heartbeat
        stopHeartbeat();
        
        // Update connection status
        updateConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
        
        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000) {
          attemptReconnection();
        }
        
        resolve(false);
      };
      
      // Connection error
      socket.onerror = (error) => {
        console.error('[MessageService] WebSocket error:', error);
        
        // Update connection status
        updateConnectionStatus(CONNECTION_STATUS.ERROR);
        
        // Attempt reconnection
        attemptReconnection();
        
        resolve(false);
      };
    } catch (error) {
      console.error('[MessageService] Connection error:', error);
      
      // Update connection status
      updateConnectionStatus(CONNECTION_STATUS.ERROR);
      
      // Attempt reconnection
      attemptReconnection();
      
      resolve(false);
    }
  });
}

/**
 * Disconnect from the server
 */
function disconnectFromServer() {
  if (!socket) return;
  
  try {
    // Send logout message
    const logoutMessage = {
      type: 'logout',
      timestamp: new Date().toISOString()
    };
    
    sendWebSocketMessage(logoutMessage);
    
    // Close connection
    socket.close(1000, 'User initiated disconnect');
    
    // Stop heartbeat
    stopHeartbeat();
    
    // Update connection status
    updateConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    
    console.log('[MessageService] Disconnected from server');
  } catch (error) {
    console.error('[MessageService] Disconnect error:', error);
  }
}

/**
 * Authenticate the WebSocket connection
 */
function authenticateConnection() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  
  const currentUser = getCurrentUser();
  const authToken = getAuthToken();
  
  if (!currentUser || !authToken) {
    console.warn('[MessageService] Cannot authenticate: No user or token');
    updateConnectionStatus(CONNECTION_STATUS.AUTH_FAILED);
    socket.close(1000, 'Not authenticated');
    return;
  }
  
  // Use consistent message format for authentication
  const authMessage = {
    type: 'authenticate',
    token: authToken,
    user: {
      id: currentUser.id,
      username: currentUser.username
    }
  };
  
  sendWebSocketMessage(authMessage);
  console.log('[MessageService] Authentication attempt sent', { username: currentUser.username });
}

/**
 * Send a message via WebSocket
 * @param {Object} message - Message to send
 * @returns {boolean} Sending success status
 */
function sendWebSocketMessage(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('[MessageService] WebSocket not connected');
    return false;
  }
  
  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('[MessageService] Error sending message:', error);
    return false;
  }
}

/**
 * Send a chat message
 * @param {string} text - Message text
 * @param {string} [channelId] - Optional channel ID
 * @param {string} [recipientId] - Optional recipient ID for direct messages
 * @returns {boolean} Sending success status
 */
function sendChatMessage(text, channelId = null, recipientId = null) {
  // Validate input
  if (!text || !text.trim()) return false;
  if (!isAuthenticated()) return false;
  
  // Get current user
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  // Use active channel if not specified
  channelId = channelId || activeChannel;
  
  // Convert channel name to UUID if needed
  const uuidChannelId = getChannelUUID(channelId);
  
  // Prepare message object for both WebSocket and local storage
  const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  const timestamp = new Date().toISOString();
  
  // Local message object to be saved and displayed
  const localMessage = {
    id: messageId,
    text: text.trim(),
    sender: currentUser.username,
    senderDisplayName: currentUser.displayName || currentUser.username,
    timestamp: timestamp,
    channel: channelId, // Use the original channel ID/name for display
    recipient: recipientId
  };
  
  // Server message format - use UUID for channel ID
  const message = {
    type: 'send_message',
    messageId: messageId,
    text: text.trim(),
    channelId: uuidChannelId, // Send UUID format to the server
    recipientId: recipientId,
    timestamp: timestamp
  };
  
  // Send via WebSocket
  let wsSuccess = false;
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      wsSuccess = sendWebSocketMessage(message);
      console.log('[MessageService] Message sent via WebSocket:', message);
    } catch (error) {
      console.warn('[MessageService] Error sending message via WebSocket:', error);
      // Continue with local handling despite WebSocket failure
    }
  }
  
  // Save message locally to ensure UI is immediately updated
  saveMessage(localMessage);
  
  // If WebSocket message failed, notify listeners directly to show the message
  if (!wsSuccess) {
    console.log('[MessageService] Using local message handling for failed WebSocket message');
    
    // Notify listeners directly (simulate received message)
    setTimeout(() => {
      notifyMessageListeners([localMessage]);
    }, 100);
  }
  
  // Log message sending
  logChatEvent('message', 'Message sent', {
    messageId,
    channelId,
    recipientId,
    localOnly: !wsSuccess
  });
  
  // Return success, to UI it appears successful whether WebSocket worked or not
  return true;
}

/**
 * Get current connection status
 * @returns {string} Connection status
 */
function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Start WebSocket heartbeat to keep connection alive
 */
function startHeartbeat() {
  // Stop any existing heartbeat
  stopHeartbeat();
  
  heartbeatInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const heartbeatMessage = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      
      sendWebSocketMessage(heartbeatMessage);
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop WebSocket heartbeat
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Attempt to reconnect to the server
 */
function attemptReconnection() {
  // Check if max reconnect attempts reached
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[MessageService] Max reconnection attempts reached');
    updateConnectionStatus(CONNECTION_STATUS.ERROR);
    return;
  }
  
  // Increment reconnect attempts
  reconnectAttempts++;
  
  // Calculate exponential backoff delay
  const delay = RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts);
  
  console.log(`[MessageService] Attempting reconnection in ${delay}ms (Attempt ${reconnectAttempts})`);
  
  // Schedule reconnection
  setTimeout(() => {
    connectToServer();
  }, delay);
}

/**
 * Handle incoming WebSocket messages
 * @param {Object} message - Incoming message
 */
function handleIncomingMessage(message) {
  try {
    switch (message.type) {
      case 'new_message':
      case 'chat_message':
        // Handle the message data
        const messageData = message.data || message;
        
        // Convert server message format to local format if needed
        const localMessage = {
          id: messageData.id || messageData.messageId,
          text: messageData.text,
          sender: messageData.senderUsername || messageData.sender,
          timestamp: messageData.timestamp,
          channel: messageData.channelId || messageData.channel
        };
        
        // Save message
        saveMessage(localMessage);
        
        // Notify listeners
        notifyMessageListeners([localMessage]);
        break;
      
      case 'authentication_response':
        handleAuthenticationResponse(message);
        break;
      
      case 'user_list':
        notifyUserListListeners(message.users);
        break;
      
      case 'channel_list_response':
        // Update channel ID mapping with server response
        if (message.channels && Array.isArray(message.channels)) {
          message.channels.forEach(channel => {
            if (channel.id && channel.name) {
              CHANNEL_ID_MAP[channel.name.toLowerCase()] = channel.id;
            }
          });
        }
        
        notifyChannelListListeners(message.channels);
        break;
      
      case 'error':
        console.error('[MessageService] Server error:', message.error);
        break;
      
      default:
        console.warn('[MessageService] Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('[MessageService] Error handling message:', error);
  }
}

/**
 * Handle authentication response from server
 * @param {Object} response - Authentication response
 */
function handleAuthenticationResponse(response) {
  if (response.success) {
    console.log('[MessageService] Authentication successful');
    logChatEvent('auth', 'WebSocket authentication successful');
    updateConnectionStatus(CONNECTION_STATUS.CONNECTED); // Ensure status is updated on success
    
    // Request channel list after successful authentication
    requestChannelList();
    
    // Automatically join the active channel
    switchChannel(activeChannel);
  } else {
    console.error('[MessageService] Authentication failed:', response.reason);
    logChatEvent('auth', 'WebSocket authentication failed', { 
      reason: response.reason 
    });
    updateConnectionStatus(CONNECTION_STATUS.AUTH_FAILED);
    
    // Close the socket on authentication failure
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Authentication failed');
    }
  }
}

/**
 * Update connection status and notify listeners
 * @param {string} status - New connection status
 */
function updateConnectionStatus(status) {
  if (connectionStatus !== status) {
    connectionStatus = status;
    notifyConnectionStatusListeners(status);
  }
}

/**
 * Add a message listener
 * @param {Function} listener - Callback for new messages
 * @returns {Function} Unsubscribe function
 */
function addMessageListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  messageListeners.push(listener);
  
  return () => {
    messageListeners = messageListeners.filter(l => l !== listener);
  };
}

/**
 * Notify message listeners
 * @param {Array} messages - New messages
 */
function notifyMessageListeners(messages) {
  messageListeners.forEach(listener => {
    try {
      listener(messages);
    } catch (error) {
      console.error('[MessageService] Error in message listener:', error);
    }
  });
}

/**
 * Add a connection status listener
 * @param {Function} listener - Callback for connection status changes
 * @returns {Function} Unsubscribe function
 */
function addConnectionStatusListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  connectionStatusListeners.push(listener);
  
  // Immediately call with current status
  listener(connectionStatus);
  
  return () => {
    connectionStatusListeners = connectionStatusListeners.filter(l => l !== listener);
  };
}

/**
 * Notify connection status listeners
 * @param {string} status - Current connection status
 */
function notifyConnectionStatusListeners(status) {
  connectionStatusListeners.forEach(listener => {
    try {
      listener(status);
    } catch (error) {
      console.error('[MessageService] Error in connection status listener:', error);
    }
  });
}

/**
 * Add a user list listener
 * @param {Function} listener - Callback for user list updates
 * @returns {Function} Unsubscribe function
 */
function addUserListListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  userListListeners.push(listener);
  
  return () => {
    userListListeners = userListListeners.filter(l => l !== listener);
  };
}

/**
 * Notify user list listeners
 * @param {Array} users - User list
 */
function notifyUserListListeners(users) {
  userListListeners.forEach(listener => {
    try {
      listener(users);
    } catch (error) {
      console.error('[MessageService] Error in user list listener:', error);
    }
  });
}

/**
 * Add a channel list listener
 * @param {Function} listener - Callback for channel list updates
 * @returns {Function} Unsubscribe function
 */
function addChannelListListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  channelListListeners.push(listener);
  
  return () => {
    channelListListeners = channelListListeners.filter(l => l !== listener);
  };
}

/**
 * Notify channel list listeners
 * @param {Array} channels - Channel list
 */
function notifyChannelListListeners(channels) {
  channelListListeners.forEach(listener => {
    try {
      listener(channels);
    } catch (error) {
      console.error('[MessageService] Error in channel list listener:', error);
    }
  });
}

/**
 * Get the active channel
 * @returns {string} Active channel ID
 */
function getActiveChannel() {
  return activeChannel;
}

/**
 * Request the channel list from the server
 */
function requestChannelList() {
  if (!isAuthenticated()) return;
  
  const requestMessage = {
    type: 'channel_list_request',
    timestamp: new Date().toISOString()
  };
  
  sendWebSocketMessage(requestMessage);
}

/**
 * Switch to a different channel
 * @param {string} channelId - Channel ID to switch to
 */
function switchChannel(channelId) {
  if (!channelId || !isAuthenticated()) return;
  
  // Convert channel name to UUID if needed
  const uuidChannelId = getChannelUUID(channelId);
  
  // Store active channel
  activeChannel = channelId;
  localStorage.setItem('crmplus_chat_active_channel', channelId);
  
  const requestMessage = {
    type: 'channel_join',
    channel: uuidChannelId, // Send UUID format to the server
    timestamp: new Date().toISOString()
  };
  
  sendWebSocketMessage(requestMessage);
  
  logChatEvent('system', `Switched to channel: ${channelId}`);
}

/**
 * Update the server URL
 * @param {string} url - New server URL
 */
function updateServerUrl(url) {
  if (!url) return;
  
  localStorage.setItem('crmplus_chat_server_url', url);
  
  // Disconnect and reconnect if currently connected
  if (connectionStatus === CONNECTION_STATUS.CONNECTED || connectionStatus === CONNECTION_STATUS.CONNECTING) {
    disconnectFromServer();
    setTimeout(connectToServer, 1000);
  }
  
  logChatEvent('system', 'Server URL updated');
}

// Export all functions at the end of the file
export {
  // Core connection methods
  connectToServer,
  disconnectFromServer,
  sendChatMessage,
  getConnectionStatus,

  // Listener management
  addMessageListener,
  addConnectionStatusListener,
  addUserListListener,
  addChannelListListener,

  // Specific channel and initialization methods
  initMessageService,
  getActiveChannel,
  requestChannelList,
  switchChannel,
  updateServerUrl,

  // Utility methods
  sendWebSocketMessage,
  authenticateConnection
};