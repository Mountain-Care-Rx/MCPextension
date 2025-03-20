// server/adminDashboard.js - Main entry point for admin dashboard functionality
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import dashboard modules
const { loadConfig, getConfig, saveConfig } = require('./dashboard/config');
const { setupHttpRoutes } = require('./dashboard/http');
const { setupWebSocket } = require('./dashboard/websocket');
const { startMetricsCollection } = require('./dashboard/metrics');
const { validateSession, createSession, endSession } = require('./dashboard/auth');
const { logAction, getAdminLogs } = require('./dashboard/audit');

/**
 * Initialize the admin dashboard
 * @param {object} server - HTTP server instance
 * @param {object} wss - WebSocket server instance
 * @param {Map} clients - Client map from main server
 * @param {object} serverConfig - Server configuration
 * @param {function} broadcast - Broadcast function from main server
 * @returns {object} Admin dashboard API
 */
function initAdminDashboard(server, wss, clients, serverConfig, broadcast) {
  // Load admin configuration
  loadConfig();
  
  // Set up HTTP routes for dashboard
  setupHttpRoutes(server, wss, clients, serverConfig);
  
  // Set up WebSocket handling for dashboard
  setupWebSocket(wss, clients, serverConfig, broadcast);
  
  // Start metrics collection
  const metricsCollector = startMetricsCollection(wss, clients);
  
  // Return API for main server
  return {
    validateSession,
    logAction,
    getMetrics: metricsCollector.getMetrics,
    shutdown: () => {
      metricsCollector.shutdown();
    }
  };
}

/**
 * Get application directory for data storage
 * @returns {string} Directory path
 */
function getAppDirectory() {
  const homeDir = os.homedir();
  
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'CRMPlusChat');
  } else if (process.platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'CRMPlusChat');
  } else {
    return path.join(homeDir, '.crmpluschat');
  }
}

// Export the dashboard initializer and utility functions
module.exports = {
  initAdminDashboard,
  getAppDirectory
};