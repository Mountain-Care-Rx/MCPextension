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
    
    /* Logo link styling */
    #mcp-crm-header .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    #mcp-crm-header .logo-link:hover {
      opacity: 0.85;
    }
    
    #mcp-crm-header .logo-icon {
      width: 16px;
      height: 16px;
      margin-right: 6px;
    }
    
    #mcp-crm-header .logo {
      font-weight: bold;
      color: white;
      font-size: 14px;
    }
    
    #mcp-crm-header .external-link {
      text-decoration: none;
      color: #e6e6e6;
      display: flex;
      align-items: center;
      transition: all 0.2s ease;
      margin-right: 10px;
    }
    
    #mcp-crm-header .external-link:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    
    #mcp-crm-header .ext-link-icon {
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Styling for text links with icons */
    #mcp-crm-header .text-link {
      text-decoration: none;
      margin-right: 4px; /* Reduced margin between buttons */
      font-size: 12px;
      padding: 3px 6px; /* Reduced horizontal padding to make buttons skinnier */
      border-radius: 3px;
      color: #e6e6e6;
      display: flex;
      align-items: center;
      justify-content: center; /* Center content horizontally */
      white-space: nowrap; /* Prevent text wrapping */
      min-width: 68px; /* Set minimum width to keep consistency */
    }
    
    #mcp-crm-header .text-link:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }
    
    #mcp-crm-header .text-link .link-icon {
      margin-right: 4px; /* Slightly reduced margin for tighter look */
      width: 16px;
      height: 16px;
      vertical-align: middle;
      flex-shrink: 0; /* Prevent icon from shrinking */
    }
    
    /* Add a specific class for each button to fine-tune widths if needed */
    #mcp-crm-header .shipstation-link {
      min-width: 92px;
    }
    
    #mcp-crm-header .stripe-link {
      min-width: 65px;
    }
    
    #mcp-crm-header .webmail-link {
      min-width: 78px;
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
      background-color: #2F3A4B;
      min-width: 180px;
      box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
      z-index: 1000000;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 2px;
      left: 0;
    }
    
    .dropdown.show .dropdown-content {
      display: block;
    }
    
    .dropdown-item {
      color: #e6e6e6;
      padding: 8px 12px;
      text-decoration: none;
      display: block;
      font-size: 12px;
      cursor: pointer;
      font-weight: normal;
    }
    
    .dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
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
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      cursor: pointer;
      font-weight: bold;
      font-size: 12px;
      color: #e6e6e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .nested-dropdown-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .nested-dropdown-btn:after {
      content: "▼";
      font-size: 8px;
      color: #e6e6e6;
    }
    
    .nested-dropdown-content {
      display: none;
      padding: 5px 0 5px 10px;
      background-color: #2F3A4B;
    }
    
    .nested-dropdown.open .nested-dropdown-content {
      display: block;
    }
    
    .nested-dropdown-item {
      display: block;
      padding: 5px 10px;
      color: #e6e6e6;
      text-decoration: none;
      font-size: 12px;
      cursor: pointer;
      border-radius: 3px;
      font-weight: normal;
    }
    
    .nested-dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    /* Settings dropdown styling */
    #mcp-crm-settings-dropdown {
      position: absolute;
      top: 32px;
      right: 15px;
      background-color: #2F3A4B;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      min-width: 200px;
      z-index: 1000000;
      display: none;
      color: #e6e6e6;
    }
    
    #mcp-crm-settings-dropdown.show {
      display: block;
    }
    
    #mcp-crm-settings-dropdown .settings-header {
      background-color: rgba(255, 255, 255, 0.1);
      color: #e6e6e6;
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    #mcp-crm-settings-dropdown .setting-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    
    #mcp-crm-settings-dropdown .setting-label {
      flex-grow: 1;
      font-size: 13px;
      color: #e6e6e6;
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
      background-color: #555;
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
      background-color: #2196F3;
    }
    
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    
    /* Version info section in settings */
    .version-info {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 10px;
      padding-top: 10px;
      font-size: 12px;
      color: #e6e6e6;
    }
    
    .version-info p {
      margin: 5px 0;
    }
    
    .version-number {
      font-weight: 600;
      color: #e6e6e6;
    }
    
    .check-updates-btn {
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      padding: 4px 8px;
      margin-top: 5px;
      font-size: 11px;
      cursor: pointer;
      transition: background-color 0.2s;
      width: 100%;
      text-align: center;
      color: #e6e6e6;
    }
    
    .check-updates-btn:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    .check-updates-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}