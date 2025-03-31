// MCPClient/components/common/ChangePasswordModal.js
import ModalBase from './ModalBase.js';
import { logChatEvent } from '../../utils/logger.js';

/**
 * Modal for changing the user's password.
 */
class ChangePasswordModal extends ModalBase {
  /**
   * Creates an instance of ChangePasswordModal.
   * @param {Function} onSubmit - Callback function when the form is submitted. Takes ({ currentPassword, newPassword }) as argument. Should return Promise<{success: boolean, error?: string}>
   * @param {Function} onCancel - Callback function when the modal is cancelled/closed.
   */
  constructor(onSubmit, onCancel) {
    super('Change Password', onCancel); // Title and cancel handler for ModalBase

    if (typeof onSubmit !== 'function') {
      throw new Error('ChangePasswordModal requires an onSubmit callback function.');
    }
    this.onSubmitCallback = onSubmit;

    this.currentPasswordInput = null;
    this.newPasswordInput = null;
    this.confirmPasswordInput = null;
    this.submitButton = null;
    this.errorMessageElement = null;

    this.renderContent();
    this.setupEventListeners();
  }

  /**
   * Renders the modal's specific content.
   */
  renderContent() {
    const form = document.createElement('form');
    form.addEventListener('submit', (e) => e.preventDefault()); // Prevent default form submission

    // Current Password
    const currentGroup = this.createFormGroup('Current Password', 'current-password', 'password');
    this.currentPasswordInput = currentGroup.querySelector('input');
    form.appendChild(currentGroup);

    // New Password
    const newGroup = this.createFormGroup('New Password', 'new-password', 'password');
    this.newPasswordInput = newGroup.querySelector('input');
    form.appendChild(newGroup);

    // Confirm New Password
    const confirmGroup = this.createFormGroup('Confirm New Password', 'confirm-password', 'password');
    this.confirmPasswordInput = confirmGroup.querySelector('input');
    form.appendChild(confirmGroup);

    // Error Message Area
    this.errorMessageElement = document.createElement('p');
    this.applyStyles(this.errorMessageElement, {
      color: 'var(--error-color, #dc3545)', // Use CSS variable with fallback
      fontSize: '14px',
      marginTop: '10px',
      minHeight: '20px', // Reserve space
      textAlign: 'center'
    });
    form.appendChild(this.errorMessageElement);

    // Add form to modal body
    this.modalBody.appendChild(form);

    // Add submit button to footer
    this.submitButton = this.addFooterButton('Submit', 'primary', this.handleSubmit.bind(this));
    this.addFooterButton('Cancel', 'secondary', this.handleCancel.bind(this));
  }

  /**
   * Helper to create a form group (label + input).
   * @param {string} labelText
   * @param {string} inputId
   * @param {string} inputType
   * @returns {HTMLElement} The form group element.
   */
  createFormGroup(labelText, inputId, inputType = 'text') {
    const group = document.createElement('div');
    this.applyStyles(group, { marginBottom: '15px' });

    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.textContent = labelText;
    this.applyStyles(label, {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: 'var(--text-primary)' // Use CSS variable
    });

    const input = document.createElement('input');
    input.type = inputType;
    input.id = inputId;
    input.required = true;
    this.applyStyles(input, {
      width: '100%',
      padding: '8px',
      border: '1px solid var(--border-color)', // Use CSS variable
      borderRadius: '4px',
      boxSizing: 'border-box',
      backgroundColor: 'var(--background-primary)', // Use CSS variable
      color: 'var(--text-primary)' // Use CSS variable
    });
    // Add focus styles via CSS ideally, but can add basic JS fallback if needed

    group.appendChild(label);
    group.appendChild(input);
    return group;
  }

  /**
   * Sets up event listeners for inputs.
   */
  setupEventListeners() {
    // Clear error on input
    const inputs = [this.currentPasswordInput, this.newPasswordInput, this.confirmPasswordInput];
    inputs.forEach(input => {
      input.addEventListener('input', () => this.setErrorMessage(''));
    });
  }

  /**
   * Handles the form submission.
   */
  async handleSubmit() {
    const currentPassword = this.currentPasswordInput.value;
    const newPassword = this.newPasswordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;

    // Basic Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.setErrorMessage('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.setErrorMessage('New passwords do not match.');
      this.newPasswordInput.focus();
      return;
    }
    if (newPassword.length < 8) { // Example: Basic length check
        this.setErrorMessage('New password must be at least 8 characters long.');
        this.newPasswordInput.focus();
        return;
    }

    this.setLoading(true);
    this.setErrorMessage(''); // Clear previous errors

    try {
      // Call the onSubmit callback provided during instantiation
      const result = await this.onSubmitCallback({ currentPassword, newPassword });

      if (result && result.success) {
        logChatEvent('auth', 'Password changed successfully via modal');
        this.close(); // Close modal on success
        // Optionally show a success notification via AppContainer's system
      } else {
        // Use error message from result if available, otherwise generic
        const errorMessage = result?.error || 'Failed to change password. Please try again.';
        this.setErrorMessage(errorMessage);
        logChatEvent('error', 'Password change failed via modal', { error: errorMessage });
      }
    } catch (error) {
      console.error('[ChangePasswordModal] Submit error:', error);
      this.setErrorMessage('An unexpected error occurred.');
      logChatEvent('error', 'Password change unexpected error via modal', { error: error.message });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handles the cancel action.
   */
  handleCancel() {
    this.close(); // ModalBase handles the onCancel callback
  }

  /**
   * Sets the loading state (disables/enables submit button).
   * @param {boolean} isLoading
   */
  setLoading(isLoading) {
    if (this.submitButton) {
      this.submitButton.disabled = isLoading;
      this.submitButton.textContent = isLoading ? 'Submitting...' : 'Submit';
    }
    // Optionally disable inputs too
     this.currentPasswordInput.disabled = isLoading;
     this.newPasswordInput.disabled = isLoading;
     this.confirmPasswordInput.disabled = isLoading;
  }

  /**
   * Displays an error message in the modal.
   * @param {string} message
   */
  setErrorMessage(message) {
    if (this.errorMessageElement) {
      this.errorMessageElement.textContent = message;
    }
  }

  // Inherited methods from ModalBase: show(), close(), addFooterButton()
  // Inherited property: modalElement, modalBody, modalFooter

  // Helper to apply styles (assuming ModalBase doesn't provide one publicly)
  applyStyles(element, styles) {
     Object.assign(element.style, styles);
  }
}

export default ChangePasswordModal;