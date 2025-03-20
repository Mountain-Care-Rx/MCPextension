// chat/services/userService.js
// Enhanced user service with robust status management and user operations

import { logChatEvent } from '../utils/logger.js';
import { getUsers, saveUser, getSetting, saveSetting } from '../utils/storage.js';
import { 
  getCurrentUser, 
  getAuthToken, 
  isAuthenticated 
} from './auth';

// Import user management operations
import { 
  createUser as createUserOperation,
  updateUser as updateUserOperation,
  deleteUser as deleteUserOperation 
} from './auth/userOperations.js';

// User status configuration
export const UserStatus = {
  ONLINE: 'online',
  AWAY: 'away',
  BUSY: 'busy',
  INVISIBLE: 'invisible'
};

// Online users tracking
let onlineUsers = [];

// User status listeners
let userStatusListeners = [];

/**
 * Initialize user service
 * @returns {boolean} Initialization success
 */
export function initUserService() {
  try {
    // Load cached users
    loadCachedUsers();
    
    // Log initialization
    logChatEvent('system', 'User service initialized');
    
    return true;
  } catch (error) {
    console.error('[CRM Extension] User service init error:', error);
    return false;
  }
}

/**
 * Load cached users from storage
 */
function loadCachedUsers() {
  const users = getUsers();
  if (users.length > 0) {
    // Mark all users as offline initially
    users.forEach(user => {
      user.status = user.status || UserStatus.ONLINE;
      user.lastSeen = user.lastSeen || new Date().toISOString();
    });
  }
}

/**
 * Create a new user
 * @param {Object} userData - User creation data
 * @returns {Promise<Object>} User creation result
 */
export async function createUser(userData) {
  try {
    // Delegate to user operations
    const result = await createUserOperation(userData);
    
    // Log creation event
    logChatEvent('user', 'User created', { 
      username: result.user?.username,
      success: result.success 
    });
    
    return result;
  } catch (error) {
    console.error('[CRM Extension] Error creating user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update an existing user
 * @param {string} userId - User ID to update
 * @param {Object} userData - User update data
 * @returns {Promise<Object>} User update result
 */
export async function updateUser(userId, userData) {
  try {
    // Delegate to user operations
    const result = await updateUserOperation(userId, userData);
    
    // Log update event
    logChatEvent('user', 'User updated', { 
      userId,
      success: result.success 
    });
    
    return result;
  } catch (error) {
    console.error('[CRM Extension] Error updating user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a user
 * @param {string} userId - User ID to delete
 * @returns {Promise<Object>} User deletion result
 */
export async function deleteUser(userId) {
  try {
    // Delegate to user operations
    const result = await deleteUserOperation(userId);
    
    // Log deletion event
    logChatEvent('user', 'User deleted', { 
      userId,
      success: result.success 
    });
    
    return result;
  } catch (error) {
    console.error('[CRM Extension] Error deleting user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Set user status
 * @param {string} status - New user status
 * @returns {Promise<boolean>} Status update success
 */
export async function setUserStatus(status) {
  try {
    // Validate status
    if (!Object.values(UserStatus).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    // Check authentication
    if (!isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    const currentUser = getCurrentUser();
    
    // Get server URL
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Prepare status update payload
    const statusUpdatePayload = {
      userId: currentUser.id,
      status: status,
      timestamp: new Date().toISOString()
    };
    
    // Send status update to server
    const response = await fetch(`${httpServerUrl}/api/users/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(statusUpdatePayload)
    });
    
    // Handle server response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update status');
    }
    
    // Update local user data
    const updatedUser = { 
      ...currentUser, 
      status,
      lastStatusUpdate: new Date().toISOString()
    };
    
    // Save to local storage
    saveUser(updatedUser);
    
    // Notify listeners
    notifyUserStatusListeners();
    
    // Log status change
    logChatEvent('user', 'User status updated', { 
      userId: currentUser.id, 
      status 
    });
    
    return true;
  } catch (error) {
    console.error('[CRM Extension] Error setting user status:', error);
    
    // Fallback for local authentication or offline mode
    if (getSetting('allow_local_auth', false)) {
      const localUsers = getSetting('local_users', []);
      const userIndex = localUsers.findIndex(u => u.id === currentUser.id);
      
      if (userIndex !== -1) {
        // Update local user status
        localUsers[userIndex].status = status;
        localUsers[userIndex].lastStatusUpdate = new Date().toISOString();
        
        // Save local users
        saveSetting('local_users', localUsers);
        
        // Notify listeners
        notifyUserStatusListeners();
        
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Update online users list
 * @param {Array} users - Array of online user objects
 */
export function updateOnlineUsers(users) {
  try {
    if (!Array.isArray(users)) return;
    
    // Track previous online users
    const prevOnlineUserIds = onlineUsers.map(u => u.id);
    
    // Update online users list
    onlineUsers = users.map(user => ({
      ...user,
      online: true,
      lastSeen: new Date().toISOString()
    }));
    
    // Update cached user data
    onlineUsers.forEach(user => {
      saveUser(user);
    });
    
    // Get current online user IDs
    const currentOnlineUserIds = onlineUsers.map(u => u.id);
    
    // Find users who went offline
    const offlineUsers = prevOnlineUserIds.filter(
      id => !currentOnlineUserIds.includes(id)
    );
    
    // Update offline users
    if (offlineUsers.length > 0) {
      const cachedUsers = getUsers();
      
      offlineUsers.forEach(userId => {
        const userIndex = cachedUsers.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          cachedUsers[userIndex].online = false;
          cachedUsers[userIndex].lastSeen = new Date().toISOString();
          saveUser(cachedUsers[userIndex]);
        }
      });
    }
    
    // Notify listeners of user status changes
    notifyUserStatusListeners();
  } catch (error) {
    console.error('[CRM Extension] Error updating online users:', error);
  }
}

/**
 * Get all online users
 * @returns {Array} Array of online user objects
 */
export function getOnlineUsers() {
  return [...onlineUsers];
}

/**
 * Get a specific user by ID
 * @param {string} userId - User ID
 * @returns {Object|null} User object or null if not found
 */
export function getUserById(userId) {
  try {
    if (!userId) return null;
    
    // First check online users
    const onlineUser = onlineUsers.find(u => u.id === userId);
    if (onlineUser) return onlineUser;
    
    // Then check cached users
    const cachedUsers = getUsers();
    return cachedUsers.find(u => u.id === userId) || null;
  } catch (error) {
    console.error('[CRM Extension] Error getting user by ID:', error);
    return null;
  }
}

/**
 * Get a specific user by username
 * @param {string} username - Username
 * @returns {Object|null} User object or null if not found
 */
export function getUserByUsername(username) {
  try {
    if (!username) return null;
    
    // First check online users
    const onlineUser = onlineUsers.find(u => u.username === username);
    if (onlineUser) return onlineUser;
    
    // Then check cached users
    const cachedUsers = getUsers();
    return cachedUsers.find(u => u.username === username) || null;
  } catch (error) {
    console.error('[CRM Extension] Error getting user by username:', error);
    return null;
  }
}

/**
 * Add a user status listener
 * @param {Function} listener - Function to call with user status updates
 * @returns {Function} Function to remove the listener
 */
export function addUserStatusListener(listener) {
  if (typeof listener !== 'function') return () => {};
  
  userStatusListeners.push(listener);
  
  // Immediately call listener with current online users
  listener(getOnlineUsers());
  
  return () => {
    userStatusListeners = userStatusListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all user status listeners
 */
function notifyUserStatusListeners() {
  const users = getOnlineUsers();
  
  userStatusListeners.forEach(listener => {
    try {
      listener(users);
    } catch (error) {
      console.error('[CRM Extension] Error in user status listener:', error);
    }
  });
}

/**
 * Get all users (cached and online)
 * @returns {Array} Array of all users
 */
export function getAllUsers() {
  try {
    const cachedUsers = getUsers();
    const onlineUserIds = onlineUsers.map(u => u.id);
    
    // Mark cached users as online/offline
    const mergedUsers = cachedUsers.map(user => ({
      ...user,
      online: onlineUserIds.includes(user.id),
      status: user.status || UserStatus.ONLINE
    }));
    
    // Add any online users not in cache
    onlineUsers.forEach(onlineUser => {
      if (!mergedUsers.some(u => u.id === onlineUser.id)) {
        mergedUsers.push({
          ...onlineUser,
          online: true
        });
      }
    });
    
    return mergedUsers;
  } catch (error) {
    console.error('[CRM Extension] Error getting all users:', error);
    return [];
  }
}

/**
 * Search for users by name or username
 * @param {string} query - Search query
 * @returns {Array} Matching users
 */
export function searchUsers(query) {
  try {
    if (!query || typeof query !== 'string') return getAllUsers();
    
    const normalizedQuery = query.toLowerCase();
    const allUsers = getAllUsers();
    
    return allUsers.filter(user => 
      user.username.toLowerCase().includes(normalizedQuery) ||
      (user.displayName && 
       user.displayName.toLowerCase().includes(normalizedQuery))
    );
  } catch (error) {
    console.error('[CRM Extension] Error searching users:', error);
    return [];
  }
}

// Export as default for additional flexibility
export default {
  UserStatus,
  setUserStatus,
  addUserStatusListener,
  getOnlineUsers,
  getUserById,
  getUserByUsername,
  getAllUsers,
  searchUsers,
  updateOnlineUsers,
  initUserService,
  createUser,
  updateUser,
  deleteUser
};