// services/auth/userOperations.js
// Individual user management operations

import { logChatEvent } from '../../utils/logger.js';
import { getSetting, saveSetting } from '../../utils/storage.js';
import { getCurrentUser, isAuthenticated, hasPermission, getAuthToken } from './authentication.js'; // Added getAuthToken

/**
 * Create a new user (admin-only function)
 * @param {Object} userData - User creation data
 * @returns {Promise<Object>} User creation result
 */
export async function createUser(userData) {
  try {
    const currentUser = getCurrentUser();

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
      const response = await fetch(`${httpServerUrl}/api/users`, { // Corrected endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}` // Use getAuthToken
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
      // Removed local fallback logic
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
 * Update a user
 * @param {string} userId - User ID to update
 * @param {Object} userData - User update data
 * @returns {Promise<Object>} User update result
 */
export async function updateUser(userId, userData) {
  try {
    const currentUser = getCurrentUser();

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
      const response = await fetch(`${httpServerUrl}/api/users/${userId}`, { // Corrected endpoint
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}` // Use getAuthToken
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const updatedUser = await response.json();

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
      // Catch errors specifically from the fetch/server interaction
      console.error('[CRM Extension] Server update user error:', serverError);
      // Re-throw the error to be caught by the outer catch block
      throw new Error('Server request failed: ' + serverError.message);
    }
  } catch (error) {
    // Catch errors from the overall updateUser function execution (including the re-thrown serverError)
    console.error('[CRM Extension] Update user error:', error);
    return {
      success: false,
      // Return the specific error message caught
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
    const currentUser = getCurrentUser();

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
      const response = await fetch(`${httpServerUrl}/api/users/${userId}`, { // Corrected endpoint
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}` // Use getAuthToken
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
      // Removed local fallback logic
      throw new Error('Server request failed: ' + serverError.message);
    }
  } catch (error) {
    console.error('[CRM Extension] Delete user error:', error);
    logChatEvent('auth', 'Admin user deletion failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Reset a user's password (admin function)
 * @param {string} targetUserId - ID of the user whose password to reset
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} Password reset result
 */
export async function resetUserPassword(targetUserId, newPassword) {
  try {
    const currentUser = getCurrentUser();

    // Check if current user is authenticated and is an admin
    if (!isAuthenticated() || currentUser.role !== 'admin') {
      return {
        success: false,
        error: 'Administrator privileges required to reset passwords'
      };
    }

    if (!targetUserId || !newPassword) {
      return {
        success: false,
        error: 'Target User ID and new password are required'
      };
    }

    // Get server URL from storage
    const serverUrl = localStorage.getItem('crmplus_chat_server_url') || 'ws://localhost:3000';
    const httpServerUrl = serverUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    const token = getAuthToken();

    // Send request to server
    const response = await fetch(`${httpServerUrl}/api/users/${targetUserId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        newPassword: newPassword,
        adminOverride: true // Signal admin action
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
      throw new Error(errorData.error || `Failed to reset password: Server returned ${response.status}`);
    }

    // Log successful password reset
    logChatEvent('auth', 'Admin reset user password', {
      adminUsername: currentUser.username,
      targetUserId: targetUserId
    });

    return { success: true };

  } catch (error) {
    console.error('[CRM Extension] Reset user password error:', error);
    logChatEvent('auth', 'Admin password reset failed', { error: error.message });
    return { success: false, error: error.message };
  }
}