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
  allowedNetworkRange: '192.168.0.0/16', // Local network range
  adminEnabled: true // Enable admin dashboard
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
        <p>Admin dashboard available at: <a href="http://localhost:${serverPort}/admin">http://localhost:${serverPort}/admin</a></p>
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

// Function to serve static files
function serveStaticFile(req, res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If file not found, return 404
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Serve the file with proper content type
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// Handle admin API requests
function handleAdminApi(req, res) {
  const endpoint = req.url.replace('/admin/api/', '');
  
  // Server status API
  if (endpoint === 'status') {
    const status = {
      activeConnections: wss.clients.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      users: []
    };
    
    // Add user information
    clients.forEach((client, ws) => {
      if (client.authenticated) {
        status.users.push({
          id: client.id,
          username: client.username || 'Anonymous',
          connectionTime: client.connectionTime,
          lastActivity: client.lastActivity
        });
      }
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
    return;
  }
  
  // Disconnect user API
  if (endpoint === 'disconnect-user' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const userId = data.userId;
        
        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User ID is required' }));
          return;
        }
        
        // Find the user and disconnect them
        let found = false;
        
        wss.clients.forEach((ws) => {
          const client = clients.get(ws);
          if (client && client.id === userId) {
            log('info', 'Admin disconnected user', { userId, username: client.username });
            ws.close(1000, 'Disconnected by administrator');
            found = true;
          }
        });
        
        if (found) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request format' }));
      }
    });
    
    return;
  }
  
  // Send message to user API
  if (endpoint === 'send-message' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const userId = data.userId;
        const message = data.message;
        
        if (!userId || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User ID and message are required' }));
          return;
        }
        
        // Find the user and send the message
        let found = false;
        
        wss.clients.forEach((ws) => {
          const client = clients.get(ws);
          if (client && client.id === userId) {
            const adminMessage = {
              type: 'admin_message',
              sender: 'ADMIN',
              text: message,
              timestamp: new Date().toISOString(),
              id: crypto.randomBytes(16).toString('hex')
            };
            
            ws.send(JSON.stringify(adminMessage));
            log('info', 'Admin sent message to user', { userId, username: client.username });
            found = true;
          }
        });
        
        if (found) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'User not found' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request format' }));
      }
    });
    
    return;
  }
  
  // Unknown API endpoint
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'API endpoint not found' }));
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Log HTTP access
  log('info', 'HTTP access', {
    ip: req.socket.remoteAddress,
    url: req.url,
    userAgent: req.headers['user-agent']
  });
  
  // Handle admin HTML files
  if (req.url === '/admin') {
    res.writeHead(302, { 'Location': '/admin/login.html' });
    res.end();
    return;
  }
  
  if (req.url === '/admin/login.html') {
    const filePath = path.join(__dirname, 'admin', 'login.html');
    serveStaticFile(req, res, filePath, 'text/html');
    return;
  }
  
  if (req.url === '/admin/dashboard.html') {
    const filePath = path.join(__dirname, 'admin', 'dashboard.html');
    serveStaticFile(req, res, filePath, 'text/html');
    return;
  }
  
  // Handle admin API requests
  if (req.url.startsWith('/admin/api/')) {
    handleAdminApi(req, res);
    return;
  }
  
  // Serve the default status page for all other routes
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
        .admin-link { display: inline-block; margin-top: 20px; padding: 10px 15px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 4px; }
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
      <a href="/admin" class="admin-link">Access Admin Dashboard</a>
    </body>
    </html>
  `);
});

// Track server start time
const serverStartTime = new Date();
// Store it globally for admin dashboard
global.serverStartTime = serverStartTime;

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

// Handle admin WebSocket connection
wss.on('connection', (ws, req) => {
  // Check if this is an admin WebSocket connection
  if (req.url === '/admin/ws') {
    // Set up admin WebSocket
    const adminId = crypto.randomBytes(16).toString('hex');
    log('info', 'Admin WebSocket connected', { adminId });
    
    // Send server status immediately
    const status = {
      activeConnections: wss.clients.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      users: []
    };
    
    clients.forEach((client, clientWs) => {
      if (client.authenticated) {
        status.users.push({
          id: client.id,
          username: client.username || 'Anonymous',
          connectionTime: client.connectionTime,
          lastActivity: client.lastActivity
        });
      }
    });
    
    ws.send(JSON.stringify({
      type: 'server_status',
      data: status
    }));
    
    // Handle admin WebSocket messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        log('error', 'Error processing admin WebSocket message', { error: error.message });
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      log('info', 'Admin WebSocket disconnected', { adminId });
    });
  }
});

// Graceful shutdown
function shutdown() {
  log('info', 'Server shutting down', { activeConnections: wss.clients.size });
  
  // Close all client connections
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  
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

// Ensure admin directory exists
const adminDir = path.join(__dirname, 'admin');
if (!fs.existsSync(adminDir)) {
  fs.mkdirSync(adminDir, { recursive: true });
}

// Write the login.html and dashboard.html files
const loginHtmlPath = path.join(adminDir, 'login.html');
const dashboardHtmlPath = path.join(adminDir, 'dashboard.html');

// Create login.html file if it doesn't exist
if (!fs.existsSync(loginHtmlPath)) {
  fs.writeFileSync(loginHtmlPath, `<!DOCTYPE html>
<html>
<head>
  <title>HIPAA Chat - Admin Login</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .login-container {
      background-color: white;
      padding: 30px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 350px;
    }
    h1 {
      text-align: center;
      color: #2196F3;
      margin-bottom: 30px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input[type="text"],
    input[type="password"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 14px;
      box-sizing: border-box;
    }
    .submit-btn {
      width: 100%;
      padding: 10px;
      background-color: #2196F3;
      border: none;
      color: white;
      font-weight: bold;
      border-radius: 3px;
      cursor: pointer;
    }
    .submit-btn:hover {
      background-color: #1976D2;
    }
    .error {
      color: #f44336;
      margin-top: 20px;
      text-align: center;
    }
    .note {
      font-size: 12px;
      color: #666;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>Admin Login</h1>
    <form id="loginForm">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required autocomplete="off">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit" class="submit-btn">Login</button>
      <div id="error-message" class="error" style="display: none;"></div>
      <div class="note">
        Default credentials: admin / admin123<br>
        Change these after first login!
      </div>
    </form>
  </div>
  
  <script>
    // Show error message if present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      const errorElement = document.getElementById('error-message');
      errorElement.textContent = decodeURIComponent(error);
      errorElement.style.display = 'block';
    }
    
    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Simple client-side validation
      if (username === 'admin' && password === 'admin123') {
        // Redirect to dashboard
        window.location.href = '/admin/dashboard.html';
      } else {
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = 'Invalid username or password';
        errorElement.style.display = 'block';
      }
    });
  </script>
</body>
</html>`);
  
  log('info', 'Created admin login.html file');
}

// Create dashboard.html file if it doesn't exist
if (!fs.existsSync(dashboardHtmlPath)) {
  fs.writeFileSync(dashboardHtmlPath, `<!DOCTYPE html>
<html>
<head>
  <title>HIPAA Chat - Admin Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 250px;
      background-color: #2c3e50;
      color: white;
      padding: 20px 0;
    }
    .sidebar-header {
      padding: 0 20px;
      margin-bottom: 30px;
    }
    .sidebar-header h1 {
      margin: 0;
      font-size: 1.5em;
    }
    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .sidebar-menu li {
      padding: 12px 20px;
      cursor: pointer;
      transition: background-color 0.3s;
      display: flex;
      align-items: center;
    }
    .sidebar-menu li:hover, .sidebar-menu li.active {
      background-color: #34495e;
    }
    .sidebar-menu li .icon {
      margin-right: 10px;
    }
    .main-content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
      margin-bottom: 20px;
    }
    .user-info {
      display: flex;
      align-items: center;
    }
    .page-title {
      font-size: 1.5em;
      margin: 0;
    }
    .card {
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
      overflow: hidden;
    }
    .card-header {
      padding: 15px 20px;
      background-color: #f9f9f9;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h2 {
      margin: 0;
      font-size: 1.2em;
    }
    .card-body {
      padding: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    .stat-card {
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      padding: 20px;
      text-align: center;
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #888;
      font-weight: normal;
    }
    .stat-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #2196F3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background-color: #f9f9f9;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .btn {
      display: inline-block;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      border: none;
      font-size: 14px;
    }
    .btn-primary {
      background-color: #2196F3;
      color: white;
    }
    .btn-primary:hover {
      background-color: #0b7dda;
    }
    .btn-danger {
      background-color: #f44336;
      color: white;
    }
    .btn-danger:hover {
      background-color: #da190b;
    }
    .btn-warning {
      background-color: #ff9800;
      color: white;
    }
    .btn-warning:hover {
      background-color: #e68a00;
    }
    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }
    #connectionStatus {
      margin-top: 20px;
      text-align: center;
      padding: 10px;
      font-weight: bold;
    }
    .status-indicator {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 20px;
    }
    .online {
      color: #4CAF50;
    }
    .offline {
      color: #f44336;
    }
    
    /* Tab panels */
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>HIPAA Chat Admin</h1>
      </div>
      <ul class="sidebar-menu" id="mainMenu">
        <li data-tab="dashboard" class="active"><span class="icon">📊</span> Dashboard</li>
        <li data-tab="users"><span class="icon">👥</span> User Management</li>
        <li data-tab="channels"><span class="icon">💬</span> Channels</li>
        <li data-tab="messages"><span class="icon">✉️</span> Message Monitoring</li>
        <li data-tab="logs"><span class="icon">📝</span> System Logs</li>
        <li data-tab="settings"><span class="icon">⚙️</span> Settings</li>
        <li id="logout"><span class="icon">🚪</span> Logout</li>
      </ul>
      <div id="connectionStatus">
        <span class="status-indicator online">• Connected</span>
      </div>
    </div>
    <div class="main-content">
      <div class="header">
        <h1 class="page-title">Dashboard</h1>
        <div class="user-info">
          <span>Welcome, Admin</span>
        </div>
      </div>
      
      <!-- Dashboard Tab -->
      <div id="dashboard" class="tab-content active">
        <div class="grid">
          <div class="stat-card">
            <h3>Active Connections</h3>
            <div class="value" id="activeConnections">-</div>
          </div>
          <div class="stat-card">
            <h3>Messages Today</h3>
            <div class="value" id="messagesCount">-</div>
          </div>
          <div class="stat-card">
            <h3>Memory Usage</h3>
            <div class="value" id="memoryUsage">-</div>
          </div>
          <div class="stat-card">
            <h3>Uptime</h3>
            <div class="value" id="uptime">-</div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h2>Connected Users</h2>
            <button class="btn btn-primary" id="refreshBtn">Refresh</button>
          </div>
          <div class="card-body">
            <table id="usersTable">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Connected</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                <tr>
                  <td colspan="4">Loading users...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Users Tab -->
      <div id="users" class="tab-content">
        <div class="card">
          <div class="card-header">
            <h2>User Management</h2>
            <button class="btn btn-primary">Add User</button>
          </div>
          <div class="card-body">
            <p>User management functionality coming soon.</p>
          </div>
        </div>
      </div>
      
      <!-- Channels Tab -->
      <div id="channels" class="tab-content">
        <div class="card">
          <div class="card-header">
            <h2>Channel Management</h2>
            <button class="btn btn-primary">Add Channel</button>
          </div>
          <div class="card-body">
            <p>Channel management functionality coming soon.</p>
          </div>
        </div>
      </div>
      
      <!-- Messages Tab -->
      <div id="messages" class="tab-content">
        <div class="card">
          <div class="card-header">
            <h2>Message Monitoring</h2>
            <select id="channelSelect">
              <option value="all">All Channels</option>
            </select>
          </div>
          <div class="card-body">
            <p>Message monitoring functionality coming soon.</p>
          </div>
        </div>
      </div>
      
      <!-- Logs Tab -->
      <div id="logs" class="tab-content">
        <div class="card">
          <div class="card-header">
            <h2>System Logs</h2>
            <div>
              <select id="logLevelSelect">
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
              <button class="btn btn-primary">Refresh</button>
            </div>
          </div>
          <div class="card-body">
            <p>System logs functionality coming soon.</p>
          </div>
        </div>
      </div>
      
      <!-- Settings Tab -->
      <div id="settings" class="tab-content">
        <div class="card">
          <div class="card-header">
            <h2>Server Settings</h2>
            <button class="btn btn-primary">Save Changes</button>
          </div>
          <div class="card-body">
            <p>Settings functionality coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Constants and variables
    const apiBase = '/admin/api';
    let refreshInterval = null;
    let wsConnection = null;
    
    // DOM Elements
    const pageTitle = document.querySelector('.page-title');
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
    const connectionStatus = document.querySelector('#connectionStatus .status-indicator');
    const refreshBtn = document.getElementById('refreshBtn');
    const usersTableBody = document.getElementById('usersTableBody');
    
    // Metrics elements
    const activeConnectionsEl = document.getElementById('activeConnections');
    const messagesCountEl = document.getElementById('messagesCount');
    const memoryUsageEl = document.getElementById('memoryUsage');
    const uptimeEl = document.getElementById('uptime');
    
    // Initialize the dashboard
    document.addEventListener('DOMContentLoaded', () => {
      // Set up menu click handlers
      menuItems.forEach(item => {
        if (item.id !== 'logout') {
          item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
          });
        }
      });
      
      // Set up logout button
      document.getElementById('logout').addEventListener('click', function() {
        window.location.href = '/admin/login.html';
      });
      
      // Set up refresh button
      refreshBtn.addEventListener('click', function() {
        fetchServerStatus();
      });
      
      // Connect to WebSocket for real-time updates
      connectWebSocket();
      
      // Fetch initial server status
      fetchServerStatus();
      
      // Set up refresh interval
      refreshInterval = setInterval(fetchServerStatus, 10000); // Refresh every 10 seconds
    });
    
    // Switch between tabs
    function switchTab(tabId) {
      // Update menu items
      menuItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Update tab contents
      tabContents.forEach(content => {
        if (content.id === tabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Update page title
      pageTitle.textContent = getPageTitle(tabId);
    }
    
    // Get page title based on tab ID
    function getPageTitle(tabId) {
      switch (tabId) {
        case 'dashboard': return 'Dashboard';
        case 'users': return 'User Management';
        case 'channels': return 'Channel Management';
        case 'messages': return 'Message Monitoring';
        case 'logs': return 'System Logs';
        case 'settings': return 'Settings';
        default: return 'Dashboard';
      }
    }
    
    // Connect to WebSocket
    function connectWebSocket() {
      // Close existing connection if any
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.close();
      }
      
      // Create new WebSocket connection
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = \`\${protocol}//\${location.host}/admin/ws\`;
      
      wsConnection = new WebSocket(wsUrl);
      
      // Connection opened
      wsConnection.addEventListener('open', () => {
        updateConnectionStatus(true);
        console.log('WebSocket connected');
      });
      
      // Connection closed
      wsConnection.addEventListener('close', () => {
        updateConnectionStatus(false);
        console.log('WebSocket disconnected');
        
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 5000);
      });
      
      // Connection error
      wsConnection.addEventListener('error', (error) => {
        updateConnectionStatus(false);
        console.error('WebSocket error:', error);
      });
      
      // Listen for messages
      wsConnection.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    }
    
    // Update connection status display
    function updateConnectionStatus(isConnected) {
      if (isConnected) {
        connectionStatus.className = 'status-indicator online';
        connectionStatus.textContent = '• Connected';
      } else {
        connectionStatus.className = 'status-indicator offline';
        connectionStatus.textContent = '• Disconnected';
      }
    }
    
    // Handle WebSocket message
    function handleWebSocketMessage(data) {
      if (data.type === 'server_status') {
        updateServerStatus(data.data);
      }
    }
    
    // Fetch server status
    function fetchServerStatus() {
      fetch('/admin/api/status')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch server status');
          }
          return response.json();
        })
        .then(data => {
          updateServerStatus(data);
        })
        .catch(error => {
          console.error('Error fetching server status:', error);
          updateConnectionStatus(false);
        });
    }
    
    // Update server status display
    function updateServerStatus(data) {
      // Update connection status
      updateConnectionStatus(true);
      
      // Update metrics
      activeConnectionsEl.textContent = data.activeConnections || '0';
      messagesCountEl.textContent = data.messagesCount || '0';
      
      // Format memory usage
      const memoryMB = data.memoryUsage ? Math.round(data.memoryUsage.heapUsed / 1024 / 1024) : 0;
      memoryUsageEl.textContent = \`\${memoryMB} MB\`;
      
      // Format uptime
      const uptime = data.uptime || 0;
      if (uptime < 60) {
        uptimeEl.textContent = \`\${Math.floor(uptime)} sec\`;
      } else if (uptime < 3600) {
        uptimeEl.textContent = \`\${Math.floor(uptime / 60)} min\`;
      } else {
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        uptimeEl.textContent = \`\${hours}h \${minutes}m\`;
      }
      
      // Update users table
      if (data.users && Array.isArray(data.users)) {
        if (data.users.length === 0) {
          usersTableBody.innerHTML = '<tr><td colspan="4">No users connected</td></tr>';
        } else {
          usersTableBody.innerHTML = data.users.map(user => \`
            <tr>
              <td>\${user.username || 'Anonymous'}</td>
              <td>\${formatDateTime(user.connectionTime)}</td>
              <td>\${formatDateTime(user.lastActivity)}</td>
              <td>
                <button class="btn btn-sm btn-warning" onclick="sendMessage('\${user.id}')">Message</button>
                <button class="btn btn-sm btn-danger" onclick="disconnectUser('\${user.id}')">Disconnect</button>
              </td>
            </tr>
          \`).join('');
        }
      }
    }
    
    // Format date/time
    function formatDateTime(timestamp) {
      if (!timestamp) return 'Unknown';
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    }
    
    // Send message to a user
    function sendMessage(userId) {
      const message = prompt('Enter message to send to user:');
      if (message) {
        fetch('/admin/api/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            message
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('Message sent successfully');
          } else {
            alert('Failed to send message: ' + data.error);
          }
        })
        .catch(error => {
          console.error('Error sending message:', error);
          alert('Error sending message');
        });
      }
    }
    
    // Disconnect a user
    function disconnectUser(userId) {
      if (confirm('Are you sure you want to disconnect this user?')) {
        fetch('/admin/api/disconnect-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('User disconnected successfully');
            fetchServerStatus(); // Refresh the table
          } else {
            alert('Failed to disconnect user: ' + data.error);
          }
        })
        .catch(error => {
          console.error('Error disconnecting user:', error);
          alert('Error disconnecting user');
        });
      }
    }
    
    // Clean up when page is unloaded
    window.addEventListener('beforeunload', () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (wsConnection) {
        wsConnection.close();
      }
    });
  </script>
</body>
</html>`);
  
  log('info', 'Created admin dashboard.html file');
}
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
      Admin Dashboard: http://localhost:${config.port}/admin
      
      Log File:      ${logFilePath}
      
    ===================================================
    Server is ready to accept connections
    Press Ctrl+C to shutdown
    `);
  });
}