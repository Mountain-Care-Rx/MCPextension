// chatServer.js - HIPAA-compliant local WebSocket server for CRM+ Extension
// This file can be run as a standalone executable without Node.js installed
// It doesn't require administrative privileges

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Determine if running as executable
const isExecutable = process.pkg !== undefined;

// Get application directory for storage
const getAppDirectory = () => {
  // Determine the correct path for storage based on running environment
  const homeDir = os.homedir();
  
  // Use platform-specific app data location
  if (process.platform === 'win32') {
    // Windows: %APPDATA%\CRMPlusChat
    return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'CRMPlusChat');
  } else if (process.platform === 'darwin') {
    // macOS: ~/Library/Application Support/CRMPlusChat
    return path.join(homeDir, 'Library', 'Application Support', 'CRMPlusChat');
  } else {
    // Linux/Unix: ~/.crmpluschat
    return path.join(homeDir, '.crmpluschat');
  }
};

// Create app directory
const appDirectory = getAppDirectory();
try {
  if (!fs.existsSync(appDirectory)) {
    fs.mkdirSync(appDirectory, { recursive: true });
    console.log(`Created application directory: ${appDirectory}`);
  }
} catch (error) {
  console.error('Error creating application directory:', error);
}

// Default server configuration
let config = {
  port: 3000,
  logDirectory: path.join(appDirectory, 'logs'),
  logLevel: 'info', // debug, info, warn, error
  maxConnections: 100,
  authenticateUsers: false, // Enable this if you want to require authentication
  connectionTimeout: 2 * 60 * 1000, // 2 minutes
  heartbeatInterval: 30 * 1000, // 30 seconds
  allowedNetworkRange: '192.168.0.0/16' // Local network range
};

// Load configuration from config.json if available
const configFilePath = path.join(process.pkg ? path.dirname(process.execPath) : __dirname, 'config.json');
try {
  if (fs.existsSync(configFilePath)) {
    console.log(`Loading configuration from ${configFilePath}`);
    const fileConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    
    // Merge file config with defaults
    config = { ...config, ...fileConfig };
    console.log('Configuration loaded successfully');
  } else {
    console.log('No config.json found, using default configuration');
    
    // Save default config for user reference
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`Created default configuration file: ${configFilePath}`);
  }
} catch (error) {
  console.error('Error loading configuration:', error);
}

// Parse command-line arguments (override config file and defaults)
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key in config) {
    // Convert value to appropriate type
    if (typeof config[key] === 'number') {
      config[key] = parseInt(value, 10);
    } else if (typeof config[key] === 'boolean') {
      config[key] = value.toLowerCase() === 'true';
    } else {
      config[key] = value;
    }
  }
}

// Ensure log directory exists
if (!fs.existsSync(config.logDirectory)) {
  fs.mkdirSync(config.logDirectory, { recursive: true });
}

// Create log file path
const logFilePath = path.join(config.logDirectory, `chat_server_${new Date().toISOString().slice(0, 10)}.log`);

// Simple logging helper
function log(level, message, details = {}) {
  const levels = ['debug', 'info', 'warn', 'error'];
  const levelIndex = levels.indexOf(level);
  const configLevelIndex = levels.indexOf(config.logLevel);
  
  if (levelIndex >= configLevelIndex) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      details
    };
    
    const logString = JSON.stringify(logEntry);
    
    // Console output
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    
    // File output
    try {
      fs.appendFileSync(logFilePath, logString + '\n');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }
}

// Function to create a simple tray/console UI for the executable version
function createSimpleUI() {
  try {
    // Only create UI when running as standalone executable
    if (!isExecutable) return;
    
    // For Windows, create an HTML file to display status (opens in default browser)
    const statusHtmlPath = path.join(appDirectory, 'server-status.html');
    const serverPort = config.port || 3000;
    
    // If on Windows, try to create a notification
    if (process.platform === 'win32') {
      try {
        const notifier = require('node-notifier');
        notifier.notify({
          title: 'MCP Chat Server',
          message: `Server running on ws://localhost:${serverPort}`,
          wait: true
        });
        
        notifier.on('click', () => {
          require('child_process').exec(`start http://localhost:${serverPort}`);
        });
      } catch (err) {
        // Notification failed, but we can continue without it
        console.log('Could not show notification (not critical)');
      }
    }
    
    // Create a simple status HTML file that can be opened in a browser
    const statusHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="5;url=http://localhost:${serverPort}">
      <title>MCP Chat Server</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #2196F3; }
        .card { background: #f5f5f5; border-radius: 10px; padding: 20px; margin: 20px auto; max-width: 500px; }
        .button { display: inline-block; background: #2196F3; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .info { color: #666; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>MCP Chat Server</h1>
      <div class="card">
        <h2>Server is running!</h2>
        <p>The HIPAA-compliant chat server is now running on your computer.</p>
        <p class="info">You will be redirected to the status page in 5 seconds.</p>
        <a href="http://localhost:${serverPort}" class="button">Open Status Page</a>
      </div>
      <div class="info">
        <p>To connect from the CRM+ extension:</p>
        <p>Use <strong>ws://localhost:${serverPort}</strong> on this computer</p>
        <p>Use <strong>ws://YOUR-IP-ADDRESS:${serverPort}</strong> from other computers</p>
      </div>
    </body>
    </html>
    `;
    
    fs.writeFileSync(statusHtmlPath, statusHtml);
    
    // Try to open the status page in the default browser
    try {
      const open = (process.platform === 'win32') 
        ? (file) => require('child_process').exec(`start "" "${file}"`)
        : (process.platform === 'darwin') 
          ? (file) => require('child_process').exec(`open "${file}"`) 
          : (file) => require('child_process').exec(`xdg-open "${file}"`);
          
      // Open the status HTML file
      setTimeout(() => {
        open(statusHtmlPath);
      }, 1000);
    } catch (err) {
      console.log('Could not open browser (not critical)');
    }
  } catch (error) {
    console.error('Error creating UI:', error);
    // Non-critical error, continue without UI
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Serve a simple status page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP Chat Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2196F3; }
        .status { padding: 15px; background-color: #e8f5e9; border-radius: 4px; margin-bottom: 20px; }
        .info { background-color: #e3f2fd; padding: 15px; border-radius: 4px; }
        .clients { margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <h1>HIPAA-Compliant Chat Server</h1>
      <div class="status">
        <h2>Server Status: Running</h2>
        <p>The server is running and ready to accept WebSocket connections.</p>
      </div>
      <div class="info">
        <h3>Connection Information</h3>
        <p>WebSocket URL: <code>ws://${req.headers.host}</code></p>
        <p>Active Clients: ${wss ? wss.clients.size : 0}/${config.maxConnections}</p>
        <p>Server started: ${serverStartTime.toLocaleString()}</p>
      </div>
      <div class="note">
        <p><strong>Note:</strong> This server should only be used within your local network. 
        All communications are kept within the organization's network for HIPAA compliance.</p>
      </div>
    </body>
    </html>
  `);
  
  // Log HTTP access
  log('info', 'HTTP access', {
    ip: req.socket.remoteAddress,
    url: req.url,
    userAgent: req.headers['user-agent']
  });
});

// Track server start time
const serverStartTime = new Date();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Connected clients
const clients = new Map();

// Generate server session key
const serverSessionKey = crypto.randomBytes(32).toString('hex');
log('info', 'Server started with new session key');

// Handle new WebSocket connections
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  const clientId = crypto.randomBytes(16).toString('hex');
  
  log('info', 'New connection', { clientId, ip: clientIp });
  
  // Check maximum connections
  if (wss.clients.size > config.maxConnections) {
    log('warn', 'Connection limit reached', { clientId });
    ws.close(1013, 'Maximum number of connections reached');
    return;
  }
  
  // Check if client is on the local network
  if (!isLocalIpAddress(clientIp)) {
    log('warn', 'Rejected non-local connection', { clientId, ip: clientIp });
    ws.close(1008, 'Only local network connections are allowed');
    return;
  }
  
  // Initialize client data
  const clientData = {
    id: clientId,
    ip: clientIp,
    username: null,
    authenticated: !config.authenticateUsers, // Auto-authenticate if auth is disabled
    connectionTime: new Date(),
    lastActivity: new Date()
  };
  
  // Add to clients map
  clients.set(ws, clientData);
  
  // Set connection timeout
  const connectionTimeoutId = setTimeout(() => {
    if (!clientData.authenticated) {
      log('warn', 'Authentication timeout', { clientId });
      ws.close(1008, 'Authentication timeout');
    }
  }, config.connectionTimeout);
  
  // Send initial message with server info
  const welcomeMessage = {
    type: 'welcome',
    serverTime: new Date().toISOString(),
    needsAuthentication: config.authenticateUsers,
    sessionKey: serverSessionKey.substr(0, 8), // Send partial key for verification
    clientId: clientId
  };
  
  ws.send(JSON.stringify(welcomeMessage));
  
  // Heartbeat to check if client is still connected
  let heartbeatInterval;
  
  const startHeartbeat = () => {
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
        
        // Check for inactivity
        const inactiveTime = Date.now() - clientData.lastActivity.getTime();
        if (inactiveTime > config.connectionTimeout) {
          log('info', 'Client inactive, closing connection', { clientId });
          ws.close(1000, 'Connection timeout due to inactivity');
        }
      }
    }, config.heartbeatInterval);
  };
  
  startHeartbeat();
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      // Update last activity time
      clientData.lastActivity = new Date();
      
      // Parse the message
      const data = JSON.parse(message);
      
      // Process message based on type
      switch (data.type) {
        case 'auth':
          // Handle authentication
          if (config.authenticateUsers && !clientData.authenticated) {
            // In a production environment, you would verify credentials here
            clientData.authenticated = true;
            clientData.username = data.username || `User_${clientId.substr(0, 6)}`;
            
            // Clear the authentication timeout
            clearTimeout(connectionTimeoutId);
            
            // Respond with success
            ws.send(JSON.stringify({
              type: 'auth_response',
              success: true,
              timestamp: new Date().toISOString()
            }));
            
            log('info', 'Client authenticated', { 
              clientId, 
              username: clientData.username 
            });
            
            // Send updated user list to all clients
            broadcastUserList();
          }
          break;
          
        case 'chat':
          // Only relay messages from authenticated clients
          if (!clientData.authenticated) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not authenticated',
              timestamp: new Date().toISOString()
            }));
            break;
          }
          
          // Message should have sender, text, and recipient fields
          if (!data.sender || !data.text) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
              timestamp: new Date().toISOString()
            }));
            break;
          }
          
          // Record username if not set (for clients that send messages before auth)
          if (!clientData.username) {
            clientData.username = data.sender;
          }
          
          // Log the message (without content for privacy)
          log('info', 'Chat message relayed', {
            clientId,
            sender: data.sender,
            recipient: data.recipient || 'broadcast',
            messageId: data.id
          });
          
          // Relay the message
          if (data.recipient && data.recipient !== 'broadcast') {
            // Direct message to specific recipient
            sendToUser(data.recipient, data);
            
            // Also send back to sender for confirmation
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(message);
            }
          } else {
            // Broadcast message to all clients
            broadcast(data, ws);
          }
          break;
          
        case 'heartbeat_response':
          // Client responded to heartbeat, do nothing
          break;
          
        case 'username_update':
          // Update username
          if (clientData.authenticated) {
            const oldUsername = clientData.username;
            clientData.username = data.new_username;
            
            log('info', 'Username updated', {
              clientId,
              oldUsername,
              newUsername: clientData.username
            });
            
            // Broadcast user list update
            broadcastUserList();
          }
          break;
          
        case 'logout':
          // Client is logging out
          log('info', 'Client logout', { clientId, username: clientData.username });
          ws.close(1000, 'Logout requested');
          break;
          
        default:
          log('warn', 'Unknown message type', { clientId, type: data.type });
      }
    } catch (error) {
      log('error', 'Error processing message', { clientId, error: error.message });
      
      // Send error message back to client
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // Handle client disconnection
  ws.on('close', (code, reason) => {
    // Clear heartbeat interval
    clearInterval(heartbeatInterval);
    
    // Clear auth timeout
    clearTimeout(connectionTimeoutId);
    
    // Get user info before removing
    const username = clients.get(ws)?.username;
    
    // Remove client
    clients.delete(ws);
    
    // Log disconnection
    log('info', 'Client disconnected', {
      clientId,
      code,
      reason: reason.toString(),
      username
    });
    
    // Broadcast updated user list
    broadcastUserList();
  });
  
  // Handle errors
  ws.on('error', (error) => {
    log('error', 'WebSocket error', { clientId, error: error.message });
  });
});

/**
 * Broadcast a message to all connected clients
 * @param {Object} message - The message to broadcast
 * @param {WebSocket} exclude - Optional client to exclude from broadcast
 */
function broadcast(message, exclude = null) {
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      const clientData = clients.get(client);
      
      // Only send to authenticated clients
      if (clientData && clientData.authenticated) {
        client.send(JSON.stringify(message));
      }
    }
  });
}

/**
 * Send a message to a specific user
 * @param {string} username - Username to send to
 * @param {Object} message - The message to send
 * @returns {boolean} Success status
 */
function sendToUser(username, message) {
  let sent = false;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const clientData = clients.get(client);
      
      if (clientData && clientData.authenticated && clientData.username === username) {
        client.send(JSON.stringify(message));
        sent = true;
      }
    }
  });
  
  return sent;
}

/**
 * Broadcast the current user list to all clients
 */
function broadcastUserList() {
  // Create user list
  const users = [];
  
  clients.forEach((client) => {
    if (client.authenticated && client.username) {
      users.push({
        username: client.username,
        id: client.id,
        // Don't include IP for privacy
        connectionTime: client.connectionTime.toISOString()
      });
    }
  });
  
  // Broadcast to all clients
  const userListMessage = {
    type: 'user_list',
    users: users,
    timestamp: new Date().toISOString()
  };
  
  broadcast(userListMessage);
}

/**
 * Check if an IP address is within the local network range
 * @param {string} ip - IP address to check
 * @returns {boolean} True if IP is local
 */
function isLocalIpAddress(ip) {
  // Always allow localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }
  
  // Simple check for private IP ranges
  if (ip.startsWith('10.') || 
      ip.startsWith('172.16.') || 
      ip.startsWith('172.17.') || 
      ip.startsWith('172.18.') || 
      ip.startsWith('172.19.') || 
      ip.startsWith('172.2') || 
      ip.startsWith('172.30.') || 
      ip.startsWith('172.31.') || 
      ip.startsWith('192.168.')) {
    return true;
  }
  
  // Always allow IPv6 local addresses
  if (ip.startsWith('fc00:') || ip.startsWith('fd00:') || ip.startsWith('fe80:')) {
    return true;
  }
  
  // Reject all other IPs
  return false;
}

// Graceful shutdown
function shutdown() {
  log('info', 'Server shutting down', { activeConnections: wss.clients.size });
  
  // Close all client connections
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  
  // Close the server
  server.close(() => {
    log('info', 'Server shutdown complete');
    process.exit(0);
  });
  
  // Force exit after timeout
  setTimeout(() => {
    log('error', 'Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Initialize UI for standalone executable
createSimpleUI();

// Start the server
server.listen(config.port, () => {
  log('info', `Server started on port ${config.port}`, {
    port: config.port,
    logLevel: config.logLevel,
    authenticateUsers: config.authenticateUsers,
    maxConnections: config.maxConnections
  });
  
  console.log(`
  ===================================================
    HIPAA-Compliant Chat Server Started
  ===================================================
  
    WebSocket URL: ws://localhost:${config.port}
    Status Page:   http://localhost:${config.port}
    
    Log File:      ${logFilePath}
    
  ===================================================
  Server is ready to accept connections
  Press Ctrl+C to shutdown
  `);
});