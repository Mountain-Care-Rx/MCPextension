// modules/ui/styles/headerStyles.js

/**
 * Creates and applies all CSS styles for the header bar
 */
export function createHeaderStyles() {
  // Check if styles are already added
  if (document.getElementById('mcp-crm-header-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'mcp-crm-header-styles';
  style.textContent = `
    #mcp-crm-header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 32px;
      background-color: #2F3A4B;
      display: flex;
      align-items: center;
      padding: 0 15px;
      font-family: 'Segoe UI', 'Roboto', sans-serif;
      font-size: 12px;
      z-index: 999999;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    #mcp-crm-header .group {
      display: flex;
      align-items: center;
      margin-right: 15px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding-right: 15px;
    }
    
    #mcp-crm-header .group:last-child {
      border-right: none;
    }
    
    #mcp-crm-header .spacer {
      flex-grow: 1;
    }
    
    #mcp-crm-header .label {
      color: #8a9cad;
      margin-right: 6px;
      font-weight: 500;
    }
    
    #mcp-crm-header .value {
      color: #e6e6e6;
      font-weight: 600;
    }
    
    #mcp-crm-header .clickable-value {
      color: #e6e6e6;
      font-weight: 600;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.05);
      padding: 2px 8px;
      border-radius: 3px;
      transition: background-color 0.2s;
      display: inline-flex;
      align-items: center;
    }
    
    #mcp-crm-header .clickable-value:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }
    
    #mcp-crm-header .btn-icon {
      margin-right: 4px;
      font-size: 10px;
    }
    
external-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    
    #mcp-crm-header .ext-link-icon {
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #mcp-crm-header .btn {
      color: #e6e6e6;
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      margin-right: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
    }
    
    #mcp-crm-header .btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    #mcp-crm-header .btn:active {
      background-color: rgba(255, 255, 255, 0.3);
    }
    
    #mcp-crm-header .btn:last-child {
      margin-right: 0;
    }
    
    #mcp-crm-header .logo {
      font-weight: bold;
      color: white;
      font-size: 14px;
      margin-right: 15px;
    }
    
    /* Dropdown styling */
    .dropdown {
      position: relative;
      display: inline-block;
      margin-right: 8px;
    }
    
    .dropdown-btn {
      color: #e6e6e6;
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 100px;
    }
    
    .dropdown-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .dropdown-btn:after {
      content: "▼";
      font-size: 8px;
      margin-left: 5px;
    }
    
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: #fff;
      min-width: 180px;
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
      z-index: 1000000;
      border-radius: 4px;
      margin-top: 2px;
      left: 0;
    }
    
    .dropdown.show .dropdown-content {
      display: block;
    }
    
    .dropdown-item {
      color: #333;
      padding: 8px 12px;
      text-decoration: none;
      display: block;
      font-size: 12px;
      cursor: pointer;
    }
    
    .dropdown-item:hover {
      background-color: #f1f1f1;
    }
    
    /* Nested Dropdown styling */
    .nested-dropdown {
      margin-bottom: 5px;
      width: 100%;
    }
    
    .nested-dropdown-btn {
      width: 100%;
      text-align: left;
      padding: 6px 10px;
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .nested-dropdown-btn:hover {
      background-color: #e1e1e1;
    }
    
    .nested-dropdown-btn:after {
      content: "▼";
      font-size: 8px;
    }
    
    .nested-dropdown-content {
      display: none;
      padding: 5px 0 5px 10px;
    }
    
    .nested-dropdown.open .nested-dropdown-content {
      display: block;
    }
    
    .nested-dropdown-item {
      display: block;
      padding: 5px 10px;
      color: #333;
      text-decoration: none;
      font-size: 12px;
      cursor: pointer;
      border-radius: 3px;
    }
    
    .nested-dropdown-item:hover {
      background-color: #e8e8e8;
    }
    
    /* Settings dropdown styling */
    #mcp-crm-settings-dropdown {
      position: absolute;
      top: 32px;
      right: 15px;
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      min-width: 200px;
      z-index: 1000000;
      display: none;
    }
    
    #mcp-crm-settings-dropdown.show {
      display: block;
    }
    
    #mcp-crm-settings-dropdown .settings-header {
      background-color: #2F3A4B;
      color: white;
      padding: 8px 12px;
      font-weight: bold;
      border-top-left-radius: 3px;
      border-top-right-radius: 3px;
    }
    
    #mcp-crm-settings-dropdown .settings-body {
      padding: 10px;
    }
    
    #mcp-crm-settings-dropdown .setting-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    
    #mcp-crm-settings-dropdown .setting-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    #mcp-crm-settings-dropdown .setting-label {
      flex-grow: 1;
      font-size: 13px;
      color: #333;
    }
    
    /* Toggle switch styling */
    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 20px;
    }
    
    .switch input { 
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 34px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: #2F3A4B;
    }
    
    input:checked + .slider:before {
      transform: translateX(20px);
    }
  `;
  document.head.appendChild(style);
}