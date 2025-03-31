// chat/components/auth/LoginForm.js
// Login form component for HIPAA-compliant chat

import { login } from '../../services/auth';
import { logChatEvent } from '../../utils/logger.js';
// Import messageService functions
import { getConnectionStatus, addConnectionStatusListener, CONNECTION_STATUS } from '../../services/messageService.js';

// Header bar colors (Keep existing colors)
const HEADER_COLORS = {
  primary: '#343a40',
  secondary: '#3a444f',
  text: '#ffffff',
  accent: '#2196F3'
};

// Status indicator colors
const STATUS_COLORS = {
    connected: '#4CAF50', // Green
    connecting: '#FFC107', // Amber
    disconnected: '#F44336', // Red
    error: '#F44336', // Red
    auth_failed: '#F44336' // Red
};

/**
 * Login Form Component
 * Provides user authentication interface
 */
class LoginForm {
  /**
   * Create a new LoginForm
   * @param {HTMLElement} container - Container element
   * @param {Function} onLoginSuccess - Callback for successful login
   */
  constructor(container, onLoginSuccess) {
    this.container = container;

    // Ensure onLoginSuccess is a function
    this.onLoginSuccess = typeof onLoginSuccess === 'function'
      ? onLoginSuccess
      : () => {
          console.warn('[LoginForm] No login success callback provided');
        };

    this.formElement = null;
    this.usernameInput = null;
    this.passwordInput = null;
    this.submitButton = null;
    this.statusIndicatorElement = null; // Element for status
    this.connectionStatus = getConnectionStatus(); // Get initial status
    this.unsubscribeStatusListener = null; // Store unsubscribe function

    // Bind methods
    this.render = this.render.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateStatusIndicator = this.updateStatusIndicator.bind(this); // Bind status update method

    // Initialize component
    this.render();

    // Subscribe to connection status updates
    this.unsubscribeStatusListener = addConnectionStatusListener(this.updateStatusIndicator);
  }

  /**
   * Render the login form
   */
  render() {
    // Create login container
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';
    this.applyStyles(loginContainer, {
      maxWidth: '380px',
      width: '100%',
      margin: '40px auto 0',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      textAlign: 'center',
      position: 'relative' // Needed for absolute positioning of status indicator
    });

    // --- Create Status Indicator ---
    this.statusIndicatorElement = document.createElement('div');
    this.statusIndicatorElement.className = 'connection-status-indicator';
    this.applyStyles(this.statusIndicatorElement, {
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: '#fff' // Default text color (will be overridden by status)
    });
    // Initial status update
    this.updateStatusIndicator(this.connectionStatus);
    loginContainer.appendChild(this.statusIndicatorElement);
    // --- End Status Indicator ---


    // Create logo/title
    const title = document.createElement('h2');
    title.textContent = 'Mountain Care Pharmacy';
    this.applyStyles(title, {
      color: HEADER_COLORS.primary,
      fontSize: '24px',
      margin: '0 0 8px', // Adjusted margin for status indicator space
      paddingTop: '20px', // Add padding to avoid overlap with status
      fontWeight: 'bold'
    });

    // Create subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Please log in to continue';
    this.applyStyles(subtitle, {
      color: '#666',
      margin: '0 0 20px',
      fontSize: '14px'
    });

    // Create form element
    this.formElement = document.createElement('form');
    this.formElement.className = 'login-form';
    this.applyStyles(this.formElement, {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    });

    // Add submit event listener
    this.formElement.addEventListener('submit', this.handleSubmit);

    // Username field
    const usernameGroup = this.createFormGroup('Username', 'username', 'text');
    this.usernameInput = usernameGroup.querySelector('input');

    // Password field
    const passwordGroup = this.createFormGroup('Password', 'password', 'password');
    this.passwordInput = passwordGroup.querySelector('input');

    // Remember me checkbox
    const rememberGroup = document.createElement('div');
    this.applyStyles(rememberGroup, {
      display: 'flex',
      alignItems: 'center',
      marginTop: '-8px'
    });

    const rememberCheckbox = document.createElement('input');
    rememberCheckbox.type = 'checkbox';
    rememberCheckbox.id = 'remember-me';
    rememberCheckbox.name = 'remember';

    const rememberLabel = document.createElement('label');
    rememberLabel.htmlFor = 'remember-me';
    rememberLabel.textContent = 'Remember me';
    this.applyStyles(rememberLabel, {
      fontSize: '14px',
      color: '#666',
      marginLeft: '8px',
      cursor: 'pointer'
    });

    rememberGroup.appendChild(rememberCheckbox);
    rememberGroup.appendChild(rememberLabel);

    // Submit button
    this.submitButton = document.createElement('button');
    this.submitButton.type = 'submit';
    this.submitButton.textContent = 'Login';
    this.applyStyles(this.submitButton, {
      backgroundColor: HEADER_COLORS.primary,
      color: HEADER_COLORS.text,
      border: 'none',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      fontWeight: 'bold',
      width: '100%'
    });

    // Add hover effect for submit button
    this.submitButton.addEventListener('mouseover', () => {
      this.submitButton.style.backgroundColor = HEADER_COLORS.secondary;
    });
    this.submitButton.addEventListener('mouseout', () => {
      this.submitButton.style.backgroundColor = HEADER_COLORS.primary;
    });

    // Compliance text
    const complianceText = document.createElement('p');
    complianceText.textContent = 'This system complies with HIPAA security requirements';
    this.applyStyles(complianceText, {
      fontSize: '12px',
      color: '#666',
      margin: '16px 0 0'
    });

    // Encryption notice
    const encryptionText = document.createElement('p');
    encryptionText.textContent = 'All communication is encrypted';
    this.applyStyles(encryptionText, {
      fontSize: '12px',
      color: '#666',
      margin: '8px 0 0'
    });

    // Add all elements to form
    this.formElement.appendChild(usernameGroup);
    this.formElement.appendChild(passwordGroup);
    this.formElement.appendChild(rememberGroup);
    this.formElement.appendChild(this.submitButton);

    // Add form to container
    loginContainer.appendChild(title);
    loginContainer.appendChild(subtitle);
    loginContainer.appendChild(this.formElement);
    loginContainer.appendChild(complianceText);
    loginContainer.appendChild(encryptionText);

    // Add login container to main container
    this.container.innerHTML = '';
    this.container.appendChild(loginContainer);
  }

  /**
   * Update the status indicator UI based on connection status.
   * @param {string} status - The connection status string.
   */
  updateStatusIndicator(status) {
      this.connectionStatus = status; // Update internal state
      if (!this.statusIndicatorElement) return;

      let statusText = 'Unknown';
      let statusColor = '#888'; // Default gray

      switch (status) {
          case CONNECTION_STATUS.CONNECTED:
              statusText = 'Connected';
              statusColor = STATUS_COLORS.connected;
              break;
          case CONNECTION_STATUS.CONNECTING:
              statusText = 'Connecting...';
              statusColor = STATUS_COLORS.connecting;
              break;
          case CONNECTION_STATUS.DISCONNECTED:
              statusText = 'Disconnected';
              statusColor = STATUS_COLORS.disconnected;
              break;
          case CONNECTION_STATUS.ERROR:
              statusText = 'Connection Error';
              statusColor = STATUS_COLORS.error;
              break;
          case CONNECTION_STATUS.AUTH_FAILED:
              statusText = 'Auth Failed';
              statusColor = STATUS_COLORS.auth_failed;
              break;
      }

      // Update text and background color
      this.statusIndicatorElement.textContent = statusText;
      this.statusIndicatorElement.style.backgroundColor = statusColor;
  }


  /**
   * Create a form group with label and input
   * @param {string} labelText - Label text
   * @param {string} name - Input name
   * @param {string} type - Input type
   * @returns {HTMLElement} Form group element
   */
  createFormGroup(labelText, name, type) {
    const group = document.createElement('div');
    this.applyStyles(group, {
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left'
    });

    const label = document.createElement('label');
    label.htmlFor = name;
    label.textContent = labelText;
    this.applyStyles(label, {
      fontSize: '14px',
      color: '#666',
      marginBottom: '4px'
    });

    const inputWrapper = document.createElement('div');
    this.applyStyles(inputWrapper, {
      position: 'relative'
    });

    const input = document.createElement('input');
    input.type = type;
    input.id = name;
    input.name = name;
    input.required = true;
    this.applyStyles(input, {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      width: '100%',
      boxSizing: 'border-box',
      fontSize: '14px'
    });

    // Add visibility toggle for password fields
    if (type === 'password') {
      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.textContent = '👁️';
      this.applyStyles(toggleButton, {
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        color: '#aaa' // Adjusted color
      });

      toggleButton.addEventListener('click', () => {
        input.type = input.type === 'password' ? 'text' : 'password';
      });

      inputWrapper.appendChild(toggleButton);
    }

    inputWrapper.appendChild(input);
    group.appendChild(label);
    group.appendChild(inputWrapper);

    return group;
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleSubmit(event) {
    event.preventDefault();

    try {
      const username = this.usernameInput.value;
      const password = this.passwordInput.value;
      const remember = event.target.remember?.checked || false;

      // Disable form fields and button during login
      this.submitButton.disabled = true;
      this.submitButton.textContent = 'Logging in...';
      this.usernameInput.disabled = true;
      this.passwordInput.disabled = true;

      // Attempt login
      const loginResult = await login(username, password);

      if (loginResult.success) {
        // Log successful login attempt
        logChatEvent('auth', 'Login successful', { username });

        // Call login success callback
        this.onLoginSuccess(loginResult.user);
      } else {
        // Show error message
        alert(loginResult.error || 'Login failed. Please try again.');

        // Re-enable form
        this.submitButton.disabled = false;
        this.submitButton.textContent = 'Login';
        this.usernameInput.disabled = false;
        this.passwordInput.disabled = false;
      }
    } catch (error) {
      console.error('[CRM Extension] Login error:', error);

      // Show generic error message
      alert('An unexpected error occurred. Please try again.');

      // Re-enable form
      this.submitButton.disabled = false;
      this.submitButton.textContent = 'Login';
      this.usernameInput.disabled = false;
      this.passwordInput.disabled = false;
    }
  }

  /**
   * Apply CSS styles to an element
   * @param {HTMLElement} element - Element to style
   * @param {Object} styles - Styles to apply
   */
  applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.formElement) {
      this.formElement.removeEventListener('submit', this.handleSubmit);
    }

    // Unsubscribe from status listener
    if (this.unsubscribeStatusListener) {
        this.unsubscribeStatusListener();
        this.unsubscribeStatusListener = null;
    }

    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default LoginForm;