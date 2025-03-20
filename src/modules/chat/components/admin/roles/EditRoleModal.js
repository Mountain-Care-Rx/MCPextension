// chat/components/admin/roles/EditRoleModal.js
// Modal for editing existing roles

import { updateRole } from '../../../services/auth';
import { logChatEvent } from '../../../utils/logger.js';
import ModalBase from '../../common/ModalBase.js';
import PermissionSelector from './PermissionSelector.js';

/**
 * Edit Role Modal Component
 * Modal for editing existing roles
 */
class EditRoleModal extends ModalBase {
  /**
   * Create a new EditRoleModal
   * @param {Object} options - Modal options
   * @param {Object} options.role - Role to edit
   * @param {Function} options.onSuccess - Success callback
   */
  constructor(options = {}) {
    super({
      title: `Edit Role: ${options.role?.name || 'Role'}`,
      width: '600px',
      ...options
    });
    
    this.options = {
      role: null,
      onSuccess: () => {},
      ...options
    };
    
    this.permissionSelector = null;
    
    // Bind methods
    this.handleEditRole = this.handleEditRole.bind(this);
    this.showFormError = this.showFormError.bind(this);
  }
  
  /**
   * Render the modal content
   * @returns {HTMLElement} Modal content
   */
  renderContent() {
    const content = document.createElement('div');
    const role = this.options.role;
    
    if (!role) {
      content.textContent = 'Error: No role provided';
      return content;
    }
    
    // Create form
    const form = document.createElement('form');
    form.id = 'edit-role-form';
    
    // Role name field
    const nameGroup = this.createFormGroup('name', 'Role Name', 'text', role.name, 'Enter role name');
    
    // Make name readonly for default roles
    if (role.isDefault) {
      const nameInput = nameGroup.querySelector('input');
      nameInput.readOnly = true;
      nameInput.style.backgroundColor = '#f8f9fa';
    }
    
    form.appendChild(nameGroup);
    
    // Role description field
    const descriptionGroup = this.createFormGroup(
      'description', 
      'Description (optional)', 
      'text', 
      role.description || '', 
      'Enter role description'
    );
    form.appendChild(descriptionGroup);
    
    // Permissions section
    const permissionsSection = document.createElement('div');
    this.applyStyles(permissionsSection, {
      marginBottom: '20px'
    });
    
    const permissionsHeader = document.createElement('div');
    this.applyStyles(permissionsHeader, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px'
    });
    
    const permissionsLabel = document.createElement('label');
    permissionsLabel.textContent = 'Permissions';
    this.applyStyles(permissionsLabel, {
      display: 'block',
      fontWeight: 'bold'
    });
    
    permissionsHeader.appendChild(permissionsLabel);
    
    // Quick selection buttons
    const quickButtons = document.createElement('div');
    this.applyStyles(quickButtons, {
      display: 'flex',
      gap: '10px'
    });
    
    const selectAllButton = document.createElement('button');
    selectAllButton.type = 'button';
    selectAllButton.textContent = 'Select All';
    selectAllButton.id = 'select-all-permissions';
    this.applyStyles(selectAllButton, {
      padding: '4px 8px',
      fontSize: '12px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    selectAllButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.permissionSelector) {
        this.permissionSelector.selectAll();
      }
    });
    
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.textContent = 'Clear All';
    clearButton.id = 'clear-all-permissions';
    this.applyStyles(clearButton, {
      padding: '4px 8px',
      fontSize: '12px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    clearButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.permissionSelector) {
        this.permissionSelector.deselectAll();
      }
    });
    
    quickButtons.appendChild(selectAllButton);
    quickButtons.appendChild(clearButton);
    
    permissionsHeader.appendChild(quickButtons);
    permissionsSection.appendChild(permissionsHeader);
    
    // Add permission selector
    this.permissionSelector = new PermissionSelector({
      selectedPermissions: role.permissions || []
    });
    permissionsSection.appendChild(this.permissionSelector.render());
    
    form.appendChild(permissionsSection);
    
    // Error message area
    const errorMessage = document.createElement('div');
    errorMessage.id = 'edit-role-error';
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
    saveButton.id = 'submit-edit-role';
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
      await this.handleEditRole(form, errorMessage, saveButton);
    });
    
    content.appendChild(form);
    
    // Set focus to name field on next tick
    setTimeout(() => {
      // Focus on description if name is readonly (for default roles)
      const nameInput = form.elements.name;
      if (nameInput.readOnly) {
        form.elements.description.focus();
      } else {
        nameInput.focus();
      }
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
   * Handle edit role form submission
   * @param {HTMLFormElement} form - Form element
   * @param {HTMLElement} errorElement - Error message element
   * @param {HTMLElement} submitButton - Submit button element
   */
  async handleEditRole(form, errorElement, submitButton) {
    const role = this.options.role;
    
    // Get form data
    const formData = new FormData(form);
    const roleData = {
      id: role.id,
      name: formData.get('name'),
      description: formData.get('description'),
      permissions: this.permissionSelector.getSelectedPermissions()
    };
    
    // Validate form data
    if (!roleData.name) {
      this.showFormError(errorElement, 'Role name is required');
      return;
    }
    
    if (roleData.name.length < 2) {
      this.showFormError(errorElement, 'Role name must be at least 2 characters');
      return;
    }
    
    if (roleData.permissions.length === 0) {
      this.showFormError(errorElement, 'At least one permission must be selected');
      return;
    }
    
    // Disable form submission
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
    
    try {
      // Call API to update role
      const result = await updateRole(role.id, roleData);
      
      if (result && result.success) {
        // Close modal
        this.close();
        
        // Call success callback
        if (this.options.onSuccess && typeof this.options.onSuccess === 'function') {
          this.options.onSuccess(result.role);
        }
        
        // Log role update
        logChatEvent('admin', 'Updated role', { 
          roleName: roleData.name,
          roleId: role.id
        });
      } else {
        const errorMsg = (result && result.error) ? result.error : 'Failed to update role';
        this.showFormError(errorElement, errorMsg);
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
      }
    } catch (error) {
      console.error('[CRM Extension] Error updating role:', error);
      this.showFormError(errorElement, 'An error occurred while updating the role');
      
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
      if (errorElement && errorElement.parentNode) {
        errorElement.style.display = 'none';
      }
    }, 5000);
  }
  
  /**
   * Clean up resources when closing the modal
   */
  close() {
    // Clean up permission selector
    if (this.permissionSelector) {
      this.permissionSelector.destroy();
      this.permissionSelector = null;
    }
    
    // Call parent close method
    super.close();
  }
}

export default EditRoleModal;