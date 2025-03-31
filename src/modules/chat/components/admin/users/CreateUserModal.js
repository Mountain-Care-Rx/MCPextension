// chat/components/admin/users/CreateUserModal.js
// Modal for creating new users

import { createUser } from '../../../services/auth';
import { getAllDepartments } from '../../../services/userService.js'; // Import department service
import { logChatEvent } from '../../../utils/logger.js';
import { validateUsername, validatePassword, validateEmail } from '../../../utils/validation.js';
import ModalBase from '../../common/ModalBase.js';

/**
 * Create User Modal Component
 * Modal for creating new users
 */
class CreateUserModal extends ModalBase {
  /**
   * Create a new CreateUserModal
   * @param {Object} options - Modal options
   * @param {Function} options.onSuccess - Success callback
   */
  constructor(options = {}) {
    super({
      title: 'Create New User',
      width: '500px',
      ...options
    });
    
    this.options = {
      onSuccess: () => {},
      ...options
    };

    this.departments = []; // To store fetched departments
    this.departmentSelectElement = null; // Reference to the select element

    // Bind methods
    this.handleCreateUser = this.handleCreateUser.bind(this);
    this.showFormError = this.showFormError.bind(this);
    this.fetchAndPopulateDepartments = this.fetchAndPopulateDepartments.bind(this);

    // Fetch departments when modal is created
    this.fetchAndPopulateDepartments();
  }

  /**
   * Render the modal content
   * @returns {HTMLElement} Modal content
   */
  renderContent() {
    const content = document.createElement('div');
    
    // Create form
    const form = document.createElement('form');
    form.id = 'create-user-form';
    
    // Username field
    const usernameGroup = this.createFormGroup('username', 'Username', 'text', '', 'Enter username');
    form.appendChild(usernameGroup);
    
    // Display name field
    const displayNameGroup = this.createFormGroup('displayName', 'Display Name', 'text', '', 'Enter display name');
    form.appendChild(displayNameGroup);
    
    // Email field
    const emailGroup = this.createFormGroup('email', 'Email Address', 'email', '', 'Enter email address');
    form.appendChild(emailGroup);
    
    // Password field
    const passwordGroup = this.createFormGroup('password', 'Password', 'password', '', 'Enter password');
    form.appendChild(passwordGroup);
    
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
    
    // Confirm password field
    const confirmPasswordGroup = this.createFormGroup('confirmPassword', 'Confirm Password', 'password', '', 'Confirm password');
    form.appendChild(confirmPasswordGroup);
    
    // Role selection
    const roleGroup = document.createElement('div');
    this.applyStyles(roleGroup, {
      marginBottom: '15px'
    });
    
    const roleLabel = document.createElement('label');
    roleLabel.textContent = 'Role';
    roleLabel.htmlFor = 'user-role';
    this.applyStyles(roleLabel, {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold'
    });
    
    const roleSelect = document.createElement('select');
    roleSelect.id = 'user-role';
    roleSelect.name = 'role';
    this.applyStyles(roleSelect, {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      boxSizing: 'border-box'
    });
    
    const roleOptions = [
      { value: 'user', label: 'Regular User' },
      { value: 'moderator', label: 'Moderator' },
      { value: 'admin', label: 'Administrator' }
    ];
    
    roleOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      roleSelect.appendChild(optionElement);
    });
    
    roleGroup.appendChild(roleLabel);
    roleGroup.appendChild(roleSelect);
    form.appendChild(roleGroup);

    // Department selection
    const departmentGroup = document.createElement('div');
     this.applyStyles(departmentGroup, { marginBottom: '15px' });

    const departmentLabel = document.createElement('label');
    departmentLabel.textContent = 'Department';
    departmentLabel.htmlFor = 'user-department';
    this.applyStyles(departmentLabel, { display: 'block', marginBottom: '5px', fontWeight: 'bold' });

    this.departmentSelectElement = document.createElement('select');
    this.departmentSelectElement.id = 'user-department';
    this.departmentSelectElement.name = 'departmentId'; // Use departmentId for submission
    this.applyStyles(this.departmentSelectElement, {
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        boxSizing: 'border-box'
    });

    // Add a default "Select Department" option (optional)
    const defaultOption = document.createElement('option');
    defaultOption.value = ''; // No department selected
    defaultOption.textContent = '-- Select Department (Optional) --';
    this.departmentSelectElement.appendChild(defaultOption);

    // Departments will be populated asynchronously
    departmentGroup.appendChild(departmentLabel);
    departmentGroup.appendChild(this.departmentSelectElement);
    form.appendChild(departmentGroup);

    // Error message area
    const errorMessage = document.createElement('div');
    errorMessage.id = 'create-user-error';
    this.applyStyles(errorMessage, {
      color: '#dc3545',
      marginBottom: '15px',
      display: 'none'
    });
    form.appendChild(errorMessage);
    
    // Form actions
    const formActions = document.createElement('div');
    this.applyStyles(formActions, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px'
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
    
    const createButton = document.createElement('button');
    createButton.type = 'submit';
    createButton.textContent = 'Create User';
    createButton.id = 'submit-create-user';
    this.applyStyles(createButton, {
      padding: '8px 16px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    formActions.appendChild(cancelButton);
    formActions.appendChild(createButton);
    form.appendChild(formActions);
    
    // Form submission handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleCreateUser(form, errorMessage, createButton);
    });
    
    content.appendChild(form);
    
    // Set focus to username field on next tick
    setTimeout(() => {
      form.elements.username.focus();
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
   * Handle create user form submission
   * @param {HTMLFormElement} form - Form element
   * @param {HTMLElement} errorElement - Error message element
   * @param {HTMLElement} submitButton - Submit button element
   */
  async handleCreateUser(form, errorElement, submitButton) {
    // Get form data
    const formData = new FormData(form);
    const userData = {
      username: formData.get('username'),
      displayName: formData.get('displayName'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      role: formData.get('role'),
      departmentId: formData.get('departmentId') || null // Get departmentId, default to null if empty
    };
    
    // Validate form data
    const usernameValidation = validateUsername(userData.username);
    if (!usernameValidation.success) {
      this.showFormError(errorElement, usernameValidation.error);
      return;
    }
    
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.success) {
      this.showFormError(errorElement, passwordValidation.error);
      return;
    }
    
    if (userData.password !== userData.confirmPassword) {
      this.showFormError(errorElement, 'Passwords do not match');
      return;
    }
    
    if (userData.email) {
      const emailValidation = validateEmail(userData.email);
      if (!emailValidation.success) {
        this.showFormError(errorElement, emailValidation.error);
        return;
      }
    }
    
    // Disable form submission
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';
    
    try {
      // Call API to create user
      const result = await createUser(userData);
      
      if (result && result.success) {
        // Close modal
        this.close();
        
        // Call success callback
        if (this.options.onSuccess && typeof this.options.onSuccess === 'function') {
          this.options.onSuccess(result.user);
        }
        
        // Log user creation
        logChatEvent('admin', 'Created new user', { 
          username: userData.username,
          role: userData.role
        });
      } else {
        const errorMessage = result && result.error ? result.error : 'Failed to create user';
        this.showFormError(errorElement, errorMessage);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Create User';
      }
    } catch (error) {
      console.error('[CRM Extension] Error creating user:', error);
      this.showFormError(errorElement, 'An error occurred while creating the user');
      
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Create User';
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
      errorElement.style.display = 'none';
    }, 5000);
  }

 /**
  * Fetches departments and populates the select dropdown.
  */
 async fetchAndPopulateDepartments() {
   if (!this.departmentSelectElement) return;

   // Indicate loading state? (e.g., disable select)
   this.departmentSelectElement.disabled = true;
   const loadingOption = document.createElement('option');
   loadingOption.textContent = 'Loading departments...';
   this.departmentSelectElement.appendChild(loadingOption);


   try {
     this.departments = await getAllDepartments();
     // Clear existing options except the default
     while (this.departmentSelectElement.options.length > 1) {
         this.departmentSelectElement.remove(1);
     }

     // Populate with fetched departments
     this.departments.forEach(dept => {
       const option = document.createElement('option');
       option.value = dept.id; // Use department ID as value
       option.textContent = dept.name;
       this.departmentSelectElement.appendChild(option);
     });
     logChatEvent('admin', 'Populated department dropdown', { count: this.departments.length });
   } catch (error) {
     logChatEvent('error', 'Failed to fetch or populate departments', { error: error.message });
     // Optionally display an error to the user in the modal
     this.showFormError(document.getElementById('create-user-error'), 'Could not load departments.');
     // Remove loading/error option if fetch fails
      while (this.departmentSelectElement.options.length > 1) {
         this.departmentSelectElement.remove(1);
     }
      const errorOption = document.createElement('option');
      errorOption.textContent = 'Error loading';
      errorOption.disabled = true;
      this.departmentSelectElement.appendChild(errorOption);

   } finally {
       // Re-enable select after loading (or error)
       this.departmentSelectElement.disabled = false;
       // Remove loading option if it exists
       if (loadingOption.parentNode === this.departmentSelectElement) {
           this.departmentSelectElement.removeChild(loadingOption);
       }
   }
 }
}

export default CreateUserModal;