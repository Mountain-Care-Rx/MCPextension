// chat/components/admin/users/ResetPasswordModal.js
// Modal for resetting user passwords

import { resetUserPassword } from '../../../services/auth';
import { logChatEvent } from '../../../utils/logger.js';
import { validatePassword } from '../../../utils/validation.js';
import ModalBase from '../../common/ModalBase.js';

/**
 * Reset Password Modal Component
 * Modal for resetting user passwords
 */
class ResetPasswordModal extends ModalBase {
  /**
   * Create a new ResetPasswordModal
   * @param {Object} options - Modal options
   * @param {Object} options.user - User to reset password for
   * @param {Function} options.onSuccess - Success callback
   */
  constructor(options = {}) {
    super({
      title: 'Reset User Password',
      width: '450px',
      ...options
    });
    
    this.options = {
      user: null,
      onSuccess: () => {},
      ...options
    };
    
    // Bind methods
    this.handleResetPassword = this.handleResetPassword.bind(this);
    this.showFormError = this.showFormError.bind(this);
  }
  
  /**
   * Render the modal content
   * @returns {HTMLElement} Modal content
   */
  renderContent() {
    const content = document.createElement('div');
    const user = this.options.user;
    
    if (!user) {
      content.textContent = 'Error: No user provided';
      return content;
    }
    
    // Update header style
    if (this.modalElement) {
      const header = this.modalElement.querySelector('.modal-container > div:first-child');
      if (header) {
        header.style.backgroundColor = '#e2f3ff';
        header.style.color = '#0c5460';
        
        const closeButton = header.querySelector('button');
        if (closeButton) {
          closeButton.style.color = '#0c5460';
        }
      }
    }
    
    const userInfo = document.createElement('div');
    this.applyStyles(userInfo, {
      marginBottom: '20px'
    });
    
    const userIcon = document.createElement('div');
    userIcon.textContent = '👤';
    this.applyStyles(userIcon, {
      fontSize: '24px',
      marginBottom: '10px',
      textAlign: 'center'
    });
    
    const userName = document.createElement('div');
    userName.textContent = `User: ${user.username}`;
    this.applyStyles(userName, {
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '5px'
    });
    
    const userRole = document.createElement('div');
    userRole.textContent = `Role: ${user.role || 'User'}`;
    this.applyStyles(userRole, {
      color: '#6c757d',
      textAlign: 'center'
    });
    
    userInfo.appendChild(userIcon);
    userInfo.appendChild(userName);
    userInfo.appendChild(userRole);
    
    // Form
    const form = document.createElement('form');
    form.id = 'reset-password-form';
    
    // New password
    const newPasswordGroup = this.createFormGroup('newPassword', 'New Password', 'password', '', 'Enter new password');
    form.appendChild(newPasswordGroup);
    
    // Password hint
    const passwordHint = document.createElement('div');
    passwordHint.textContent = 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
    this.applyStyles(passwordHint, {
      fontSize: '12px',
      color: '#6c757d',
      marginTop: '-10px',
      marginBottom: '15px'
    });
    form.appendChild(passwordHint);
    
    // Confirm password
    const confirmPasswordGroup = this.createFormGroup('confirmPassword', 'Confirm Password', 'password', '', 'Confirm new password');
    form.appendChild(confirmPasswordGroup);
    
    // Error message area
    const errorMessage = document.createElement('div');
    errorMessage.id = 'reset-password-error';
    this.applyStyles(errorMessage, {
      color: '#dc3545',
      marginTop: '15px',
      display: 'none'
    });
    form.appendChild(errorMessage);
    
    // Action buttons
    const actionButtons = document.createElement('div');
    this.applyStyles(actionButtons, {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '30px'
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    this.applyStyles(cancelButton, {
      padding: '8px 16px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    cancelButton.addEventListener('click', () => {
      this.close();
    });
    
    const resetButton = document.createElement('button');
    resetButton.type = 'submit';
    resetButton.textContent = 'Reset Password';
    resetButton.id = 'confirm-reset-password';
    this.applyStyles(resetButton, {
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    actionButtons.appendChild(cancelButton);
    actionButtons.appendChild(resetButton);
    
    form.appendChild(actionButtons);
    
    // Form submission handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleResetPassword(form, errorMessage, resetButton);
    });
    
    content.appendChild(userInfo);
    content.appendChild(form);
    
    // Set focus to new password field on next tick
    setTimeout(() => {
      form.elements.newPassword.focus();
    }, 0);
    
    return content;
  }
  
  /**
   * Create a form input group
   * @param {string} id - Input ID
   * @param {string} label - Input label
   * @param {string} type - Input type
   * @param {string} value - Input value
   * @param {string} placeholder - Input placeholder
   * @returns {HTMLElement} Form group element
   */
  createFormGroup(id, label, type, value, placeholder) {
    const group = document.createElement('div');
    this.applyStyles(group, {
      marginBottom: '15px'
    });
    
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.htmlFor = id;
    this.applyStyles(labelElement, {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold'
    });
    
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.value = value;
    input.placeholder = placeholder;
    this.applyStyles(input, {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      boxSizing: 'border-box'
    });
    
    group.appendChild(labelElement);
    group.appendChild(input);
    
    return group;
  }
  
  /**
   * Handle password reset form submission
   * @param {HTMLFormElement} form - Form element
   * @param {HTMLElement} errorElement - Error message element
   * @param {HTMLElement} submitButton - Submit button element
   */
  async handleResetPassword(form, errorElement, submitButton) {
    const user = this.options.user;
    
    // Get form data
    const newPassword = form.elements.newPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;
    
    // Validate passwords
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.success) {
      this.showFormError(errorElement, passwordValidation.error);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      this.showFormError(errorElement, 'Passwords do not match');
      return;
    }
    
    // Disable form submission
    submitButton.disabled = true;
    submitButton.textContent = 'Resetting...';
    
    try {
      // Call API to reset password
      const result = await resetUserPassword(user.id, newPassword);
      
      if (result && result.success) {
        // Close modal
        this.close();
        
        // Call success callback
        if (this.options.onSuccess && typeof this.options.onSuccess === 'function') {
          this.options.onSuccess(user.id);
        }
        
        // Log password reset
        logChatEvent('admin', 'Reset user password', { 
          username: user.username,
          userId: user.id
        });
      } else {
        const errorMsg = (result && result.error) ? result.error : 'Failed to reset password';
        this.showFormError(errorElement, errorMsg);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Reset Password';
      }
    } catch (error) {
      console.error('[CRM Extension] Error resetting password:', error);
      this.showFormError(errorElement, 'An error occurred while resetting the password');
      
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Reset Password';
    }
  }
  
  /**
   * Show error message in form
   * @param {HTMLElement} errorElement - Error message element
   * @param {string} message - Error message
   */
  showFormError(errorElement, message) {
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Automatically hide after 5 seconds
    setTimeout(() => {
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    }, 5000);
  }
}

export default ResetPasswordModal;