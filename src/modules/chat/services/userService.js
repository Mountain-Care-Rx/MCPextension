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
  OFFLINE: 'offline', // Added offline status
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
 * Get all users, fetching from the server if authenticated.
 * @returns {Promise<Array>} Promise resolving to an array of all users.
 */
export async function getAllUsers() {
  try {
    if (isAuthenticated()) {
      const token = getAuthToken();
      // TODO: Use a configurable base URL for API calls
      const serverUrl = localStorage.getItem('crmplus_chat_server_url')?.replace('ws', 'http') || 'http://localhost:3000';
      
      try {
        const response = await fetch(`${serverUrl}/api/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const serverUsers = await response.json();
          
          // Assuming serverUsers is an array like [{ id, username, role, status?, ... }]
          if (Array.isArray(serverUsers)) {
             // Update local cache and potentially online status based on fetched data
             // For simplicity, just saving them to cache for now.
             // A more robust implementation might merge status.
             serverUsers.forEach(user => saveUser(user));
             logChatEvent('user', 'Fetched user list from server', { count: serverUsers.length });
             return serverUsers;
          } else {
             console.error('[CRM Extension] Invalid user list format received from server:', serverUsers);
             logChatEvent('error', 'Invalid user list format from server');
          }
        } else {
          console.error(`[CRM Extension] Failed to fetch users from server: ${response.status}`);
          logChatEvent('error', 'Failed to fetch user list', { status: response.status });
        }
      } catch (fetchError) {
        console.error('[CRM Extension] Error fetching users from server:', fetchError);
        logChatEvent('error', 'Error fetching user list', { error: fetchError.message });
        // Fall through to return cached users on fetch error
      }
    }

    // Fallback: Return locally cached users if not authenticated or fetch failed
    console.warn('[CRM Extension] Returning cached user list');
    const cachedUsers = getUsers();
    return cachedUsers;

  } catch (error) {
    console.error('[CRM Extension] Error in getAllUsers:', error);
    return []; // Return empty array on unexpected error
  }
}

/**
 * Search for users by name or username via API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Promise resolving to an array of matching users
 */
export async function searchUsers(query) {
  try {
    // If no query, return all users (or handle as needed)
    if (!query || typeof query !== 'string' || query.trim() === '') {
      // Decide if returning all users or empty array is better here
      // Returning empty for now to match server search behavior
      return [];
    }

    if (!isAuthenticated()) {
      console.warn('[UserService] Cannot search users: Not authenticated');
      return [];
    }

    const token = getAuthToken();
    const serverUrl = localStorage.getItem('crmplus_chat_server_url')?.replace('ws', 'http') || 'http://localhost:3000';

    // Construct search criteria - search by username or name (first/last)
    const searchCriteria = {
      criteria: {
        username: query, // Search username field
        name: query      // Search first_name or last_name fields
      },
      limit: 50 // Limit results for efficiency
    };

    const response = await fetch(`${serverUrl}/api/users/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(searchCriteria)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server search failed: ${response.status}`);
    }

    const searchResult = await response.json();
    logChatEvent('user', 'User search performed', { query, count: searchResult.users?.length || 0 });

    // Return the users array from the response
    return searchResult.users || [];

  } catch (error) {
    console.error('[CRM Extension] Error searching users via API:', error);
    logChatEvent('error', 'User search failed', { query, error: error.message });
    return []; // Return empty array on error
  }
}

/**
 * Update the presence status of a user based on WebSocket events.
 * @param {string} userId - The ID of the user.
 * @param {'online' | 'offline'} status - The new presence status.
 */
export function updateUserPresence(userId, status) {
  if (!userId) return;

  const isOnline = status === 'online';
  logChatEvent('user', 'Updating user presence', { userId, status });

  try {
    // Update onlineUsers array
    const userIndexInOnline = onlineUsers.findIndex(u => u.id === userId);

    if (isOnline && userIndexInOnline === -1) {
      // User came online, try to get full details from cache or add basic info
      const cachedUser = getUserById(userId); // Use existing function to check cache
      if (cachedUser) {
        onlineUsers.push({ ...cachedUser, online: true, status: 'online', lastSeen: new Date().toISOString() });
      } else {
        // If user not in cache (should be rare if getAllUsers was called), add basic info
        // Ideally, we'd fetch full details via API here if needed.
        onlineUsers.push({ id: userId, username: `User_${userId.substring(0, 4)}`, online: true, status: 'online', lastSeen: new Date().toISOString() });
        console.warn(`[UserService] User ${userId} joined but not found in cache.`);
      }
    } else if (!isOnline && userIndexInOnline !== -1) {
      // User went offline
      onlineUsers.splice(userIndexInOnline, 1);
    }

    // Update cached user data (if user exists in cache)
    const cachedUsers = getUsers();
    const userIndexInCache = cachedUsers.findIndex(u => u.id === userId);
    if (userIndexInCache !== -1) {
      cachedUsers[userIndexInCache].online = isOnline;
      cachedUsers[userIndexInCache].status = isOnline ? UserStatus.ONLINE : UserStatus.OFFLINE; // Assuming OFFLINE status exists or needs adding
      cachedUsers[userIndexInCache].lastSeen = new Date().toISOString();
      saveUser(cachedUsers[userIndexInCache]); // Save the updated user to storage
    }

    // Notify listeners
    notifyUserStatusListeners();

  } catch (error) {
    console.error('[CRM Extension] Error updating user presence:', error);
  }
}

/**
 * Fetch all departments from the server.
 * @returns {Promise<Array>} Promise resolving to an array of department objects.
 */
export async function getAllDepartments() {
  try {
    if (!isAuthenticated()) {
      console.warn('[UserService] Cannot fetch departments: Not authenticated');
      return [];
    }

    const token = getAuthToken();
    // TODO: Use a configurable base URL for API calls
    const serverUrl = localStorage.getItem('crmplus_chat_server_url')?.replace('ws', 'http') || 'http://localhost:3000';

    const response = await fetch(`${serverUrl}/api/departments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const departments = await response.json();
      logChatEvent('admin', 'Fetched department list from server', { count: departments?.length || 0 });
      return departments || [];
    } else {
      console.error(`[CRM Extension] Failed to fetch departments from server: ${response.status}`);
      logChatEvent('error', 'Failed to fetch department list', { status: response.status });
      return []; // Return empty on error
    }
  } catch (error) {
    console.error('[CRM Extension] Error fetching departments:', error);
    logChatEvent('error', 'Error fetching department list', { error: error.message });
    return []; // Return empty on error
  }
}

// Export as default for additional flexibility
export default {
  UserStatus,
  updateUserPresence, // Added export
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
  deleteUser,
  getAllDepartments // Added export
};