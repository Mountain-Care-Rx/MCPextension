// chat/services/authService.js
// Authentication service for HIPAA-compliant chat

import { logChatEvent } from '../utils/logger.js';
import { getSetting, saveSetting } from '../utils/storage.js';

// Storage keys
const AUTH_TOKEN_KEY = 'crmplus_chat_auth_token';
const USER_INFO_KEY = 'crmplus_chat_user_info';
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

// In-memory state
let currentUser = null;
let authToken = null;
let lastActivity = Date.now();
let sessionTimeoutId = null;
let authListeners = [];

// Default admin credentials for initial setup
const DEFAULT_ADMIN = {
  username: 'CBarnett',
  password: 'Admin123', // In a real app, this would be hashed and not stored in code
  role: 'admin',
  displayName: 'Admin'
};

/**
 * Initialize the authentication service
 * @returns {boolean} True if initialization was successful
 */
export function initAuth() {
  try {
    // Load saved auth data
    loadSavedAuth();
    
    // Set up session timeout monitoring
    setupSessionTimeout();
    
    // Set up activity tracking for timeout management
    setupActivityTracking();
    
    // Check if admin account exists for first launch
    checkAdminAccount();
    
    // Log initialization
    logChatEvent('auth', 'Authentication service initialized');
    
    return true;
  } catch (error) {
    console.error('[CRM Extension] Error initializing auth service:', error);
    return false;
  }
}

/**
 * Load saved authentication data from local storage
 */
function loadSavedAuth() {
  try {
    // Load auth token
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (savedToken) {
      authToken = savedToken;
    }
    
    // Load user info
    const savedUserInfo = localStorage.getItem(USER_INFO_KEY);
    if (savedUserInfo) {
      currentUser = JSON.parse(savedUserInfo);
    }
    
    if (authToken && currentUser) {
      // Set initial activity timestamp
      lastActivity = Date.now();
      
      // Notify listeners
      notifyAuthListeners();
      
      console.log('[CRM Extension] Loaded saved authentication data');
      logChatEvent('auth', 'Restored authentication session', { 
        username: currentUser.username 
      });
    }
  } catch (error) {
    console.error('[CRM Extension] Error loading saved auth data:', error);
    // Clear potentially corrupted data
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
  }
}

/**
 * Check if admin account exists and create if needed
 */
function checkAdminAccount() {
  // This would typically communicate with the server
  // Here we're just checking a flag in localStorage for demo purposes
  const adminExists = getSetting('admin_account_created', false);
  
  if (!adminExists) {
    console.log('[CRM Extension] Setting up initial admin account');
    // In a real implementation, this would create the admin account on the server
    
    // Mark admin as created
    saveSetting('admin_account_created', true);
    logChatEvent('auth', 'Initial admin account setup completed');
  }
}

/**
 * Set up activity tracking for session timeout management
 */
function setupActivityTracking() {
  // Track user activity
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'click'];
  
  activityEvents.forEach(eventType => {
    document.addEventListener(eventType, () => {
      updateLastActivity();
    });
  });
}

/**
 * Update the last activity timestamp
 */
export function updateLastActivity() {
  lastActivity = Date.now();
  
  // Reset timeout timer
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }
  
  if (isAuthenticated()) {
    setupSessionTimeout();
  }
}

/**
 * Set up session timeout
 */
function setupSessionTimeout() {
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId);
  }
  
  // Only set timeout if authenticated
  if (isAuthenticated()) {
    sessionTimeoutId = setTimeout(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity >= SESSION_TIMEOUT) {
        // Log timeout
        logChatEvent('auth', 'Session timed out due to inactivity', {
          username: currentUser?.username,
          inactiveTime: Math.round(timeSinceActivity / 1000) + ' seconds'
        });
        
        // Logout user
        logout('Session timed out due to inactivity');
      } else {
        // Recalculate timeout for remaining time
        const remainingTime = SESSION_TIMEOUT - timeSinceActivity;
        sessionTimeoutId = setTimeout(setupSessionTimeout, remainingTime);
      }
    }, SESSION_TIMEOUT);
  }
}

/**
 * Login with username and password
 * @param {string} username - The username
 * @param {string} password - The password
 * @returns {Promise<Object>} Authentication result
 */
export async function login(username, password) {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Log login attempt (without password)
    logChatEvent('auth', 'Login attempt', { username });
    
    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // In a real implementation, the following would be a request to the server
    // For demo purposes, we'll check against the hard-coded admin credentials
    // or check with the server for other users
    
    let authResponse = null;
    
    // Check if using default admin credentials
    if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
      // Simulate successful admin login
      authResponse = {
        success: true,
        token: 'admin_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
        user: {
          id: 'admin_' + Math.random().toString(36).substr(2),
          username: DEFAULT_ADMIN.username,
          role: DEFAULT_ADMIN.role,
          displayName: DEFAULT_ADMIN.displayName,
          isAdmin: true
        }
      };
    } else {
      // Try to authenticate with server
      try {
        const response = await fetch(`${httpServerUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Login failed');
        }
        
        authResponse = await response.json();
      } catch (serverError) {
        console.error('[CRM Extension] Server auth error:', serverError);
        
        // For demo/dev purposes only - in production we would fail here
        // This simulates local authentication when server is not available
        if (getSetting('allow_local_auth', false)) {
          const localUsers = getSetting('local_users', []);
          const user = localUsers.find(u => u.username === username);
          
          if (user && user.password === password) { // In real app, passwords would be hashed
            authResponse = {
              success: true,
              token: 'local_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
              user: {
                id: user.id || 'user_' + Math.random().toString(36).substr(2),
                username: user.username,
                role: user.role || 'user',
                displayName: user.displayName || user.username,
                isLocal: true
              }
            };
          } else {
            throw new Error('Invalid username or password');
          }
        } else {
          throw new Error('Server authentication failed');
        }
      }
    }
    
    if (!authResponse || !authResponse.success) {
      throw new Error('Authentication failed');
    }
    
    // Store authentication data
    authToken = authResponse.token;
    currentUser = authResponse.user;
    
    // Save to local storage
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
    
    // Reset activity timestamp
    updateLastActivity();
    
    // Set up session timeout
    setupSessionTimeout();
    
    // Log successful login
    logChatEvent('auth', 'Login successful', { 
      username: currentUser.username,
      role: currentUser.role
    });
    
    // Notify listeners
    notifyAuthListeners();
    
    return {
      success: true,
      user: currentUser
    };
  } catch (error) {
    // Log error
    logChatEvent('auth', 'Login failed', { 
      username,
      error: error.message 
    });
    
    console.error('[CRM Extension] Login error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Logout the current user
 * @param {string} reason - Reason for logout
 * @returns {boolean} Success status
 */
export function logout(reason = 'User logout') {
  try {
    if (!isAuthenticated()) {
      return false;
    }
    
    // Log logout
    logChatEvent('auth', 'Logout', { 
      username: currentUser?.username,
      reason
    });
    
    // Clear auth data
    authToken = null;
    const prevUser = currentUser;
    currentUser = null;
    
    // Clear from storage
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    
    // Clear timeout
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
      sessionTimeoutId = null;
    }
    
    // Notify listeners
    notifyAuthListeners(prevUser);
    
    return true;
  } catch (error) {
    console.error('[CRM Extension] Logout error:', error);
    return false;
  }
}

/**
 * Register a new user (admin-only function, no self-registration)
 * @param {Object} userInfo - User registration data
 * @returns {Promise<Object>} Registration result
 */
export async function registerUser(userInfo) {
  try {
    // Check if current user is admin
    if (!isAuthenticated() || currentUser.role !== 'admin') {
      return {
        success: false,
        error: 'Administrator privileges required to create users'
      };
    }
    
    if (!userInfo.username || !userInfo.password) {
      throw new Error('Username and password are required');
    }
    
    // Log registration attempt (without password)
    logChatEvent('auth', 'User registration attempt', { 
      username: userInfo.username,
      createdBy: currentUser.username
    });
    
    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Make registration request to the server
    try {
      const response = await fetch(`${httpServerUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(userInfo)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const registrationData = await response.json();
      
      // Log successful registration
      logChatEvent('auth', 'User registration successful', { 
        username: userInfo.username,
        createdBy: currentUser.username,
        role: userInfo.role || 'user'
      });
      
      return {
        success: true,
        user: registrationData.user
      };
    } catch (serverError) {
      console.error('[CRM Extension] Server registration error:', serverError);
      
      // For demo/dev purposes only - in production we would fail here
      if (getSetting('allow_local_auth', false)) {
        // Simulate local user creation
        const newUser = {
          id: 'user_' + Date.now().toString(36),
          username: userInfo.username,
          password: userInfo.password, // In real app, would be hashed
          role: userInfo.role || 'user',
          displayName: userInfo.displayName || userInfo.username,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.id
        };
        
        // Store in local users
        const localUsers = getSetting('local_users', []);
        
        // Check if username already exists
        if (localUsers.some(u => u.username === newUser.username)) {
          throw new Error('Username already exists');
        }
        
        localUsers.push(newUser);
        saveSetting('local_users', localUsers);
        
        // Log successful local registration
        logChatEvent('auth', 'Local user registration successful', { 
          username: userInfo.username,
          createdBy: currentUser.username,
          role: userInfo.role || 'user',
          isLocal: true
        });
        
        return {
          success: true,
          user: {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            displayName: newUser.displayName,
            isLocal: true
          }
        };
      } else {
        throw new Error('Server registration failed: ' + serverError.message);
      }
    }
  } catch (error) {
    // Log error
    logChatEvent('auth', 'User registration failed', { 
      username: userInfo.username,
      error: error.message 
    });
    
    console.error('[CRM Extension] Registration error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export function isAuthenticated() {
  return !!authToken && !!currentUser;
}

/**
 * Get the current user
 * @returns {Object|null} Current user or null if not authenticated
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Get the current auth token
 * @returns {string|null} Current auth token or null if not authenticated
 */
export function getAuthToken() {
  return authToken;
}

/**
 * Check if the current session is about to timeout
 * @returns {Object} Session status information
 */
export function getSessionStatus() {
  if (!isAuthenticated()) {
    return {
      authenticated: false,
      timeRemaining: 0,
      lastActivity: null
    };
  }
  
  const timeSinceActivity = Date.now() - lastActivity;
  const timeRemaining = Math.max(0, SESSION_TIMEOUT - timeSinceActivity);
  
  return {
    authenticated: true,
    timeRemaining,
    lastActivity,
    formattedTimeRemaining: formatTimeRemaining(timeRemaining)
  };
}

/**
 * Format time remaining in human-readable format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} Formatted time
 */
function formatTimeRemaining(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Add an authentication state change listener
 * @param {Function} listener - Callback function
 */
export function addAuthListener(listener) {
  if (typeof listener === 'function' && !authListeners.includes(listener)) {
    authListeners.push(listener);
  }
}

/**
 * Remove an authentication state change listener
 * @param {Function} listener - Callback function to remove
 */
export function removeAuthListener(listener) {
  const index = authListeners.indexOf(listener);
  if (index !== -1) {
    authListeners.splice(index, 1);
  }
}

/**
 * Notify all auth listeners of state change
 * @param {Object} prevUser - Previous user before change
 */
function notifyAuthListeners(prevUser = null) {
  const authState = {
    authenticated: isAuthenticated(),
    user: currentUser,
    prevUser,
    token: authToken
  };
  
  authListeners.forEach(listener => {
    try {
      listener(authState);
    } catch (error) {
      console.error('[CRM Extension] Error in auth listener:', error);
    }
  });
}

/**
 * Update the user's profile
 * @param {Object} userUpdates - User fields to update
 * @returns {Promise<Object>} Update result
 */
export async function updateUserProfile(userUpdates) {
  try {
    if (!isAuthenticated()) {
      throw new Error('User must be authenticated to update profile');
    }
    
    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Send update request to server
    try {
      const response = await fetch(`${httpServerUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(userUpdates)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }
      
      const updateData = await response.json();
      
      // Update local user data
      currentUser = {
        ...currentUser,
        ...updateData.user
      };
      
      // Save to local storage
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
      
      // Log successful update
      logChatEvent('auth', 'Profile updated', {
        username: currentUser.username,
        updatedFields: Object.keys(userUpdates).join(', ')
      });
      
      // Notify listeners
      notifyAuthListeners();
      
      return {
        success: true,
        user: currentUser
      };
    } catch (serverError) {
      console.error('[CRM Extension] Server profile update error:', serverError);
      
      // For demo/dev purposes only - in production we would fail here
      if (getSetting('allow_local_auth', false) && currentUser.isLocal) {
        // Update local user
        const localUsers = getSetting('local_users', []);
        const userIndex = localUsers.findIndex(u => u.id === currentUser.id);
        
        if (userIndex >= 0) {
          // Update fields (except sensitive ones like role)
          const updatedUser = {
            ...localUsers[userIndex],
            displayName: userUpdates.displayName || localUsers[userIndex].displayName
          };
          
          localUsers[userIndex] = updatedUser;
          saveSetting('local_users', localUsers);
          
          // Update current user
          currentUser = {
            ...currentUser,
            displayName: updatedUser.displayName
          };
          
          // Save to local storage
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
          
          // Log successful local update
          logChatEvent('auth', 'Local profile updated', {
            username: currentUser.username,
            updatedFields: Object.keys(userUpdates).join(', '),
            isLocal: true
          });
          
          // Notify listeners
          notifyAuthListeners();
          
          return {
            success: true,
            user: currentUser
          };
        }
      }
      
      throw new Error('Server profile update failed: ' + serverError.message);
    }
  } catch (error) {
    // Log error
    logChatEvent('auth', 'Profile update failed', { error: error.message });
    
    console.error('[CRM Extension] Profile update error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Change the user's password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Password change result
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    if (!isAuthenticated()) {
      throw new Error('User must be authenticated to change password');
    }
    
    if (!currentPassword || !newPassword) {
      throw new Error('Current and new passwords are required');
    }
    
    // Simple password validation
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }
    
    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Send password change request to server
    try {
      const response = await fetch(`${httpServerUrl}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password change failed');
      }
      
      // Log successful password change
      logChatEvent('auth', 'Password changed', {
        username: currentUser.username
      });
      
      return {
        success: true
      };
    } catch (serverError) {
      console.error('[CRM Extension] Server password change error:', serverError);
      
      // For demo/dev purposes only - in production we would fail here
      if (getSetting('allow_local_auth', false) && currentUser.isLocal) {
        // Change local user password
        const localUsers = getSetting('local_users', []);
        const userIndex = localUsers.findIndex(u => u.id === currentUser.id);
        
        if (userIndex >= 0) {
          // Verify current password
          if (localUsers[userIndex].password !== currentPassword) {
            throw new Error('Current password is incorrect');
          }
          
          // Update password
          localUsers[userIndex].password = newPassword;
          saveSetting('local_users', localUsers);
          
          // Log successful local password change
          logChatEvent('auth', 'Local password changed', {
            username: currentUser.username,
            isLocal: true
          });
          
          return {
            success: true
          };
        }
      }
      
      throw new Error('Server password change failed: ' + serverError.message);
    }
  } catch (error) {
    // Log error (without passwords)
    logChatEvent('auth', 'Password change failed', { error: error.message });
    
    console.error('[CRM Extension] Password change error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reset a user's password (admin only)
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Password reset result
 */
export async function resetUserPassword(userId, newPassword) {
  try {
    // Check if current user is admin
    if (!isAuthenticated() || currentUser.role !== 'admin') {
      return {
        success: false,
        error: 'Administrator privileges required to reset passwords'
      };
    }
    
    if (!userId || !newPassword) {
      throw new Error('User ID and new password are required');
    }
    
    // Simple password validation
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }
    
    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Send password reset request to server
    try {
      const response = await fetch(`${httpServerUrl}/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }
      
      // Log successful password reset
      logChatEvent('auth', 'Admin reset user password', {
        adminUsername: currentUser.username,
        targetUserId: userId
      });
      
      return {
        success: true
      };
    } catch (serverError) {
      console.error('[CRM Extension] Server password reset error:', serverError);
      
      // For demo/dev purposes only - in production we would fail here
      if (getSetting('allow_local_auth', false)) {
        // Reset local user password
        const localUsers = getSetting('local_users', []);
        const userIndex = localUsers.findIndex(u => u.id === userId);
        
        if (userIndex >= 0) {
          // Update password
          localUsers[userIndex].password = newPassword;
          saveSetting('local_users', localUsers);
          
          // Log successful local password reset
          logChatEvent('auth', 'Admin reset local user password', {
            adminUsername: currentUser.username,
            targetUserId: userId,
            targetUsername: localUsers[userIndex].username,
            isLocal: true
          });
          
          return {
            success: true
          };
        } else {
          throw new Error('User not found');
        }
      }
      
      throw new Error('Server password reset failed: ' + serverError.message);
    }
  } catch (error) {
    // Log error (without passwords)
    logChatEvent('auth', 'Admin password reset failed', { error: error.message });
    
    console.error('[CRM Extension] Password reset error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(permission) {
  if (!isAuthenticated() || !currentUser.role) {
    return false;
  }
  
  // This is a simplified permission check
  // In a real app, you would have a more complex permission system
  
  // Admin role has all permissions
  if (currentUser.role === 'admin') {
    return true;
  }
  
  // Moderator role has limited permissions
  if (currentUser.role === 'moderator') {
    const moderatorPermissions = [
      'user.view',
      'channel.create', 'channel.view', 'channel.update',
      'channel.invite', 'message.delete',
      'message.create', 'message.view'
    ];
    
    return moderatorPermissions.includes(permission);
  }
  
  // Regular user permissions
  const userPermissions = [
    'user.view', 
    'channel.view', 
    'message.create', 'message.view', 'message.update.own', 'message.delete.own'
  ];
  
  return userPermissions.includes(permission);
}

/**
 * Get all users (admin function)
 * @returns {Promise<Object>} User list result
 */
export async function getAllUsers() {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }
    
    if (!hasPermission('user.view')) {
      return { success: false, error: 'Permission denied' };
    }
    
    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Send request to server
    try {
      const response = await fetch(`${httpServerUrl}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get users');
      }
      
      const users = await response.json();
      
      return {
        success: true,
        users: users
      };
    } catch (serverError) {
      console.error('[CRM Extension] Server get users error:', serverError);
      
      // For demo/dev purposes only - in production we would fail here
      if (getSetting('allow_local_auth', false)) {
        // Get local users (excluding passwords)
        const localUsers = getSetting('local_users', []).map(user => ({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
          isLocal: true
        }));
        
        return {
          success: true,
          users: localUsers
        };
      }
      
      throw new Error('Server request failed: ' + serverError.message);
    }
  } catch (error) {
    console.error('[CRM Extension] Get users error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a user (admin function)
 * @param {string} userId - User ID to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteUser(userId) {
  try {
    if (!isAuthenticated()) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Check if current user is admin
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Administrator privileges required to delete users' };
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Prevent deleting self
    if (userId === currentUser.id) {
      return { success: false, error: 'Cannot delete your own account' };
    }
    
    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    
    // Send delete request to server
    try {
        const response = await fetch(`${httpServerUrl}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete user');
        }
        
        // Log successful user deletion
        logChatEvent('auth', 'Admin deleted user', {
          adminUsername: currentUser.username,
          targetUserId: userId
        });
        
        return { success: true };
      } catch (serverError) {
        console.error('[CRM Extension] Server delete user error:', serverError);
        
        // For demo/dev purposes only - in production we would fail here
        if (getSetting('allow_local_auth', false)) {
          // Delete local user
          const localUsers = getSetting('local_users', []);
          const userIndex = localUsers.findIndex(u => u.id === userId);
          
          if (userIndex >= 0) {
            const username = localUsers[userIndex].username;
            localUsers.splice(userIndex, 1);
            saveSetting('local_users', localUsers);
            
            // Log successful local user deletion
            logChatEvent('auth', 'Admin deleted local user', {
              adminUsername: currentUser.username,
              targetUserId: userId,
              targetUsername: username,
              isLocal: true
            });
            
            return { success: true };
          } else {
            throw new Error('User not found');
          }
        }
        
        throw new Error('Server request failed: ' + serverError.message);
      }
    } catch (error) {
      console.error('[CRM Extension] Delete user error:', error);
      logChatEvent('auth', 'Admin user deletion failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update user role (admin function)
   * @param {string} userId - User ID to update
   * @param {string} newRole - New role (admin, moderator, user)
   * @returns {Promise<Object>} Update result
   */
  export async function updateUserRole(userId, newRole) {
    try {
      if (!isAuthenticated()) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      
      // Check if current user is admin
      if (currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Administrator privileges required to update roles'
        };
      }
      
      if (!userId || !newRole) {
        throw new Error('User ID and new role are required');
      }
      
      // Validate role
      const validRoles = ['admin', 'moderator', 'user'];
      if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role. Must be one of: ' + validRoles.join(', '));
      }
      
      // Prevent changing own role
      if (userId === currentUser.id) {
        return {
          success: false,
          error: 'Cannot change your own role'
        };
      }
      
      // Get server URL from storage
      const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
      const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      
      // Send role update request to server
      try {
        const response = await fetch(`${httpServerUrl}/admin/users/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            role: newRole
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user role');
        }
        
        const updateData = await response.json();
        
        // Log successful role update
        logChatEvent('auth', 'Admin updated user role', {
          adminUsername: currentUser.username,
          targetUserId: userId,
          newRole: newRole
        });
        
        return {
          success: true,
          user: updateData.user
        };
      } catch (serverError) {
        console.error('[CRM Extension] Server role update error:', serverError);
        
        // For demo/dev purposes only - in production we would fail here
        if (getSetting('allow_local_auth', false)) {
          // Update local user role
          const localUsers = getSetting('local_users', []);
          const userIndex = localUsers.findIndex(u => u.id === userId);
          
          if (userIndex >= 0) {
            localUsers[userIndex].role = newRole;
            saveSetting('local_users', localUsers);
            
            logChatEvent('auth', 'Admin updated local user role', {
              adminUsername: currentUser.username,
              targetUserId: userId,
              targetUsername: localUsers[userIndex].username,
              newRole: newRole,
              isLocal: true
            });
            
            return {
              success: true,
              user: {
                id: localUsers[userIndex].id,
                username: localUsers[userIndex].username,
                displayName: localUsers[userIndex].displayName,
                role: newRole,
                isLocal: true
              }
            };
          } else {
            throw new Error('User not found');
          }
        }
        
        throw new Error('Server request failed: ' + serverError.message);
      }
    } catch (error) {
      console.error('[CRM Extension] Update user role error:', error);
      logChatEvent('auth', 'Admin role update failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Import users in bulk (admin function)
   * @param {Array} users - Array of user objects
   * @returns {Promise<Object>} Import result
   */
  export async function importUsers(users) {
    try {
      if (!isAuthenticated()) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      
      // Check if current user is admin
      if (currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Administrator privileges required to import users'
        };
      }
      
      if (!Array.isArray(users) || users.length === 0) {
        throw new Error('Valid user array is required');
      }
      
      // Get server URL from storage
      const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
      const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      
      // Send bulk import request to server
      try {
        const response = await fetch(`${httpServerUrl}/admin/users/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ users })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to import users');
        }
        
        const importResult = await response.json();
        
        logChatEvent('auth', 'Admin imported users', {
          adminUsername: currentUser.username,
          count: importResult.successCount,
          failedCount: importResult.failedCount
        });
        
        return {
          success: true,
          successCount: importResult.successCount,
          failedCount: importResult.failedCount,
          errors: importResult.errors
        };
      } catch (serverError) {
        console.error('[CRM Extension] Server user import error:', serverError);
        
        if (getSetting('allow_local_auth', false)) {
          const localUsers = getSetting('local_users', []);
          const existingUsernames = new Set(localUsers.map(u => u.username));
          
          const results = {
            successCount: 0,
            failedCount: 0,
            errors: []
          };
          
          users.forEach(user => {
            try {
              if (!user.username || !user.password) {
                results.failedCount++;
                results.errors.push({
                  username: user.username || 'Unknown',
                  error: 'Username and password are required'
                });
                return;
              }
              
              if (existingUsernames.has(user.username)) {
                results.failedCount++;
                results.errors.push({
                  username: user.username,
                  error: 'Username already exists'
                });
                return;
              }
              
              const newUser = {
                id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
                username: user.username,
                password: user.password, // In real app, would be hashed
                role: user.role || 'user',
                displayName: user.displayName || user.username,
                createdAt: new Date().toISOString(),
                createdBy: currentUser.id
              };
              
              localUsers.push(newUser);
              existingUsernames.add(user.username);
              
              results.successCount++;
            } catch (error) {
              results.failedCount++;
              results.errors.push({
                username: user.username || 'Unknown',
                error: error.message
              });
            }
          });
          
          saveSetting('local_users', localUsers);
          
          logChatEvent('auth', 'Admin imported local users', {
            adminUsername: currentUser.username,
            count: results.successCount,
            failedCount: results.failedCount,
            isLocal: true
          });
          
          return {
            success: true,
            ...results
          };
        }
        
        throw new Error('Server request failed: ' + serverError.message);
      }
    } catch (error) {
      console.error('[CRM Extension] Import users error:', error);
      logChatEvent('auth', 'Admin user import failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Force logout a user's sessions (admin function)
   * @param {string} userId - User ID to force logout
   * @returns {Promise<Object>} Logout result
   */
  export async function forceLogoutUser(userId) {
    try {
      if (!isAuthenticated()) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      
      // Check if current user is admin
      if (currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Administrator privileges required to force logout users'
        };
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Get server URL from storage
      const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
      const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      
      // Send force logout request to server
      try {
        const response = await fetch(`${httpServerUrl}/admin/users/${userId}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to force logout user');
        }
        
        logChatEvent('auth', 'Admin forced user logout', {
          adminUsername: currentUser.username,
          targetUserId: userId
        });
        
        return {
          success: true
        };
      } catch (serverError) {
        console.error('[CRM Extension] Server force logout error:', serverError);
        
        if (getSetting('allow_local_auth', false)) {
          logChatEvent('auth', 'Admin attempted to force logout local user', {
            adminUsername: currentUser.username,
            targetUserId: userId,
            isLocal: true,
            note: 'No effect in local mode'
          });
          
          return {
            success: true,
            note: 'No effect in local mode'
          };
        }
        
        throw new Error('Server request failed: ' + serverError.message);
      }
    } catch (error) {
      console.error('[CRM Extension] Force logout error:', error);
      logChatEvent('auth', 'Admin force logout failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create a new user (admin function)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Creation result
   */
  export async function createUser(userData) {
    try {
      // Check if current user is admin
      if (!isAuthenticated() || currentUser.role !== 'admin') {
        return {
          success: false,
          error: 'Administrator privileges required to create users'
        };
      }
      
      // Basic validation
      if (!userData.username || !userData.password) {
        return { 
          success: false, 
          error: 'Username and password are required' 
        };
      }
      
      // Get server URL from storage
      const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
      const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      
      // Send request to server
      try {
        const response = await fetch(`${httpServerUrl}/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create user');
        }
        
        const newUser = await response.json();
        
        // Log user creation
        logChatEvent('auth', 'Admin created user', { 
          username: newUser.username,
          role: newUser.role || 'user'
        });
        
        return {
          success: true,
          user: newUser
        };
      } catch (serverError) {
        console.error('[CRM Extension] Server create user error:', serverError);
        
        // For demo/dev purposes only - in production we would fail here
        if (getSetting('allow_local_auth', false)) {
          // Create local user
          const newUser = {
            id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
            username: userData.username,
            password: userData.password, // In real app, would be hashed
            role: userData.role || 'user',
            displayName: userData.displayName || userData.username,
            email: userData.email || '',
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
          };
          
          // Check if username already exists
          const localUsers = getSetting('local_users', []);
          if (localUsers.some(u => u.username === userData.username)) {
            return { 
              success: false, 
              error: 'Username already exists' 
            };
          }
          
          // Save user
          localUsers.push(newUser);
          saveSetting('local_users', localUsers);
          
          // Log successful creation
          logChatEvent('auth', 'Admin created local user', { 
            username: newUser.username,
            role: newUser.role,
            isLocal: true
          });
          
          return {
            success: true,
            user: {
              id: newUser.id,
              username: newUser.username,
              displayName: newUser.displayName,
              role: newUser.role,
              email: newUser.email,
              isLocal: true
            }
          };
        }
        
        throw new Error('Server request failed: ' + serverError.message);
      }
    } catch (error) {
      console.error('[CRM Extension] Create user error:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update a user (admin function or self)
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Update result
   */
  export async function updateUser(userId, userData) {
    try {
      if (!isAuthenticated()) {
        return { 
          success: false, 
          error: 'Authentication required' 
        };
      }
      
      // Check permissions - can update self or need admin permissions
      if (userId !== currentUser.id && currentUser.role !== 'admin') {
        return { 
          success: false, 
          error: 'Permission denied' 
        };
      }
      
      if (!userId) {
        return { 
          success: false, 
          error: 'User ID is required' 
        };
      }
      
      // Get server URL from storage
      const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
      const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      
      // Send request to server
      try {
        const response = await fetch(`${httpServerUrl}/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user');
        }
        
        const updatedUser = await response.json();
        
        // If updating current user, also update local data
        if (userId === currentUser.id) {
          currentUser = {
            ...currentUser,
            ...updatedUser
          };
          
          // Save to local storage
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
          
          // Notify listeners of auth change
          notifyAuthListeners();
        }
        
        // Log user update
        logChatEvent('auth', 'User updated', { 
          userId,
          updatedFields: Object.keys(userData).join(', ')
        });
        
        return {
          success: true,
          user: updatedUser
        };
      } catch (serverError) {
        console.error('[CRM Extension] Server update user error:', serverError);
        
        // For demo/dev purposes only - in production we would fail here
        if (getSetting('allow_local_auth', false)) {
          // Update local user
          const localUsers = getSetting('local_users', []);
          const userIndex = localUsers.findIndex(u => u.id === userId);
          
          if (userIndex === -1) {
            return { 
              success: false, 
              error: 'User not found' 
            };
          }
          
          // Create updated user (preserve sensitive fields)
          const updatedUser = {
            ...localUsers[userIndex],
            displayName: userData.displayName || localUsers[userIndex].displayName,
            email: userData.email || localUsers[userIndex].email
          };
          
          // If admin is updating, also allow role update
          if (currentUser.role === 'admin' && userData.role) {
            updatedUser.role = userData.role;
          }
          
          // Update user
          localUsers[userIndex] = updatedUser;
          saveSetting('local_users', localUsers);
          
          // If updating current user, also update local data
          if (userId === currentUser.id) {
            currentUser = {
              ...currentUser,
              displayName: updatedUser.displayName,
              email: updatedUser.email
            };
            
            // Save to local storage
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
            
            // Notify listeners
            notifyAuthListeners();
          }
          
          // Log successful update
          logChatEvent('auth', 'Updated local user', { 
            userId,
            updatedFields: Object.keys(userData).join(', '),
            isLocal: true
          });
          
          return {
            success: true,
            user: {
              id: updatedUser.id,
              username: updatedUser.username,
              displayName: updatedUser.displayName,
              role: updatedUser.role,
              email: updatedUser.email,
              isLocal: true
            }
          };
        }
        
        throw new Error('Server request failed: ' + serverError.message);
      }
    } catch (error) {
      console.error('[CRM Extension] Update user error:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }