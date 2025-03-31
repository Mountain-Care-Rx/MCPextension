// services/auth/sessionManagement.js
// Session management utilities for authentication

import { getAuthToken, getCurrentUser, logout } from './authentication.js';
import { logChatEvent } from '../../utils/logger.js';

// Server connection
const SERVER_BASE_URL = 'http://localhost:3000';

// WebSocket session tracking
let wsSession = null;
let sessionCheckInterval = null;
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check session every minute

/**
 * Initialize session management
 * @returns {boolean} Success status
 */
export function initSessionManagement() {
  try {
    // Start session check interval
    startSessionChecks();
    
    // Log initialization
    console.log('[SessionManagement] Session management initialized');
    
    return true;
  } catch (error) {
    console.error('[SessionManagement] Error initializing session management:', error);
    return false;
  }
}

/**
 * Start periodic session validity checks
 */
function startSessionChecks() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
  }
  
  // Set up interval to check session validity
  sessionCheckInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL);
}

/**
 * Check if the current session is valid
 * @returns {Promise<boolean>} Session validity
 */
export async function checkSession() {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    return false;
  }
  
  try {
    // Try to verify token with server
    const response = await fetch(`${SERVER_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).catch(error => {
      console.warn('[SessionManagement] Error checking session:', error);
      return { ok: true }; // Assume valid if server is unreachable
    });
    
    // If session is invalid, logout
    if (!response.ok) {
      console.warn('[SessionManagement] Session invalid, logging out');
      logChatEvent('auth', 'Session invalidated by server');
      logout('Session invalidated by server');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[SessionManagement] Error checking session:', error);
    return true; // Assume valid if there's an error to prevent logout loops
  }
}

/**
 * Set the WebSocket session
 * @param {Object} session - WebSocket session data
 */
export function setWebSocketSession(session) {
  wsSession = session;
}

/**
 * Get the current WebSocket session
 * @returns {Object|null} WebSocket session
 */
export function getWebSocketSession() {
  return wsSession;
}

/**
 * Renew the authentication token
 * @returns {Promise<boolean>} Success status
 */
export async function renewToken() {
  const token = getAuthToken();
  
  if (!token) {
    return false;
  }
  
  try {
    const response = await fetch(`${SERVER_BASE_URL}/auth/renew`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    if (data.token) {
      // Update token in authentication service
      // Note: This assumes authentication.js exposes a way to update the token
      // You may need to add this functionality to authentication.js
      if (typeof updateAuthToken === 'function') {
        updateAuthToken(data.token);
      } else {
        console.warn('[SessionManagement] Cannot update token, updateAuthToken function not available');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('[SessionManagement] Error renewing token:', error);
    return false;
  }
}

/**
 * Clean up session management resources
 */
export function cleanup() {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
  
  wsSession = null;
}

// Initialize when imported
initSessionManagement();