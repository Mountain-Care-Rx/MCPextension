// chat/services/channel/channelService.js
// Service for handling channel operations

import { getCurrentUser } from '../auth';
import { logChatEvent } from '../../utils/logger';
import { sendWebSocketMessage, getConnectionStatus } from '../messageService';
import { saveChannel, getChannels, deleteChannel as deleteLocalChannel } from '../../utils/storage';

// Server base URL for REST API operations (admin operations)
const SERVER_BASE_URL = 'http://localhost:3000';

// Add debugging log for module load
console.log('[ChannelService] Module loaded');

// Maintain local channel list cache
let cachedChannels = [];
let channelListListeners = [];

/**
 * Initialize the channel service
 */
export function initChannelService() {
  // Load any locally cached channels
  try {
    cachedChannels = getChannels() || [];
    console.log('[ChannelService] Loaded cached channels:', cachedChannels.length);
  } catch (error) {
    console.error('[ChannelService] Error loading cached channels:', error);
    cachedChannels = [];
  }
  
  // Set up message listener to update channels when received from server
  window.addEventListener('ws_message', handleWebSocketMessage);
  
  return true;
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
 * Create a new channel
 * @param {Object} channelData - Channel data
 * @returns {Promise<Object>} Result with success status and created channel
 */
export async function createChannel(channelData) {
  console.log('[ChannelService] createChannel called with:', channelData);
  try {
    const user = getCurrentUser();
    
    if (!user || !user.token) {
      console.error('[ChannelService] No authenticated user');
      return { success: false, error: 'Not authenticated' };
    }
    
    // Admin operations like channel creation still use REST API
    const response = await fetch(`${SERVER_BASE_URL}/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
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
    
    // Create channel object
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
    console.log('[ChannelService] Created channel successfully:', channel);
    logChatEvent('channel', 'Created channel', { 
      name: channelData.name,
      type: channelData.type
    });
    
    return {
      success: true,
      channel
    };
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
    
    const response = await fetch(`${SERVER_BASE_URL}/channels/${channelId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
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
    
    // System channels cannot be deleted
    if (channelId === 'general' || channelId === 'announcements') {
      return { success: false, error: 'System channels cannot be deleted' };
    }
    
    const response = await fetch(`${SERVER_BASE_URL}/channels/${channelId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
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
    const response = await fetch(`${SERVER_BASE_URL}/channels/${channelId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
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
    
    // Log leave attempt
    logChatEvent('channel', 'Leaving channel', { channelId });
    
    return true;
  } catch (error) {
    console.error('[ChannelService] Error leaving channel:', error);
    return false;
  }
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

// Automatic initialization
initChannelService();