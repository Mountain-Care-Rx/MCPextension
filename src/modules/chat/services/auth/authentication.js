// services/auth/authentication.js
// Core authentication methods

import { logChatEvent } from '../../utils/logger.js';
import { getSetting, saveSetting } from '../../utils/storage.js';
import { hasPermission } from './permissions.js';

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

// List of valid test users
const VALID_USERS = {
  'user1': {
    password: 'password1',
    role: 'user',
    displayName: 'Test User 1'
  },
  'user2': {
    password: 'password2',
    role: 'user',
    displayName: 'Test User 2'
  }
};

/**
 * Notify authentication listeners about state changes
 * @param {Object} [prevUser] - Previous user object (optional)
 */
function notifyAuthListeners(prevUser = null) {
  const authState = {
    authenticated: isAuthenticated(),
    user: getCurrentUser()
  };

  authListeners.forEach(listener => {
    try {
      listener(authState, prevUser);
    } catch (error) {
      console.error('[CRM Extension] Error in auth listener:', error);
    }
  });
}

/**
 * Add an authentication listener
 * @param {Function} listener - Callback function for auth state changes
 */
function addAuthListener(listener) {
  if (typeof listener === 'function' && !authListeners.includes(listener)) {
    authListeners.push(listener);
  }
}

/**
 * Remove an authentication listener
 * @param {Function} listener - Callback function to remove
 */
function removeAuthListener(listener) {
  const index = authListeners.indexOf(listener);
  if (index !== -1) {
    authListeners.splice(index, 1);
  }
}

/**
 * Initialize the authentication service
 * @returns {boolean} True if initialization was successful
 */
function initAuth() {
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
 * Get the current session status
 * @returns {Object} Session status information
 */
function getSessionStatus() {
  return {
    authenticated: isAuthenticated(),
    user: getCurrentUser(),
    lastActivity: lastActivity,
    sessionTimeout: SESSION_TIMEOUT
  };
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
      // Check token expiration
      if (currentUser.tokenExpires && currentUser.tokenExpires < Date.now()) {
        console.warn('[CRM Extension] Saved token expired');
        // Clear expired token
        logout('Token expired');
        return;
      }
      
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
function updateLastActivity() {
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
async function login(username, password) {
  try {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Log login attempt (without password)
    logChatEvent('auth', 'Login attempt', { username });
    
    let authResponse = null;
    
    // For real authentication, connect to your server
    try {
      // Send credentials to your authentication endpoint
      const response = await fetch('/api/auth/login', { // TODO: Use configurable base URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      // Process server response
      if (response.ok) {
        const data = await response.json();
        
        // Assuming server response includes { success: true, token: '...', user: {...} } on success
        // Or { success: false, error: '...' } on failure
        if (data.token && data.user) {
          authResponse = data; // Store the entire response which should include token and user
        } else {
          // Use error message from server if available, otherwise generic message
          throw new Error(data.error || 'Authentication failed: Invalid response from server');
        }
      } else {
        // Handle non-OK HTTP responses (e.g., 401, 403, 500)
        let errorMsg = `Authentication failed: Server responded with status ${response.status}`;
        try {
          // Try to parse error details from response body
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMsg = errorData.error;
          }
        } catch (e) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(errorMsg);
      }
    } catch (serverError) {
      // Log the actual error and re-throw a user-friendly error
      console.error('[CRM Extension] Server authentication request failed:', serverError);
      // Provide a more generic error to the user unless it's a specific message from the server
      throw new Error(serverError.message.startsWith('Authentication failed:') ? serverError.message : 'Authentication failed: Could not connect to the server or invalid credentials.');
    }
    
    // Ensure authResponse is valid before proceeding
    if (!authResponse || !authResponse.token || !authResponse.user) {
        throw new Error('Authentication failed: Invalid response received from server.');
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
 * Update user profile information
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Update result
 */
async function updateUserProfile(updates) {
  try {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      throw new Error('User must be authenticated to update profile');
    }
    
    // Log profile update attempt
    logChatEvent('auth', 'Profile update attempt', { 
      username: currentUser.username 
    });
    
    // In real implementation, this would call the server API
    // For now, update the local user object
    const updatedUser = {
      ...currentUser,
      ...updates,
      // Don't allow overriding critical properties
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role
    };
    
    // Update current user
    currentUser = updatedUser;
    
    // Save to local storage
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
    
    // Notify listeners
    notifyAuthListeners();
    
    return {
      success: true,
      user: currentUser,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('[CRM Extension] Profile update error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user role (admin function)
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role to assign
 * @returns {Promise<Object>} Update result
 */
async function updateUserRole(userId, newRole) {
  try {
    // Check if user has admin permission
    if (!hasPermission('user:manage')) {
      throw new Error('Insufficient permissions to update user roles');
    }
    
    // Log role update attempt
    logChatEvent('auth', 'Role update attempt', { 
      updatedUserId: userId,
      newRole: newRole,
      performedBy: currentUser?.username
    });
    
    // In real implementation, this would call the server API
    // For now, return success
    return {
      success: true,
      message: `Role updated to ${newRole} for user ${userId}`
    };
  } catch (error) {
    console.error('[CRM Extension] Role update error:', error);
    
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
function logout(reason = 'User logout') {
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
 * Check if token is valid (not expired)
 * @returns {boolean} Token validity
 */
function isTokenValid() {
  if (!authToken || !currentUser) return false;
  
  // Check if token has expired
  if (currentUser.tokenExpires && currentUser.tokenExpires < Date.now()) {
    console.warn('[CRM Extension] Token expired');
    logout('Token expired');
    return false;
  }
  
  return true;
}

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
function isAuthenticated() {
  return !!authToken && !!currentUser && isTokenValid();
}

/**
 * Get the current user
 * @returns {Object|null} Current user or null if not authenticated
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Get the current auth token
 * @returns {string|null} Current auth token or null if not authenticated
 */
function getAuthToken() {
  return authToken;
}

/**
 * Change the current user's password.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The desired new password.
 * @returns {Promise<{success: boolean, error?: string}>} Result of the operation.
 */
async function changePassword(currentPassword, newPassword) {
  if (!isAuthenticated()) {
    return { success: false, error: 'User not authenticated.' };
  }

  const token = getAuthToken();
  if (!token) {
    return { success: false, error: 'Authentication token not found.' };
  }

  logChatEvent('auth', 'Attempting password change', { username: getCurrentUser()?.username });

  try {
    // TODO: Use configurable base URL from config.js
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (response.ok) {
      // Assuming server sends back { success: true } or similar on success
      // No need to parse body if just checking status, but could if server sends data
      logChatEvent('auth', 'Password changed successfully', { username: getCurrentUser()?.username });
      return { success: true };
    } else {
      // Try to get error message from server response
      let errorMsg = `Password change failed: Server responded with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMsg = errorData.error; // Use specific server error
        }
      } catch (e) {
        // Ignore if response body is not JSON or empty
        console.warn('[changePassword] Could not parse error response body:', e);
      }
      logChatEvent('error', 'Password change failed', { username: getCurrentUser()?.username, status: response.status, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('[CRM Extension] Change password request failed:', error);
    logChatEvent('error', 'Password change network/request error', { username: getCurrentUser()?.username, error: error.message });
    return { success: false, error: 'Password change failed: Could not connect to the server.' };
  }
}

// Export all functions
export {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  initAuth,
  updateLastActivity,
  hasPermission,
  getSessionStatus,
  addAuthListener,
  removeAuthListener,
  isTokenValid,
  // registerUser, // Removed as self-registration is disabled
  updateUserProfile,  // Added missing export
  updateUserRole,     // Added missing export
  changePassword      // Added new function
};