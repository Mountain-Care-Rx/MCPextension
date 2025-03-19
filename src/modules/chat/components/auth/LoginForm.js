// chat/components/auth/LoginForm.js
// Login form component for HIPAA-compliant chat

import authContext from './AuthContext.js';
import { logChatEvent } from '../../utils/logger.js';

class LoginForm {
  constructor(container, onLoginSuccess = null) {
    this.container = container;
    this.onLoginSuccess = onLoginSuccess;
    this.formElement = null;
    this.isLoading = false;
    
    // Bind methods
    this.handleSubmit = this.handleSubmit.bind(this);
    this.showRegistration = this.showRegistration.bind(this);
    this.showLogin = this.showLogin.bind(this);
    this.showError = this.showError.bind(this);
    this.clearError = this.clearError.bind(this);
    
    // Render the form
    this.render();
  }
  
  /**
   * Render the login form
   */
  render() {
    if (!this.container) return;
    
    // Create form element
    this.formElement = document.createElement('div');
    this.formElement.className = 'hipaa-login-form';
    this.formElement.style.width = '100%';
    this.formElement.style.maxWidth = '400px';
    this.formElement.style.margin = '0 auto';
    this.formElement.style.padding = '20px';
    this.formElement.style.backgroundColor = '#ffffff';
    this.formElement.style.borderRadius = '4px';
    this.formElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    
    // Set initial content to login form
    this.renderLoginForm();
    
    // Add to container
    this.container.appendChild(this.formElement);
  }
  
  /**
   * Render the login form
   */
  renderLoginForm() {
    if (!this.formElement) return;
    
    this.formElement.innerHTML = `
      <div class="login-header" style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #2196F3;">HIPAA Secure Chat</h2>
        <p style="margin: 10px 0 0; color: #666;">Please log in to continue</p>
      </div>
      
      <div class="login-error" style="display: none; background-color: #ffebee; color: #d32f2f; padding: 10px; border-radius: 4px; margin-bottom: 15px;"></div>
      
      <form id="login-form">
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="username" style="display: block; margin-bottom: 5px; font-weight: bold;">Username</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
            required
          />
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="password" style="display: block; margin-bottom: 5px; font-weight: bold;">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
            required
          />
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
          <div style="display: flex; align-items: center;">
            <input type="checkbox" id="remember" name="remember" style="margin-right: 8px;" />
            <label for="remember">Remember me</label>
          </div>
        </div>
        
        <div class="form-actions" style="display: flex; justify-content: space-between; align-items: center;">
          <button 
            type="submit" 
            class="login-button" 
            style="padding: 8px 16px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Login
          </button>
          
          <a 
            href="#" 
            class="register-link" 
            style="color: #2196F3; text-decoration: none;"
          >
            Create account
          </a>
        </div>
      </form>
      
      <div class="login-footer" style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>This system complies with HIPAA security requirements</p>
        <p>All communication is encrypted and secure</p>
      </div>
    `;
    
    // Add event listeners
    const form = this.formElement.querySelector('#login-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit);
    }
    
    const registerLink = this.formElement.querySelector('.register-link');
    if (registerLink) {
      registerLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showRegistration();
      });
    }
  }
  
  /**
   * Render the registration form
   */
  renderRegistrationForm() {
    if (!this.formElement) return;
    
    this.formElement.innerHTML = `
      <div class="login-header" style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #2196F3;">Create Account</h2>
        <p style="margin: 10px 0 0; color: #666;">Register for HIPAA Secure Chat</p>
      </div>
      
      <div class="login-error" style="display: none; background-color: #ffebee; color: #d32f2f; padding: 10px; border-radius: 4px; margin-bottom: 15px;"></div>
      
      <form id="register-form">
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="reg-username" style="display: block; margin-bottom: 5px; font-weight: bold;">Username</label>
          <input 
            type="text" 
            id="reg-username" 
            name="username" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
            required
          />
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="display-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Display Name</label>
          <input 
            type="text" 
            id="display-name" 
            name="displayName" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
            required
          />
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="reg-password" style="display: block; margin-bottom: 5px; font-weight: bold;">Password</label>
          <input 
            type="password" 
            id="reg-password" 
            name="password" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
            required
            minlength="8"
          />
          <small style="display: block; margin-top: 5px; color: #666;">Must be at least 8 characters</small>
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
          <label for="confirm-password" style="display: block; margin-bottom: 5px; font-weight: bold;">Confirm Password</label>
          <input 
            type="password" 
            id="confirm-password" 
            name="confirmPassword" 
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
            required
          />
        </div>
        
        <div class="form-actions" style="display: flex; justify-content: space-between; align-items: center;">
          <button 
            type="submit" 
            class="register-button" 
            style="padding: 8px 16px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Create Account
          </button>
          
          <a 
            href="#" 
            class="login-link" 
            style="color: #2196F3; text-decoration: none;"
          >
            Back to login
          </a>
        </div>
      </form>
      
      <div class="login-footer" style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>This system complies with HIPAA security requirements</p>
        <p>All communication is encrypted and secure</p>
      </div>
    `;
    
    // Add event listeners
    const form = this.formElement.querySelector('#register-form');
    if (form) {
      form.addEventListener('submit', this.handleRegistration.bind(this));
    }
    
    const loginLink = this.formElement.querySelector('.login-link');
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLogin();
      });
    }
  }
  
  /**
   * Set loading state of the form
   * @param {boolean} isLoading - Whether the form is loading
   */
  setLoading(isLoading) {
    this.isLoading = isLoading;
    
    // Find submit buttons
    const loginButton = this.formElement.querySelector('.login-button');
    const registerButton = this.formElement.querySelector('.register-button');
    
    if (isLoading) {
      // Disable buttons
      if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Loading...';
      }
      
      if (registerButton) {
        registerButton.disabled = true;
        registerButton.textContent = 'Loading...';
      }
    } else {
      // Enable buttons
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
      }
      
      if (registerButton) {
        registerButton.disabled = false;
        registerButton.textContent = 'Create Account';
      }
    }
  }
  
  /**
   * Show an error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorElement = this.formElement.querySelector('.login-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }
  
  /**
   * Clear any error messages
   */
  clearError() {
    const errorElement = this.formElement.querySelector('.login-error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }
  
  /**
   * Show the login form
   */
  showLogin() {
    this.clearError();
    this.renderLoginForm();
  }
  
  /**
   * Show the registration form
   */
  showRegistration() {
    this.clearError();
    this.renderRegistrationForm();
  }
  
  /**
   * Handle login form submission
   * @param {Event} e - Form submission event
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    // If already loading, do nothing
    if (this.isLoading) return;
    
    this.clearError();
    
    // Get form data
    const usernameInput = this.formElement.querySelector('#username');
    const passwordInput = this.formElement.querySelector('#password');
    const rememberInput = this.formElement.querySelector('#remember');
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberInput?.checked || false;
    
    // Validate
    if (!username || !password) {
      this.showError('Please enter both username and password');
      return;
    }
    
    // Show loading state
    this.setLoading(true);
    
    try {
      // Attempt login
      const result = await authContext.login(username, password);
      
      if (result.success) {
        // Save remember me preference
        if (remember) {
          localStorage.setItem('crmplus_chat_username', username);
        }
        
        // Log successful login
        logChatEvent('auth', 'Login successful via form');
        
        // Call success callback if provided
        if (this.onLoginSuccess && typeof this.onLoginSuccess === 'function') {
          this.onLoginSuccess(result.user);
        }
      } else {
        // Show error
        this.showError(result.error || 'Invalid username or password');
        
        // Log failed login
        logChatEvent('auth', 'Login failed via form', { error: result.error });
      }
    } catch (error) {
      console.error('[CRM Extension] Login error:', error);
      this.showError('An error occurred while logging in. Please try again.');
      
      // Log error
      logChatEvent('auth', 'Login error', { error: error.message });
    } finally {
      // Remove loading state
      this.setLoading(false);
    }
  }
  
  /**
   * Handle registration form submission
   * @param {Event} e - Form submission event
   */
  async handleRegistration(e) {
    e.preventDefault();
    
    // If already loading, do nothing
    if (this.isLoading) return;
    
    this.clearError();
    
    // Get form data
    const usernameInput = this.formElement.querySelector('#reg-username');
    const displayNameInput = this.formElement.querySelector('#display-name');
    const passwordInput = this.formElement.querySelector('#reg-password');
    const confirmPasswordInput = this.formElement.querySelector('#confirm-password');
    
    if (!usernameInput || !displayNameInput || !passwordInput || !confirmPasswordInput) return;
    
    const username = usernameInput.value.trim();
    const displayName = displayNameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate
    if (!username || !displayName || !password || !confirmPassword) {
      this.showError('Please fill out all fields');
      return;
    }
    
    if (password.length < 8) {
      this.showError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }
    
    // Show loading state
    this.setLoading(true);
    
    try {
      // Attempt registration
      const result = await authContext.register({
        username,
        displayName,
        password
      });
      
      if (result.success) {
        // Log successful registration
        logChatEvent('auth', 'Registration successful');
        
        // Show login form with success message
        this.showLogin();
        
        // Show success message
        const successElement = document.createElement('div');
        successElement.className = 'login-success';
        successElement.style.backgroundColor = '#e8f5e9';
        successElement.style.color = '#388e3c';
        successElement.style.padding = '10px';
        successElement.style.borderRadius = '4px';
        successElement.style.marginBottom = '15px';
        successElement.textContent = 'Account created successfully! You can now log in.';
        
        // Insert before form
        const form = this.formElement.querySelector('#login-form');
        if (form) {
          form.parentElement.insertBefore(successElement, form);
        }
        
        // Pre-fill username
        const usernameInput = this.formElement.querySelector('#username');
        if (usernameInput) {
          usernameInput.value = username;
        }
      } else {
        // Show error
        this.showError(result.error || 'Failed to create account');
        
        // Log failed registration
        logChatEvent('auth', 'Registration failed', { error: result.error });
      }
    } catch (error) {
      console.error('[CRM Extension] Registration error:', error);
      this.showError('An error occurred while creating your account. Please try again.');
      
      // Log error
      logChatEvent('auth', 'Registration error', { error: error.message });
    } finally {
      // Remove loading state
      this.setLoading(false);
    }
  }
  
  /**
   * Destroy the login form
   */
  destroy() {
    // Remove event listeners
    const form = this.formElement.querySelector('#login-form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit);
    }
    
    const registerForm = this.formElement.querySelector('#register-form');
    if (registerForm) {
      registerForm.removeEventListener('submit', this.handleRegistration);
    }
    
    // Remove from DOM
    if (this.formElement && this.formElement.parentElement) {
      this.formElement.parentElement.removeChild(this.formElement);
    }
  }
}

export default LoginForm;