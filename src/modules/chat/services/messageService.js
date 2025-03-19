// chat/services/messageService.js
// WebSocket client for HIPAA-compliant chat messaging

import { logChatEvent } from '../utils/logger.js';
import { encryptMessage, decryptMessage } from '../utils/encryption.js';
import { getCurrentUser, getAuthToken, isAuthenticated } from './authService.js';
import { saveMessage } from '../utils/storage.js';

// WebSocket connection
let socket = null;

// Connection status
let connectionStatus = 'disconnected';

// Server URL - will be configurable by the user
let serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';

// Track reconnection attempts
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds

// Heartbeat interval to ensure connection stays alive
let heartbeatInterval = null;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Message listeners
let messageListeners = [];
let userListListeners = [];
let channelListListeners = [];
let connectionStatusListeners = [];

// Currently active channel
let activeChannel = 'general';

/**
 * Initialize the message service
 */
export function initMessageService() {
  // Load saved settings
  loadSettings();
  
  // Log initialization
  logChatEvent('system', 'Message service initialized');
  
  console.log('[CRM Extension] Message service initialized');
  
  return true;
}

/**
 * Load saved settings from localStorage
 */
function loadSettings() {
  serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
  activeChannel = localStorage.getItem('crmplus_chat_active_channel') || 'general';
}

/**
 * Connect to the WebSocket server
 * @returns {Promise<boolean>} Success status
 */
export function connectToServer() {
  return new Promise((resolve) => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('[CRM Extension] WebSocket is already connected or connecting');
      updateConnectionStatus('connected');
      resolve(true);
      return;
    }
    
    try {
      console.log(`[CRM Extension] Connecting to WebSocket server: ${serverUrl}`);
      
      // Create new WebSocket connection
      socket = new WebSocket(serverUrl);
      
      // Set connection status to connecting
      updateConnectionStatus('connecting');
      
      // Setup event handlers
      socket.onopen = () => {
        console.log('[CRM Extension] WebSocket connection established');
        updateConnectionStatus('connected');
        reconnectAttempts = 0;
        
        // Send authentication message
        sendAuthMessage();
        
        // Start heartbeat
        startHeartbeat();
        
        // Log successful connection
        logChatEvent('system', 'Connected to chat server');
        
        resolve(true);
      };
      
      socket.onmessage = (event) => {
        handleMessage(event.data);
      };
      
      socket.onclose = (event) => {
        console.log(`[CRM Extension] WebSocket connection closed: ${event.code} - ${event.reason}`);
        updateConnectionStatus('disconnected');
        
        // Stop heartbeat
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        
        // Log disconnection
        logChatEvent('system', `Disconnected from chat server: ${event.code}`);
        
        // Attempt to reconnect if not closed intentionally
        if (event.code !== 1000 && event.code !== 1001) {
          attemptReconnect();
        }
        
        resolve(false);
      };
      
      socket.onerror = (error) => {
        console.error('[CRM Extension] WebSocket error:', error);
        updateConnectionStatus('error');
        
        // Log error
        logChatEvent('system', 'WebSocket error occurred', { error: 'Connection error' });
        
        resolve(false);
      };
    } catch (error) {
      console.error('[CRM Extension] Error connecting to WebSocket server:', error);
      updateConnectionStatus('error');
      
      // Log error
      logChatEvent('system', 'Failed to connect to chat server', { error: error.message });
      
      resolve(false);
    }
  });
}

/**
 * Update the connection status and notify listeners
 * @param {string} status - New connection status
 */
function updateConnectionStatus(status) {
  if (connectionStatus !== status) {
    connectionStatus = status;
    
    // Notify listeners
    notifyConnectionStatusListeners();
  }
}

/**
 * Send authentication message to the server
 */
function sendAuthMessage() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  
  const authToken = getAuthToken();
  const user = getCurrentUser();
  
  if (!authToken || !user) {
    // Can't authenticate without credentials
    return;
  }
  
  const authMessage = {
    type: 'auth',
    token: authToken,
    username: user.username,
    timestamp: new Date().toISOString()
  };
  
  socket.send(JSON.stringify(authMessage));
  
  // Log authentication attempt (without token for security)
  logChatEvent('system', 'Sent authentication request');
}

/**
 * Start the heartbeat to keep the connection alive
 */
function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const heartbeatMessage = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      
      socket.send(JSON.stringify(heartbeatMessage));
    }
  }, HEARTBEAT_INTERVAL);
}

/**
 * Attempt to reconnect to the server
 */
function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log('[CRM Extension] Maximum reconnection attempts reached');
    return;
  }
  
  reconnectAttempts++;
  
  // Calculate delay with exponential backoff
  const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1);
  
  console.log(`[CRM Extension] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts})`);
  
  setTimeout(() => {
    connectToServer();
  }, delay);
}

/**
 * Handle incoming WebSocket messages
 * @param {string} data - The message data
 */
function handleMessage(data) {
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'chat':
        handleChatMessage(message);
        break;
        
      case 'user_list':
        handleUserListUpdate(message.users);
        break;
        
      case 'channel_list':
        handleChannelListUpdate(message.channels);
        break;
        
      case 'auth_response':
        if (message.success) {
          console.log('[CRM Extension] Authentication successful');
          logChatEvent('system', 'Authentication successful');
          
          // Fetch initial data
          requestChannelList();
          switchChannel(activeChannel);
        } else {
          console.error('[CRM Extension] Authentication failed:', message.reason);
          logChatEvent('system', 'Authentication failed', { reason: message.reason });
        }
        break;
        
      case 'error':
        console.error('[CRM Extension] Server error:', message.message);
        logChatEvent('error', `Server error: ${message.message}`);
        break;
        
      case 'heartbeat_response':
        // Server responded to our heartbeat, connection is alive
        break;
        
      default:
        console.log('[CRM Extension] Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('[CRM Extension] Error parsing WebSocket message:', error);
  }
}

/**
 * Handle a chat message
 * @param {Object} message - The chat message
 */
function handleChatMessage(message) {
  // Decrypt the message if it's encrypted
  let decryptedMessage = message;
  if (message.encrypted) {
    try {
      decryptedMessage = decryptMessage(message);
    } catch (error) {
      console.error('[CRM Extension] Failed to decrypt message:', error);
      // Still show the message but mark as encrypted
      decryptedMessage = {
        ...message,
        text: '[Encrypted message - unable to decrypt]'
      };
    }
  }
  
  // Save to local storage
  saveMessage(decryptedMessage);
  
  // Log the message receipt (but not content for privacy)
  logChatEvent('message', `Received message from ${message.sender}`, {
    messageId: message.id,
    channel: message.channel || 'general'
  });
  
  // Notify message listeners
  notifyMessageListeners([decryptedMessage]);
}

/**
 * Handle user list update
 * @param {Array} users - List of online users
 */
function handleUserListUpdate(users) {
  notifyUserListListeners(users);
}

/**
 * Handle channel list update
 * @param {Array} channels - List of available channels
 */
function handleChannelListUpdate(channels) {
  notifyChannelListListeners(channels);
}

/**
 * Send a message to the server
 * @param {Object} message - The message to send
 * @returns {boolean} Success status
 */
function sendToServer(message) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('[CRM Extension] WebSocket is not connected');
    return false;
  }
  
  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('[CRM Extension] Error sending message:', error);
    return false;
  }
}

/**
 * Send a chat message
 * @param {string} text - Message text
 * @param {string} channel - Target channel (default: active channel)
 * @param {string} recipient - Optional direct message recipient
 * @returns {boolean} Success status
 */
export function sendChatMessage(text, channel = null, recipient = null) {
  if (!text || !text.trim()) return false;
  if (!isAuthenticated()) return false;
  
  const currentUser = getCurrentUser();
  if (!currentUser) return false;
  
  const targetChannel = channel || activeChannel;
  
  const message = {
    id: generateMessageId(),
    sender: currentUser.username,
    senderDisplayName: currentUser.displayName || currentUser.username,
    text: text.trim(),
    channel: targetChannel,
    recipient: recipient,
    timestamp: new Date().toISOString(),
    type: 'chat'
  };
  
  // Encrypt the message
  const encryptedMessage = encryptMessage(message);
  
  // Send through the WebSocket
  const success = sendToServer(encryptedMessage);
  
  if (success) {
    // Save to local storage (use the unencrypted version)
    saveMessage(message);
    
    // Log the message sending (but not content for privacy)
    logChatEvent('message', `Sent message to ${recipient || targetChannel}`, {
      messageId: message.id,
      timestamp: message.timestamp
    });
    
    // Also notify local listeners of the message
    notifyMessageListeners([message]);
  }
  
  return success;
}

/**
 * Disconnect from the server
 */
export function disconnectFromServer() {
  if (!socket) return;
  
  try {
    // Send logout message
    const logoutMessage = {
      type: 'logout',
      timestamp: new Date().toISOString()
    };
    
    socket.send(JSON.stringify(logoutMessage));
    
    // Close connection
    socket.close(1000, 'User disconnected');
    
    // Update connection status
    updateConnectionStatus('disconnected');
    
    // Stop heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    // Log disconnection
    logChatEvent('system', 'Disconnected from chat server');
    
    console.log('[CRM Extension] Disconnected from WebSocket server');
  } catch (error) {
    console.error('[CRM Extension] Error disconnecting from WebSocket server:', error);
  }
}

/**
 * Get the current connection status
 * @returns {string} Connection status
 */
export function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Add a connection status listener
 * @param {Function} listener - Function to call with status updates
 * @returns {Function} Function to remove the listener
 */
export function addConnectionStatusListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  connectionStatusListeners.push(listener);
  
  // Immediately call with current status
  listener(connectionStatus);
  
  return () => {
    connectionStatusListeners = connectionStatusListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all connection status listeners
 */
function notifyConnectionStatusListeners() {
  connectionStatusListeners.forEach(listener => {
    try {
      listener(connectionStatus);
    } catch (error) {
      console.error('[CRM Extension] Error in connection status listener:', error);
    }
  });
}

/**
 * Add a message listener
 * @param {Function} listener - Function to call with new messages
 * @returns {Function} Function to remove the listener
 */
export function addMessageListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  messageListeners.push(listener);
  
  return () => {
    messageListeners = messageListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all message listeners
 * @param {Array} messages - Array of messages
 */
function notifyMessageListeners(messages) {
  messageListeners.forEach(listener => {
    try {
      listener(messages);
    } catch (error) {
      console.error('[CRM Extension] Error in message listener:', error);
    }
  });
}

/**
 * Add a user list listener
 * @param {Function} listener - Function to call with user list updates
 * @returns {Function} Function to remove the listener
 */
export function addUserListListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  userListListeners.push(listener);
  
  return () => {
    userListListeners = userListListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all user list listeners
 * @param {Array} users - Array of users
 */
function notifyUserListListeners(users) {
  userListListeners.forEach(listener => {
    try {
      listener(users);
    } catch (error) {
      console.error('[CRM Extension] Error in user list listener:', error);
    }
  });
}

/**
 * Add a channel list listener
 * @param {Function} listener - Function to call with channel list updates
 * @returns {Function} Function to remove the listener
 */
export function addChannelListListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  channelListListeners.push(listener);
  
  return () => {
    channelListListeners = channelListListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all channel list listeners
 * @param {Array} channels - Array of channels
 */
function notifyChannelListListeners(channels) {
  channelListListeners.forEach(listener => {
    try {
      listener(channels);
    } catch (error) {
      console.error('[CRM Extension] Error in channel list listener:', error);
    }
  });
}

/**
 * Generate a unique message ID
 * @returns {string} Unique message ID
 */
function generateMessageId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Request the list of available channels
 */
export function requestChannelList() {
  if (!isAuthenticated()) return;
  
  const requestMessage = {
    type: 'channel_list_request',
    timestamp: new Date().toISOString()
  };
  
  sendToServer(requestMessage);
}

/**
 * Switch to a different channel
 * @param {string} channelId - ID of the channel to switch to
 */
export function switchChannel(channelId) {
  if (!channelId || !isAuthenticated()) return;
  
  // Store active channel
  activeChannel = channelId;
  localStorage.setItem('crmplus_chat_active_channel', channelId);
  
  // Request channel messages
  const requestMessage = {
    type: 'channel_join',
    channel: channelId,
    timestamp: new Date().toISOString()
  };
  
  sendToServer(requestMessage);
  
  // Log channel switch
  logChatEvent('system', `Switched to channel: ${channelId}`);
}

/**
 * Get the active channel
 * @returns {string} Active channel ID
 */
export function getActiveChannel() {
  return activeChannel;
}

/**
 * Create a new channel
 * @param {Object} channelData - Channel data
 * @returns {Promise<boolean>} Success status
 */
export async function createChannel(channelData) {
  if (!isAuthenticated()) return false;
  
  const createMessage = {
    type: 'channel_create',
    channel: channelData,
    timestamp: new Date().toISOString()
  };
  
  return sendToServer(createMessage);
}

/**
 * Update the server URL
 * @param {string} url - New server URL
 */
export function updateServerUrl(url) {
  if (!url) return;
  
  serverUrl = url;
  localStorage.setItem('crmplus_chat_server_url', url);
  
  // If connected, reconnect to the new URL
  if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
    disconnectFromServer();
    setTimeout(() => {
      connectToServer();
    }, 1000);
  }
  
  logChatEvent('system', 'Server URL updated');
}