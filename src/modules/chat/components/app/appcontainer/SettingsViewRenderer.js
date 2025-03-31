// chat/components/app/appcontainer/SettingsViewRenderer.js
// Handles rendering of the settings view component

/**
 * Render the settings view
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Rendering options
 * @returns {HTMLElement} The rendered settings view
 */
export function renderSettingsView(container, options = {}) {
    const {
      settings = { theme: 'Light', fontSize: 'Medium', enable2FA: false, globalNotifications: 'all' }, // Added default globalNotifications
      onLogout = () => console.log('Logout not implemented'),
      onThemeChange = (theme) => console.log('Theme change not handled:', theme),
      onFontSizeChange = (size) => console.log('Font size change not handled:', size),
      onChangePasswordClick = () => console.log('Change password click not handled'),
      on2FAChange = (enabled) => console.log('2FA change not handled:', enabled),
      onGlobalNotificationChange = (level) => console.log('Global notification change not handled:', level) // Added handler prop
    } = options;

    // Create settings layout with improved styling
    const settingsContainer = document.createElement('div');
    applyStyles(settingsContainer, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      padding: '20px',
      backgroundColor: '#ffffff',
      overflowY: 'auto'
    });
    
    // Create settings header
    const settingsHeader = document.createElement('div');
    applyStyles(settingsHeader, {
      marginBottom: '24px',
      borderBottom: '1px solid #e0e0e0',
      paddingBottom: '16px'
    });
    
    const settingsTitle = document.createElement('h2');
    settingsTitle.textContent = 'Settings';
    applyStyles(settingsTitle, {
      margin: '0',
      fontSize: '20px',
      color: '#333'
    });
    
    settingsHeader.appendChild(settingsTitle);
    settingsContainer.appendChild(settingsHeader);
    
    // Create settings categories
    const categories = [
      { 
        title: 'Appearance', 
        icon: '🎨',
        description: 'Customize the look and feel of the chat.',
        settings: [
          { 
            name: 'Theme', 
            type: 'select', 
            options: ['Light', 'Dark', 'System'],
            defaultValue: 'Light'
          },
          { 
            name: 'Font Size', 
            type: 'select', 
            options: ['Small', 'Medium', 'Large'],
            defaultValue: 'Small'
          }
        ]
      },
      { 
        title: 'Privacy & Security', 
        icon: '🔒',
        description: 'Manage security and privacy settings.',
        settings: [
          { 
            name: 'Change Password', 
            type: 'button', 
            label: 'Change Password' 
          },
          { 
            name: 'Two-Factor Authentication', 
            type: 'checkbox' 
          }
        ]
      },
      {
        title: 'Notifications',
        icon: '🔔',
        description: 'Manage how you receive notifications.',
        settings: [
          {
            name: 'Global Default',
            type: 'select',
            options: ['all', 'mentions', 'none'], // Match server/model levels
            defaultValue: 'all', // Default if not loaded
            settingKey: 'globalNotifications' // Key in the settings object
          }
          // TODO: Add UI for per-channel/per-DM overrides later
        ]
      },
      {
        title: 'Account',
        icon: '👤',
        description: 'Manage your account settings.',
        settings: [
          { 
            name: 'Logout', 
            type: 'logout', 
            label: 'Sign Out',
            description: 'Log out of your account'
          }
        ]
      }
    ];
    
    // Create settings sections
    categories.forEach(category => {
      // Pass all relevant options down
      const section = createSettingsSection(category, options);
      settingsContainer.appendChild(section);
    });
    
    container.appendChild(settingsContainer);
    return settingsContainer;
  }
  
  /**
   * Create a settings section
   * @param {Object} category - Category data
   * @param {Object} options - Options containing settings state and handlers
   * @returns {HTMLElement} Settings section element
   */
  function createSettingsSection(category, options) {
    const section = document.createElement('div');
    applyStyles(section, {
      marginBottom: '24px',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px'
    });
    
    // Section header
    const header = document.createElement('div');
    applyStyles(header, {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px'
    });
    
    const icon = document.createElement('span');
    icon.textContent = category.icon;
    applyStyles(icon, {
      fontSize: '20px',
      marginRight: '8px'
    });
    
    const title = document.createElement('h3');
    title.textContent = category.title;
    applyStyles(title, {
      margin: '0',
      fontSize: '16px',
      color: '#333'
    });
    
    header.appendChild(icon);
    header.appendChild(title);
    
    // Description (optional)
    if (category.description) {
      const description = document.createElement('p');
      description.textContent = category.description;
      applyStyles(description, {
        margin: '0 0 16px 0',
        fontSize: '14px',
        color: '#666'
      });
      
      section.appendChild(header);
      section.appendChild(description);
    }
    
    // Add settings controls
    if (category.settings && category.settings.length) {
      const settingsList = document.createElement('div');
      applyStyles(settingsList, {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      });
      
      category.settings.forEach(setting => {
        // Pass the full options object to the control creator
        const settingRow = createSettingControl(setting, options);
        settingsList.appendChild(settingRow);
      });
      
      section.appendChild(settingsList);
    }
    
    return section;
  }
  
  /**
   * Create a setting control
   * @param {Object} setting - Setting data (name, type, label, options, etc.)
   * @param {Object} options - Options containing settings state and handlers
   * @returns {HTMLElement} Setting control element
   */
  function createSettingControl(setting, options) {
    // Destructure all handlers passed in options
    const { settings, onLogout, onThemeChange, onFontSizeChange, onChangePasswordClick, on2FAChange, onGlobalNotificationChange } = options;

    const row = document.createElement('div');
    applyStyles(row, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    });
    
    const labelContainer = document.createElement('div');
    applyStyles(labelContainer, {
      display: 'flex',
      flexDirection: 'column'
    });
    
    const label = document.createElement('label');
    label.textContent = setting.name;
    applyStyles(label, {
      fontSize: '14px',
      color: '#333'
    });
    
    labelContainer.appendChild(label);
    
    let control;
    
    switch (setting.type) {
      case 'select':
        control = document.createElement('select');
        applyStyles(control, {
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          width: '120px'
        });
        
        if (setting.options && setting.options.length) {
          setting.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            
            // Set selected value based on current settings
            if (setting.name === 'Theme' && option === settings.theme) {
              optionElement.selected = true;
            } else if (setting.name === 'Font Size' && option === settings.fontSize) {
               optionElement.selected = true;
            } else if (!settings.theme && !settings.fontSize && option === setting.defaultValue) {
               // Fallback to defaultValue if settings aren't loaded yet (shouldn't happen often)
               optionElement.selected = true;
            }
            
            control.appendChild(optionElement);
          }); // End of forEach loop

          // Add change listener based on setting name or key
          if (setting.name === 'Theme') {
            control.addEventListener('change', (e) => onThemeChange(e.target.value));
          } else if (setting.name === 'Font Size') {
            control.addEventListener('change', (e) => onFontSizeChange(e.target.value));
          } else if (setting.name === 'Global Default') { // Handle new setting
              control.addEventListener('change', (e) => onGlobalNotificationChange(e.target.value));
          }
        } // End of if (setting.options && setting.options.length)
      break; // End of case 'select'
        
      case 'checkbox':
        control = document.createElement('input');
        control.type = 'checkbox';
        // Set initial state based on settings
        if (setting.name === 'Two-Factor Authentication') {
            control.checked = !!settings.enable2FA;
            // Add change listener
            control.addEventListener('change', (e) => on2FAChange(e.target.checked));
        }
        break;
        
      case 'button':
        control = document.createElement('button');
        control.textContent = setting.label;
        // Add click listener for specific buttons
        if (setting.name === 'Change Password') {
            control.addEventListener('click', onChangePasswordClick);
        }
        applyStyles(control, {
          padding: '8px 12px',
          backgroundColor: '#fff',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer'
        });
        break;
        
      case 'logout':
        control = document.createElement('button');
        control.textContent = setting.label;
        applyStyles(control, {
          padding: '8px 12px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        });
        
        // Hover effects
        control.addEventListener('mouseover', () => {
          control.style.backgroundColor = '#c82333';
        });
        
        control.addEventListener('mouseout', () => {
          control.style.backgroundColor = '#dc3545';
        });
        
        // Logout action
        control.addEventListener('click', onLogout);
        break;
        
      default:
        control = document.createElement('span');
        control.textContent = 'Unsupported setting type';
    }
    
    row.appendChild(labelContainer);
    row.appendChild(control);
    
    return row;
  }
  
  /**
   * Apply CSS styles to an element
   * @param {HTMLElement} element - Element to style
   * @param {Object} styles - Styles to apply
   */
  function applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }
  
  export default { renderSettingsView };