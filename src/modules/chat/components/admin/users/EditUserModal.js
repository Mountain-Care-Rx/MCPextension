// chat/components/admin/users/EditUserModal.js
// Modal for editing existing users

import { updateUser, updateUserRole, getCurrentUser } from '../../../services/auth';
import { getAllDepartments } from '../../../services/userService.js'; // Import department service
import { logChatEvent } from '../../../utils/logger.js';
import { validateEmail } from '../../../utils/validation.js';
import ModalBase from '../../common/ModalBase.js';

/**
 * Edit User Modal Component
 * Modal for editing existing users
 */
class EditUserModal extends ModalBase {
  /**
   * Create a new EditUserModal
   * @param {Object} options - Modal options
   * @param {Object} options.user - User to edit
   * @param {Function} options.onSuccess - Success callback
   */
  constructor(options = {}) {
    super({
      title: `Edit User: ${options.user?.username || 'User'}`,
      width: '500px',
      ...options
    });
    
    this.options = {
      user: null,
      onSuccess: () => {},
      ...options
    };
    
    this.departments = []; // To store fetched departments
    this.departmentSelectElement = null; // Reference to the select element

    // Bind methods
    this.handleEditUser = this.handleEditUser.bind(this);
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
    const user = this.options.user;
    
    if (!user) {
      content.textContent = 'Error: No user provided';
      return content;
    }
    
    // Create form
    const form = document.createElement('form');
    form.id = 'edit-user-form';
    
    // Username (readonly)
    const usernameGroup = this.createFormGroup('username', 'Username', 'text', user.username, '');
    const usernameInput = usernameGroup.querySelector('input');
    usernameInput.readOnly = true;
    usernameInput.style.backgroundColor = '#f8f9fa';
    form.appendChild(usernameGroup);
    
    // Display name field
    const displayNameGroup = this.createFormGroup('displayName', 'Display Name', 'text', user.displayName || '', 'Enter display name');
    form.appendChild(displayNameGroup);
    
    // Email field
    const emailGroup = this.createFormGroup('email', 'Email Address', 'email', user.email || '', 'Enter email address');
    form.appendChild(emailGroup);
    
    // Role selection (if not editing self)
    const currentUser = getCurrentUser();
    if (currentUser && user.id !== currentUser.id) {
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
        optionElement.selected = user.role === option.value;
        roleSelect.appendChild(optionElement);
      });
      
      roleGroup.appendChild(roleLabel);
      roleGroup.appendChild(roleSelect);
      form.appendChild(roleGroup);
    } else {
      // Hidden field for the role
      const hiddenRole = document.createElement('input');
      hiddenRole.type = 'hidden';
      hiddenRole.name = 'role';
      hiddenRole.value = user.role || 'user';
      form.appendChild(hiddenRole);
    }

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

    // Add a default "Select Department" option
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
    errorMessage.id = 'edit-user-error';
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
    
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Save Changes';
    saveButton.id = 'submit-edit-user';
    this.applyStyles(saveButton, {
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    formActions.appendChild(cancelButton);
    formActions.appendChild(saveButton);
    form.appendChild(formActions);
    
    // Form submission handler
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleEditUser(form, errorMessage, saveButton);
    });
    
    content.appendChild(form);
    
    // Set focus to display name field on next tick
    setTimeout(() => {
      form.elements.displayName.focus();
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
    input.value = value || '';
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
   * Handle user edit form submission
   * @param {HTMLFormElement} form - Form element
   * @param {HTMLElement} errorElement - Error message element
   * @param {HTMLElement} submitButton - Submit button element
   */
  async handleEditUser(form, errorElement, submitButton) {
    const user = this.options.user;
    
    // Get form data
    const formData = new FormData(form);
    const userData = {
      displayName: formData.get('displayName'),
      email: formData.get('email'),
      role: formData.get('role') || user.role,
      departmentId: formData.get('departmentId') || null // Get departmentId, default to null if empty/not selected
    };
    
    // Validate email if provided
    if (userData.email) {
      const emailValidation = validateEmail(userData.email);
      if (!emailValidation.success) {
        this.showFormError(errorElement, emailValidation.error);
        return;
      }
    }
    
    // Disable form submission
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    
    try {
      // Different handling based on whether editing self or other user
      let result;
      let roleChangeResult = { success: true };
      const currentUser = getCurrentUser();
      
      // Update user's basic info (including department)
      result = await updateUser(user.id, {
        displayName: userData.displayName,
        email: userData.email,
        departmentId: userData.departmentId // Include departmentId in the update payload
      });

      // If role change was requested and not editing self, also update role
      if (userData.role && userData.role !== user.role && 
          (!currentUser || user.id !== currentUser.id)) {
        roleChangeResult = await updateUserRole(user.id, userData.role);
      }
      
      if (result.success && roleChangeResult.success) {
        // Close modal
        this.close();
        
        // Create updated user object for callback
        const updatedUser = {
          ...user,
          displayName: userData.displayName,
          email: userData.email,
          role: userData.role
        };
        
        // Call success callback
        if (this.options.onSuccess && typeof this.options.onSuccess === 'function') {
          this.options.onSuccess(updatedUser);
        }
        
        // Log user update
        logChatEvent('admin', 'Updated user', { 
          username: user.username,
          userId: user.id
        });
      } else {
        // Combine error messages if both operations failed
        let errorMsg = '';
        if (!result.success) {
          errorMsg += result.error || 'Failed to update user information';
        }
        if (!roleChangeResult.success) {
          errorMsg += (errorMsg ? ' ' : '') + (roleChangeResult.error || 'Failed to update user role');
        }
        
        this.showFormError(errorElement, errorMsg);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
      }
    } catch (error) {
      console.error('[CRM Extension] Error updating user:', error);
      this.showFormError(errorElement, 'An error occurred while updating the user');
      
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Save Changes';
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
  * Fetches departments and populates the select dropdown, selecting the current user's department.
  */
 async fetchAndPopulateDepartments() {
   if (!this.departmentSelectElement || !this.options.user) return;

   const currentUserDepartmentId = this.options.user.department_id || ''; // Get current user's dept ID

   // Indicate loading state
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
     let foundCurrent = false;
     this.departments.forEach(dept => {
       const option = document.createElement('option');
       option.value = dept.id;
       option.textContent = dept.name;
       if (dept.id === currentUserDepartmentId) {
           option.selected = true;
           foundCurrent = true;
       }
       this.departmentSelectElement.appendChild(option);
     });

     // Ensure the default option is selected if the user's current dept ID wasn't found or is null
     if (!foundCurrent) {
         this.departmentSelectElement.value = '';
     }

     logChatEvent('admin', 'Populated department dropdown for edit', { count: this.departments.length, selected: currentUserDepartmentId });
   } catch (error) {
     logChatEvent('error', 'Failed to fetch or populate departments for edit', { error: error.message });
     this.showFormError(document.getElementById('edit-user-error'), 'Could not load departments.');
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

export default EditUserModal;