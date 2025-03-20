/server/
├── chatServer.js           # Main WebSocket server entry point
├── config.json             # Server configuration file
├── start-server.bat        # Windows startup script
├── startServer.sh          # Unix/Linux startup script
├── package.json            # NPM package definition
├── dashboard/              # Admin dashboard related files
│   ├── assets.js           # Static asset handling
│   ├── auth.js             # Authentication logic
│   ├── audit.js            # Audit logging
│   ├── config.js           # Configuration management
│   ├── http.js             # HTTP route handling
│   ├── metrics.js          # Server metrics collection
│   ├── messages.js         # Message handling
│   ├── websocket.js        # WebSocket handling
│   └── admin-config.json   # Admin dashboard specific configuration
├── admin/                  # Admin dashboard HTML files
│   ├── login.html          # Login page
│   └── dashboard.html      # Dashboard page
└── assets/                 # Static assets for admin dashboard
    ├── login.css           # Login page styles
    └── dashboard.css       # Dashboard page styles