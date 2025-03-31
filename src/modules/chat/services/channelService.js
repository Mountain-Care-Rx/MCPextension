// chat/services/channelService.js
// Service for handling channel operations

import { getCurrentUser } from './auth';
import { logChatEvent } from '../utils/logger';
import { sendWebSocketMessage, getConnectionStatus } from './messageService';
import { saveChannel, getChannels, deleteChannel as deleteLocalChannel } from '../utils/storage';
import { hasPermission, getAuthToken, isAuthenticated } from './auth';

// Server base URL for REST API operations (admin operations)
const SERVER_BASE_URL = 'http://localhost:3000';

// Add debugging log for module load
console.log('[ChannelService] Module loaded');

// Maintain local channel list cache
let cachedChannels = [];
let channelListListeners = [];

// Currently active channel
let activeChannel = localStorage.getItem('crmplus_chat_active_channel') || 'general';

/**
 * Initialize the channel service
 */
export function initChannelService() {
  // Load any locally cached channels
  try {
    cachedChannels = getChannels() || [];
    console.log('[ChannelService] Loaded cached channels:', cachedChannels.length);
    
    // Initialize with default channels if none exist
    if (cachedChannels.length === 0) {
      initializeDefaultChannels();
    }
  } catch (error) {
    console.error('[ChannelService] Error loading cached channels:', error);
    cachedChannels = [];
    initializeDefaultChannels();
  }
  
  // Set up message listener to update channels when received from server
  window.addEventListener('ws_message', handleWebSocketMessage);
  
  // Log initialization
  logChatEvent('system', 'Channel service initialized');
  
  // Automatically request channel list when connected to websocket
  window.addEventListener('ws_connected', () => {
    console.log('[ChannelService] WebSocket connected, requesting channel list');
    sendWebSocketMessage({
      type: 'channel_list_request',
      timestamp: new Date().toISOString()
    });
  });
  
  return true;
}

/**
 * Initialize default channels if none exist
 */
function initializeDefaultChannels() {
  // Create default general channel
  const generalChannel = {
    id: 'general',
    name: 'General',
    description: 'General discussion channel',
    type: 'public',
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  };
  
  // Create default announcements channel
  const announcementsChannel = {
    id: 'announcements',
    name: 'Announcements',
    description: 'Important announcements',
    type: 'public',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    readonly: true // Only admins can post
  };
  
  // Save default channels
  saveChannel(generalChannel);
  saveChannel(announcementsChannel);
  
  // Set available channels
  cachedChannels = [generalChannel, announcementsChannel];
}

/**
 * Handle WebSocket messages relevant to channels
 * @param {CustomEvent} event - WebSocket message event
 */
function handleWebSocketMessage(event) {
  if (!event || !event.detail) return;
  
  const message = event.detail;
  
  if (message.type === 'channel_list_response') {
    console.log('[ChannelService] Received channel list from server:', message.channels);
    
    // Update cache with server data
    if (Array.isArray(message.channels)) {
      cachedChannels = message.channels;
      
      // Save channels to local storage for offline usage
      message.channels.forEach(channel => {
        saveChannel(channel);
      });
      
      // Notify listeners
      notifyChannelListeners(cachedChannels);
    }
  } else if (message.type === 'channel_created') {
    // Add new channel to cache
    if (message.channel) {
      cachedChannels.push(message.channel);
      saveChannel(message.channel);
      notifyChannelListeners(cachedChannels);
    }
  } else if (message.type === 'channel_updated') {
    // Update channel in cache
    if (message.channel) {
      const index = cachedChannels.findIndex(c => c.id === message.channel.id);
      if (index >= 0) {
        cachedChannels[index] = message.channel;
        saveChannel(message.channel);
        notifyChannelListeners(cachedChannels);
      }
    }
  } else if (message.type === 'channel_deleted') {
    // Remove channel from cache
    if (message.channelId) {
      cachedChannels = cachedChannels.filter(c => c.id !== message.channelId);
      deleteLocalChannel(message.channelId);
      notifyChannelListeners(cachedChannels);
    }
  }
}

/**
 * Add a channel list listener
 * @param {Function} listener - Channel list change listener
 * @returns {Function} Unsubscribe function
 */
export function addChannelListListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  channelListListeners.push(listener);
  
  // Call immediately with current channels
  setTimeout(() => {
    listener(cachedChannels);
  }, 0);
  
  return () => {
    channelListListeners = channelListListeners.filter(l => l !== listener);
  };
}

/**
 * Add a channel listener (alias for addChannelListListener for backward compatibility)
 * @param {Function} listener - Channel change listener
 * @returns {Function} Unsubscribe function
 */
export function addChannelListener(listener) {
  return addChannelListListener(listener);
}

/**
 * Notify channel list listeners of changes
 * @param {Array} channels - Updated channel list
 */
function notifyChannelListeners(channels) {
  channelListListeners.forEach(listener => {
    try {
      listener(channels);
    } catch (error) {
      console.error('[ChannelService] Error in channel listener:', error);
    }
  });
}

/**
 * Get all available channels
 * @returns {Promise<Array>} List of channels
 */
export async function getAvailableChannels() {
  console.log('[ChannelService] getAvailableChannels called');
  try {
    const user = getCurrentUser();
    
    if (!user || !user.token) {
      console.error('[ChannelService] No authenticated user');
      return cachedChannels;
    }
    
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      console.warn('[ChannelService] Not connected to server, using cached channels');
      return cachedChannels;
    }
    
    // Use WebSocket for channel list request instead of REST API
    return new Promise((resolve) => {
      const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // Set up one-time message handler for the response
      const messageHandler = (event) => {
        if (!event || !event.detail) return;
        const message = event.detail;
        
        if (message.type === 'channel_list_response') {
          // Clean up event listener
          window.removeEventListener('ws_message', messageHandler);
          
          // Resolve with channel list
          resolve(message.channels || []);
        }
      };
      
      window.addEventListener('ws_message', messageHandler);
      
      // Send channel list request via WebSocket
      sendWebSocketMessage({
        type: 'channel_list_request',
        messageId
      });
      
      // Set timeout to prevent waiting forever
      setTimeout(() => {
        window.removeEventListener('ws_message', messageHandler);
        console.warn('[ChannelService] Channel list request timed out, using cached data');
        resolve(cachedChannels);
      }, 5000);
    });
  } catch (error) {
    console.error('[ChannelService] Error getting channels:', error);
    logChatEvent('channel', 'Channel retrieval error', { error: error.message });
    
    // Return cached channels as fallback
    return cachedChannels;
  }
}

/**
 * Get channel by ID
 * @param {string} channelId - Channel ID
 * @returns {Object|null} Channel object or null if not found
 */
export function getChannelById(channelId) {
  try {
    if (!channelId) return null;
    
    // First check available channels
    const availableChannel = cachedChannels.find(c => c.id === channelId);
    if (availableChannel) return availableChannel;
    
    // Then check stored channels
    const storedChannels = getChannels();
    return storedChannels.find(c => c.id === channelId) || null;
  } catch (error) {
    console.error('[ChannelService] Error getting channel by ID:', error);
    return null;
  }
}

/**
 * Create a new channel
 * @param {Object} channelData - Channel data
 * @returns {Promise<Object>} Result with success status and created channel
 */
export async function createChannel(channelData) {
  console.log('[ChannelService] createChannel called with:', channelData);
  try {
    const user = getCurrentUser();
    
    if (!user) {
      console.error('[ChannelService] No authenticated user');
      return { success: false, error: 'Not authenticated' };
    }
    
    if (!hasPermission('channel.create')) {
      return { success: false, error: 'Permission denied' };
    }
    
    const token = getAuthToken();
    
    // Format the channel data according to server requirements
    const channelPayload = {
      name: channelData.name,
      description: channelData.description || '',
      is_private: channelData.type === 'private',
      metadata: {
        readonly: channelData.readonly || false
      }
    };
    
    console.log('[ChannelService] Sending channel creation request:', channelPayload);
    
    // First attempt - try using WebSocket for channel creation
    try {
      const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // Create a promise to wait for the server response
      const createChannelPromise = new Promise((resolve, reject) => {
        // Create one-time event handler
        const messageHandler = (event) => {
          if (!event || !event.detail) return;
          const message = event.detail;
          
          if (message.type === 'channel_created' && message.messageId === messageId) {
            // Clean up event listener
            window.removeEventListener('ws_message', messageHandler);
            window.removeEventListener('ws_error', errorHandler);
            
            if (message.error) {
              reject(new Error(message.error));
            } else {
              resolve(message.channel);
            }
          }
        };
        
        // Handle errors
        const errorHandler = (event) => {
          if (event && event.detail && event.detail.messageId === messageId) {
            // Clean up event listeners
            window.removeEventListener('ws_message', messageHandler);
            window.removeEventListener('ws_error', errorHandler);
            
            reject(new Error(event.detail.error || 'WebSocket error'));
          }
        };
        
        // Set up event listeners
        window.addEventListener('ws_message', messageHandler);
        window.addEventListener('ws_error', errorHandler);
        
        // Set timeout
        setTimeout(() => {
          window.removeEventListener('ws_message', messageHandler);
          window.removeEventListener('ws_error', errorHandler);
          reject(new Error('WebSocket channel creation timed out'));
        }, 10000);
      });
      
      // Send create channel request via WebSocket
      sendWebSocketMessage({
        type: 'channel_create',
        messageId,
        channel: channelPayload
      });
      
      // Wait for response
      const channelData = await createChannelPromise;
      
      // Create channel object from response
      const channel = {
        id: channelData.id,
        name: channelData.name,
        description: channelData.description,
        type: channelData.is_private ? 'private' : 'public',
        isPrivate: channelData.is_private,
        readonly: channelData.metadata?.readonly || false,
        createdAt: channelData.created_at
      };
      
      // Update local cache and storage
      cachedChannels.push(channel);
      saveChannel(channel);
      
      // Notify listeners
      notifyChannelListeners(cachedChannels);
      
      // Log success
      console.log('[ChannelService] Created channel successfully via WebSocket:', channel);
      logChatEvent('channel', 'Created channel', { 
        name: channelData.name,
        type: channelData.type
      });
      
      return {
        success: true,
        channel
      };
    } catch (wsError) {
      console.warn('[ChannelService] WebSocket channel creation failed, falling back to REST API:', wsError);
      
      // Fallback to REST API
      const response = await fetch(`${SERVER_BASE_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(channelPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Create channel object from response
      const channel = {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.is_private ? 'private' : 'public',
        isPrivate: data.is_private,
        readonly: data.metadata?.readonly || false,
        createdAt: data.created_at
      };
      
      // Update local cache and storage
      cachedChannels.push(channel);
      saveChannel(channel);
      
      // Notify listeners
      notifyChannelListeners(cachedChannels);
      
      // Log success
      console.log('[ChannelService] Created channel successfully via REST API:', channel);
      logChatEvent('channel', 'Created channel', { 
        name: channel.name,
        type: channel.type
      });
      
      return {
        success: true,
        channel
      };
    }
  } catch (error) {
    console.error('[ChannelService] Error creating channel:', error);
    logChatEvent('channel', 'Channel creation error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing channel
 * @param {string} channelId - Channel ID
 * @param {Object} channelData - Updated channel data
 * @returns {Promise<Object>} Result with success status and updated channel
 */
export async function updateChannel(channelId, channelData) {
  console.log('[ChannelService] updateChannel called for ID:', channelId, 'with data:', channelData);
  try {
    const user = getCurrentUser();
    
    if (!user || !user.token) {
      console.error('[ChannelService] No authenticated user');
      return { success: false, error: 'Not authenticated' };
    }
    
    if (!hasPermission('channel.update')) {
      return { success: false, error: 'Permission denied' };
    }
    
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(`${SERVER_BASE_URL}/api/channels/${channelId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: channelData.name,
        description: channelData.description || '',
        is_private: channelData.type === 'private',
        metadata: {
          readonly: channelData.readonly || false
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Create updated channel object
    const channel = {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.is_private ? 'private' : 'public',
      isPrivate: data.is_private,
      readonly: data.metadata?.readonly || false
    };
    
    // Update in cache
    const index = cachedChannels.findIndex(c => c.id === channelId);
    if (index >= 0) {
      cachedChannels[index] = {
        ...cachedChannels[index],
        ...channel
      };
    } else {
      cachedChannels.push(channel);
    }
    
    // Update in storage
    saveChannel(channel);
    
    // Notify listeners
    notifyChannelListeners(cachedChannels);
    
    // Log success
    console.log('[ChannelService] Updated channel successfully:', channel);
    logChatEvent('channel', 'Updated channel', { 
      name: channelData.name,
      id: channelId
    });
    
    return {
      success: true,
      channel
    };
  } catch (error) {
    console.error('[ChannelService] Error updating channel:', error);
    logChatEvent('channel', 'Channel update error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Delete a channel
 * @param {string} channelId - Channel ID
 * @returns {Promise<Object>} Result with success status
 */
export async function deleteChannel(channelId) {
  console.log('[ChannelService] deleteChannel called for ID:', channelId);
  try {
    const user = getCurrentUser();
    
    if (!user || !user.token) {
      console.error('[ChannelService] No authenticated user');
      return { success: false, error: 'Not authenticated' };
    }
    
    if (!hasPermission('channel.delete')) {
      return { success: false, error: 'Permission denied' };
    }
    
    // System channels cannot be deleted
    if (channelId === 'general' || channelId === 'announcements') {
      return { success: false, error: 'System channels cannot be deleted' };
    }
    
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(`${SERVER_BASE_URL}/api/channels/${channelId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server returned ${response.status}: ${response.statusText}`);
    }
    
    // Remove from cache
    cachedChannels = cachedChannels.filter(c => c.id !== channelId);
    
    // Remove from storage
    deleteLocalChannel(channelId);
    
    // Notify listeners
    notifyChannelListeners(cachedChannels);
    
    // If active channel was deleted, switch to general
    if (activeChannel === channelId) {
      setActiveChannel('general');
    }
    
    // Log success
    console.log('[ChannelService] Deleted channel successfully:', channelId);
    logChatEvent('channel', 'Deleted channel', { id: channelId });
    
    return { success: true };
  } catch (error) {
    console.error('[ChannelService] Error deleting channel:', error);
    logChatEvent('channel', 'Channel deletion error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Get channel details
 * @param {string} channelId - Channel ID
 * @returns {Promise<Object>} Channel details
 */
export async function getChannelDetails(channelId) {
  console.log('[ChannelService] getChannelDetails called for ID:', channelId);
  try {
    // First check cache
    const cachedChannel = cachedChannels.find(c => c.id === channelId);
    
    // Get live data if connected
    const connectionStatus = getConnectionStatus();
    const user = getCurrentUser();
    
    if (!user || !user.token || connectionStatus !== 'connected') {
      console.log('[ChannelService] Using cached channel details');
      return cachedChannel || null;
    }
    
    // Fetch via REST API (detailed admin view)
    const token = getAuthToken();
    if (!token) {
      return cachedChannel || null;
    }
    
    const response = await fetch(`${SERVER_BASE_URL}/api/channels/${channelId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[ChannelService] Retrieved channel details:', data);
    
    // Transform server data to client format
    const channel = {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.is_private ? 'private' : 'public',
      isPrivate: data.is_private,
      readonly: data.metadata?.readonly || false,
      createdBy: data.created_by,
      createdAt: data.created_at,
      lastActivity: data.last_activity,
      members: data.members || []
    };
    
    // Update cache
    const index = cachedChannels.findIndex(c => c.id === channelId);
    if (index >= 0) {
      cachedChannels[index] = {
        ...cachedChannels[index],
        ...channel
      };
    } else {
      cachedChannels.push(channel);
    }
    
    // Update storage
    saveChannel(channel);
    
    return channel;
  } catch (error) {
    console.error('[ChannelService] Error getting channel details:', error);
    
    // Return cached data as fallback
    return cachedChannels.find(c => c.id === channelId) || null;
  }
}

/**
 * Join a channel via WebSocket
 * @param {string} channelId - Channel ID to join
 * @returns {Promise<boolean>} Success status
 */
export async function joinChannel(channelId) {
  console.log('[ChannelService] joinChannel called for ID:', channelId);
  
  if (!channelId) return false;
  
  try {
    const user = getCurrentUser();
    
    if (!user) {
      console.error('[ChannelService] No authenticated user');
      return false;
    }
    
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      console.warn('[ChannelService] Not connected to server');
      return false;
    }
    
    // Send join channel message via WebSocket
    const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    sendWebSocketMessage({
      type: 'channel_join',
      messageId,
      channel: channelId
    });
    
    // Set as active channel
    setActiveChannel(channelId);
    
    // Log join attempt
    logChatEvent('channel', 'Joining channel', { channelId });
    
    return true;
  } catch (error) {
    console.error('[ChannelService] Error joining channel:', error);
    return false;
  }
}

/**
 * Leave a channel via WebSocket
 * @param {string} channelId - Channel ID to leave
 * @returns {Promise<boolean>} Success status
 */
export async function leaveChannel(channelId) {
  console.log('[ChannelService] leaveChannel called for ID:', channelId);
  
  if (!channelId) return false;
  
  try {
    const user = getCurrentUser();
    
    if (!user) {
      console.error('[ChannelService] No authenticated user');
      return false;
    }
    
    // Don't allow leaving default channels
    if (channelId === 'general' || channelId === 'announcements') {
      return false;
    }
    
    const connectionStatus = getConnectionStatus();
    if (connectionStatus !== 'connected') {
      console.warn('[ChannelService] Not connected to server');
      return false;
    }
    
    // Send leave channel message via WebSocket
    const messageId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    sendWebSocketMessage({
      type: 'channel_leave',
      messageId,
      channel: channelId
    });
    
    // If active channel was left, switch to general
    if (activeChannel === channelId) {
      setActiveChannel('general');
    }
    
    // Log leave attempt
    logChatEvent('channel', 'Leaving channel', { channelId });
    
    return true;
  } catch (error) {
    console.error('[ChannelService] Error leaving channel:', error);
    return false;
  }
}

/**
 * Invite a user to a channel
 * @param {string} channelId - Channel ID
 * @param {string} userId - User ID to invite
 * @returns {Promise<Object>} Invitation result
 */
export async function inviteToChannel(channelId, userId) {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }
    
    if (!hasPermission('channel.invite')) {
      return { success: false, error: 'Permission denied' };
    }
    
    const channel = getChannelById(channelId);
    if (!channel) {
      return { success: false, error: 'Channel not found' };
    }
    
    const user = getCurrentUser();
    
    // Admin operations like channel invitation still use REST API
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const response = await fetch(`${SERVER_BASE_URL}/api/channels/${channelId}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server returned ${response.status}: ${response.statusText}`);
    }
    
    const updatedChannel = await response.json();
    
    // Save to local storage
    saveChannel(updatedChannel);
    
    // Update available channels
    const channelIndex = cachedChannels.findIndex(c => c.id === channelId);
    if (channelIndex >= 0) {
      cachedChannels[channelIndex] = updatedChannel;
      
      // Notify listeners
      notifyChannelListeners(cachedChannels);
    }
    
    // Log invitation
    logChatEvent('channel', 'User invited to channel', { 
      channelId,
      channelName: channel.name,
      userId
    });
    
    return {
      success: true,
      channel: updatedChannel
    };
  } catch (error) {
    console.error('[ChannelService] Error inviting to channel:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Set the active channel
 * @param {string} channelId - Channel ID
 */
export function setActiveChannel(channelId) {
  try {
    if (!channelId) return;
    
    // Get channel
    const channel = getChannelById(channelId);
    if (!channel) {
      console.error(`[ChannelService] Channel not found: ${channelId}`);
      return;
    }
    
    // Update active channel
    activeChannel = channelId;
    
    // Save to storage
    localStorage.setItem('crmplus_chat_active_channel', channelId);
    
    // Log channel switch
    logChatEvent('channel', 'Switched active channel', { 
      channelId,
      channelName: channel.name
    });
  } catch (error) {
    console.error('[ChannelService] Error setting active channel:', error);
  }
}

/**
 * Get the active channel
 * @returns {string} Active channel ID
 */
export function getActiveChannel() {
  return activeChannel;
}

/**
 * Get the active channel object
 * @returns {Object|null} Active channel object
 */
export function getActiveChannelObject() {
  return getChannelById(activeChannel);
}

/**
 * Search for channels by name or description
 * @param {string} query - Search query
 * @returns {Array} Matching channels
 */
export function searchChannels(query) {
  try {
    if (!query || typeof query !== 'string') return cachedChannels;
    
    const normalizedQuery = query.toLowerCase();
    
    return cachedChannels.filter(channel => 
      channel.name.toLowerCase().includes(normalizedQuery) ||
      (channel.description && channel.description.toLowerCase().includes(normalizedQuery))
    );
  } catch (error) {
    console.error('[ChannelService] Error searching channels:', error);
    return [];
  }
}

/**
 * Update available channels list
 * @param {Array} channels - Array of channel objects
 */
export function updateAvailableChannels(channels) {
  try {
    if (!Array.isArray(channels)) return;
    
    // Update available channels list
    cachedChannels = channels;
    
    // Update cached channel data
    channels.forEach(channel => {
      saveChannel(channel);
    });
    
    // Notify listeners
    notifyChannelListeners(cachedChannels);
  } catch (error) {
    console.error('[ChannelService] Error updating available channels:', error);
  }
}

/**
 * Generate a channel ID from name
 * @param {string} name - Channel name
 * @returns {string} Generated channel ID
 */
export function generateChannelId(name) {
  // Replace spaces with underscores, remove special characters, and make lowercase
  const baseId = name.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  
  // Add timestamp to ensure uniqueness
  return `${baseId}_${Date.now().toString(36)}`;
}

/**
 * Clean up resources
 */
export function cleanup() {
  // Remove event listener
  window.removeEventListener('ws_message', handleWebSocketMessage);
  
  // Clear listeners
  channelListListeners = [];
}

// Automatic initialization if not part of a test environment
if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
  initChannelService();
}

// Export the hasPermission function for convenience
export { hasPermission };