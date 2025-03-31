// chat/services/messageService.js
// WebSocket client for HIPAA-compliant chat messaging

import { logChatEvent } from '../utils/logger.js';
import { getCurrentUser, getAuthToken, isAuthenticated } from './auth';
import { saveMessage, updateMessage as updateLocalMessage, deleteMessage as deleteLocalMessage, getMessageById } from '../utils/storage.js'; // Added update/delete local functions
import { updateUserPresence } from './userService.js'; // Import presence update function

// WebSocket connection configuration
// Read from localStorage or use a secure placeholder default
let WS_URL = localStorage.getItem('crmplus_chat_server_url') || 'wss://your-mcp-server.example.com';
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
let messageListeners = []; // For new messages
let messageUpdateListeners = []; // For message edits/deletions
let readReceiptListeners = []; // For read receipt updates
let connectionStatusListeners = [];
let channelListListeners = [];
let typingStatusListeners = []; // Added for typing indicators

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
    // Send logout message (optional, server might handle disconnect)
    // const logoutMessage = { type: 'logout', timestamp: new Date().toISOString() };
    // sendWebSocketMessage(logoutMessage);

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
    // Server should validate token and fetch user details itself
    // user: { id: currentUser.id, username: currentUser.username }
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

  // Use active channel if not specified and not a DM
  if (!recipientId) {
      channelId = channelId || activeChannel;
  }

  // Convert channel name to UUID if needed
  const uuidChannelId = channelId ? getChannelUUID(channelId) : null;

  // Prepare message object for WebSocket
  const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5); // Temporary client-side ID
  const timestamp = new Date().toISOString();

  const message = {
    type: 'send_message', // Or 'chat_message' depending on server expectation
    messageId: messageId, // Include client-side ID for potential confirmation matching
    content: text.trim(), // Use 'content' to match server handler
    channelId: uuidChannelId, // Send UUID format to the server
    recipientId: recipientId,
    timestamp: timestamp
  };

  // Send via WebSocket
  const wsSuccess = sendWebSocketMessage(message);

  if (wsSuccess) {
      console.log('[MessageService] Message sent via WebSocket:', message);
      logChatEvent('message', 'Message sent', { messageId, channelId, recipientId });
  } else {
      console.warn('[MessageService] Failed to send message via WebSocket:', message);
      logChatEvent('error', 'Message send failed (WebSocket)', { messageId, channelId, recipientId });
      // Optionally handle failure (e.g., show error to user, retry mechanism)
  }

  // Note: We no longer save locally immediately. We wait for the server's 'new_message' broadcast.
  // This ensures the message has a server-assigned ID and timestamp.

  return wsSuccess;
}

/**
 * Edit an existing chat message.
 * @param {string} messageId - The ID of the message to edit.
 * @param {string} newContent - The new content for the message.
 * @returns {boolean} Sending success status.
 */
function editMessage(messageId, newContent) {
    if (!messageId || !newContent || !newContent.trim() || !isAuthenticated()) {
        return false;
    }

    const message = {
        type: 'edit_message',
        messageId: messageId,
        newContent: newContent.trim(),
        timestamp: new Date().toISOString()
    };

    const success = sendWebSocketMessage(message);
    if (success) {
        logChatEvent('message', 'Edit message request sent', { messageId });
    } else {
        logChatEvent('error', 'Edit message request failed (WebSocket)', { messageId });
    }
    return success;
}

/**
 * Delete an existing chat message.
 * @param {string} messageId - The ID of the message to delete.
 * @returns {boolean} Sending success status.
 */
function deleteMessage(messageId) {
    if (!messageId || !isAuthenticated()) {
        return false;
    }

    const message = {
        type: 'delete_message',
        messageId: messageId,
        timestamp: new Date().toISOString()
    };

    const success = sendWebSocketMessage(message);
    if (success) {
        logChatEvent('message', 'Delete message request sent', { messageId });
    } else {
        logChatEvent('error', 'Delete message request failed (WebSocket)', { messageId });
    }
    return success;
}

/**
 * Send a read receipt for a specific message (used in DMs).
 * @param {string} messageId - The ID of the message that was read.
 * @returns {boolean} Sending success status.
 */
function sendReadReceipt(messageId) {
    if (!messageId || !isAuthenticated()) {
        return false;
    }

    // Check if the message exists locally and is a DM (optional optimization)
    // const localMsg = getMessageById(messageId);
    // if (!localMsg || localMsg.channel) {
    //     console.warn('[MessageService] Attempted to send read receipt for non-DM or non-existent message:', messageId);
    //     return false;
    // }

    const message = {
        type: 'read_receipt',
        messageId: messageId,
        timestamp: new Date().toISOString()
    };

    const success = sendWebSocketMessage(message);
    // No logging needed usually for read receipts to avoid noise
    return success;
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
        type: 'heartbeat', // Or 'ping'
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
  const delay = RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts - 1); // Start with base delay

  console.log(`[MessageService] Attempting reconnection in ${delay}ms (Attempt ${reconnectAttempts})`);

  // Schedule reconnection
  setTimeout(() => {
    // Only attempt if still disconnected
    if (connectionStatus === CONNECTION_STATUS.DISCONNECTED || connectionStatus === CONNECTION_STATUS.ERROR) {
        connectToServer();
    }
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
        // Handle the message data
        const newMessageData = message.data || message; // Adapt to potential nesting

        // Convert server message format to local format if needed
        const localNewMessage = {
          id: newMessageData.id, // Use server-assigned ID
          content: newMessageData.content, // Use 'content'
          sender: newMessageData.sender, // Expect sender object { id, username }
          timestamp: newMessageData.created_at || newMessageData.timestamp, // Prefer DB timestamp
          channelId: newMessageData.channel_id, // Use DB field names
          recipientId: newMessageData.recipient_id,
          edited_at: newMessageData.edited_at // Include edited status
        };

        // Save message
        saveMessage(localNewMessage);

        // Notify listeners
        notifyMessageListeners([localNewMessage]);
        break;

      case 'message_updated':
        const updatedMessageData = message.data;
        if (updatedMessageData && updatedMessageData.id) {
            // Convert server format to local format if needed
            const localUpdatedMessage = {
                id: updatedMessageData.id,
                content: updatedMessageData.content,
                sender: updatedMessageData.sender, // Expect sender object
                timestamp: updatedMessageData.created_at || updatedMessageData.timestamp,
                channelId: updatedMessageData.channel_id,
                recipientId: updatedMessageData.recipient_id,
                edited_at: updatedMessageData.edited_at // Should be present
            };
            updateLocalMessage(localUpdatedMessage.id, localUpdatedMessage); // Update local storage
            notifyMessageUpdateListeners({ type: 'update', message: localUpdatedMessage });
            logChatEvent('message', 'Received message update', { messageId: localUpdatedMessage.id });
        } else {
            console.warn('[MessageService] Received invalid message_updated event:', message);
        }
        break;

      case 'message_deleted':
        const deletedMessageData = message.data;
        if (deletedMessageData && deletedMessageData.messageId) {
            deleteLocalMessage(deletedMessageData.messageId); // Delete from local storage
            notifyMessageUpdateListeners({ type: 'delete', messageId: deletedMessageData.messageId, channelId: deletedMessageData.channelId, recipientId: deletedMessageData.recipientId });
            logChatEvent('message', 'Received message deletion', { messageId: deletedMessageData.messageId });
        } else {
            console.warn('[MessageService] Received invalid message_deleted event:', message);
        }
        break;

      case 'read_receipt_update':
        const receiptData = message.data;
        if (receiptData && receiptData.messageId) {
            // Notify listeners interested in read status changes
            notifyReadReceiptListeners(receiptData);
            // No local storage update for read receipts for now
            logChatEvent('message', 'Received read receipt update', { messageId: receiptData.messageId, readerId: receiptData.readerId });
        } else {
            console.warn('[MessageService] Received invalid read_receipt_update event:', message);
        }
        break;

      case 'authentication_response':
        handleAuthenticationResponse(message);
        break;

      case 'channel_list': // Handle direct channel list event
        if (message.data && Array.isArray(message.data)) {
            // Update channel ID mapping
            message.data.forEach(channel => {
                if (channel.id && channel.name) {
                    CHANNEL_ID_MAP[channel.name.toLowerCase()] = channel.id;
                }
            });
            notifyChannelListListeners(message.data);
        }
        break;

      case 'member_joined':
        if (message.data && message.data.userId) {
          console.log(`[MessageService] User joined channel: ${message.data.username} in ${message.data.channelId}`);
          updateUserPresence(message.data.userId, 'online'); // Call userService function
        } else {
          console.warn('[MessageService] Received member_joined event with missing data:', message.data);
        }
        break;

      case 'member_left':
         if (message.data && message.data.userId) {
          console.log(`[MessageService] User left channel: ${message.data.username} from ${message.data.channelId}`);
          updateUserPresence(message.data.userId, 'offline'); // Call userService function
        } else {
          console.warn('[MessageService] Received member_left event with missing data:', message.data);
        }
        break;

      case 'error':
        console.error('[MessageService] Server error:', message.error);
        // Optionally notify UI about specific errors
        break;

      case 'pong': // Handle heartbeat response
        // console.log('[MessageService] Pong received');
        break;

      case 'user_typing':
        // Notify listeners about typing status changes
        if (message.data) {
           notifyTypingStatusListeners(message.data);
        }
        break;

      default:
        console.warn('[MessageService] Unknown message type:', message.type);
        break;
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
 * Add a message listener (for new messages)
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
 * Notify message listeners (for new messages)
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
 * Add a message update listener (for edits/deletions)
 * @param {Function} listener - Callback for message updates ({ type: 'update'|'delete', message?, messageId?, channelId?, recipientId? })
 * @returns {Function} Unsubscribe function
 */
function addMessageUpdateListener(listener) {
    if (typeof listener !== 'function') return () => {};
    messageUpdateListeners.push(listener);
    return () => {
        messageUpdateListeners = messageUpdateListeners.filter(l => l !== listener);
    };
}

/**
 * Notify message update listeners
 * @param {Object} updateData - Data about the update/deletion
 */
function notifyMessageUpdateListeners(updateData) {
    messageUpdateListeners.forEach(listener => {
        try {
            listener(updateData);
        } catch (error) {
            console.error('[MessageService] Error in message update listener:', error);
        }
    });
}

/**
 * Add a read receipt listener
 * @param {Function} listener - Callback for read receipt updates ({ messageId, readerId, readAt })
 * @returns {Function} Unsubscribe function
 */
function addReadReceiptListener(listener) {
    if (typeof listener !== 'function') return () => {};
    readReceiptListeners.push(listener);
    return () => {
        readReceiptListeners = readReceiptListeners.filter(l => l !== listener);
    };
}

/**
 * Notify read receipt listeners
 * @param {Object} receiptData - Read receipt data
 */
function notifyReadReceiptListeners(receiptData) {
    readReceiptListeners.forEach(listener => {
        try {
            listener(receiptData);
        } catch (error) {
            console.error('[MessageService] Error in read receipt listener:', error);
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
    type: 'join_channel', // Correct type based on server docs
    channelId: uuidChannelId, // Correct key based on server docs
    timestamp: new Date().toISOString()
  };

  sendWebSocketMessage(requestMessage);

  logChatEvent('system', `Switched to channel: ${channelId}`);
}


/**
 * Add a typing status listener
 * @param {Function} listener - Callback for typing status updates ({ userId, username, isTyping, channelId?, isDirectMessage?, senderId? })
 * @returns {Function} Unsubscribe function
 */
function addTypingStatusListener(listener) {
  if (typeof listener !== 'function') return () => {};
  typingStatusListeners.push(listener);
  return () => {
    typingStatusListeners = typingStatusListeners.filter(l => l !== listener);
  };
}

/**
 * Notify typing status listeners
 * @param {Object} statusUpdate - Typing status update data
 */
function notifyTypingStatusListeners(statusUpdate) {
  typingStatusListeners.forEach(listener => {
    try {
      listener(statusUpdate);
    } catch (error) {
      console.error('[MessageService] Error in typing status listener:', error);
    }
  });
}

/**
 * Update the server URL
 * @param {string} url - New server URL
 */
function updateServerUrl(url) {
  if (!url) return;

  localStorage.setItem('crmplus_chat_server_url', url);
  WS_URL = url; // Update in-memory URL

  // Disconnect and reconnect if currently connected
  if (connectionStatus === CONNECTION_STATUS.CONNECTED || connectionStatus === CONNECTION_STATUS.CONNECTING) {
    disconnectFromServer();
    setTimeout(connectToServer, 1000);
  }

  logChatEvent('system', 'Server URL updated');
}

/**
 * Send a typing indicator status via WebSocket.
 * @param {boolean} isTyping - True if the user is typing, false if stopped.
 * @param {string} [channelId] - Optional channel ID (defaults to active channel).
 * @param {string} [recipientId] - Optional recipient ID for DMs.
 */
function sendTypingIndicator(isTyping, channelId = null, recipientId = null) {
  if (!isAuthenticated()) return;

  let targetChannelId = null;
  if (!recipientId) {
      targetChannelId = channelId || activeChannel;
      targetChannelId = getChannelUUID(targetChannelId); // Ensure UUID format
  }


  const message = {
    type: 'typing_indicator',
    isTyping: isTyping,
    channelId: targetChannelId, // Will be null for DMs
    recipientId: recipientId, // Include recipient for DMs
    timestamp: new Date().toISOString()
  };

  sendWebSocketMessage(message);
  // No local logging needed for typing indicators usually, to avoid noise.
}

// Export all functions at the end of the file
export {
  // Core connection methods
  connectToServer,
  disconnectFromServer,
  sendChatMessage,
  getConnectionStatus,

  // Message operations
  editMessage,
  deleteMessage,
  sendReadReceipt,

  // Listener management
  addMessageListener,
  addMessageUpdateListener, // Added
  addReadReceiptListener, // Added
  addConnectionStatusListener,
  // addUserListListener, // Removed if not used
  addChannelListListener,
  addTypingStatusListener, // Added

  // Specific channel and initialization methods
  initMessageService,
  getActiveChannel,
  requestChannelList,
  switchChannel,
  updateServerUrl,

  // Utility methods (mostly internal, but might be useful)
  sendWebSocketMessage,
  authenticateConnection,
  sendTypingIndicator // Added export
};