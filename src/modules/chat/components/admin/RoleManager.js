// chat/components/admin/RoleManager.js
// Role management component for HIPAA-compliant chat

import { 
  getAllRoles, 
  getCurrentUser, 
  hasPermission,
  createRole as createNewRole,
  updateRole as updateExistingRole,
  deleteRole as deleteExistingRole
} from '../../services/auth';
import { logChatEvent } from '../../utils/logger.js';
import RoleTable from './roles/RoleTable.js';
import RoleToolbar from './roles/RoleToolbar.js';
import CreateRoleModal from './roles/CreateRoleModal.js';
import EditRoleModal from './roles/EditRoleModal.js';
import DeleteRoleModal from './roles/DeleteRoleModal.js';

/**
 * Role Manager Component
 * Provides role management functionality for administrators
 */
class RoleManager {
  /**
   * Create a new RoleManager
   * @param {HTMLElement} container - The container element
   */
  constructor(container) {
    this.container = container;
    this.roleManagerElement = null;
    this.roles = [];
    this.isLoading = false;
    
    // Filter state
    this.searchTerm = '';
    this.currentPage = 1;
    this.pageSize = 10;
    
    // Sub-components
    this.roleTable = null;
    this.roleToolbar = null;
    this.activeModal = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.loadRoles = this.loadRoles.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.showCreateRoleModal = this.showCreateRoleModal.bind(this);
    this.showEditRoleModal = this.showEditRoleModal.bind(this);
    this.showDeleteRoleModal = this.showDeleteRoleModal.bind(this);
    this.handleCreateRole = this.handleCreateRole.bind(this);
    this.handleEditRole = this.handleEditRole.bind(this);
    this.handleDeleteRole = this.handleDeleteRole.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the role manager
   */
  initialize() {
    // Create container element
    this.roleManagerElement = document.createElement('div');
    this.roleManagerElement.className = 'role-manager';
    this.applyStyles(this.roleManagerElement, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: '#f8f9fa'
    });
    
    // Add to container
    if (this.container) {
      this.container.appendChild(this.roleManagerElement);
    }
    
    // Load roles
    this.loadRoles();
    
    // Log initialization
    logChatEvent('admin', 'Role manager initialized');
  }
  
  /**
   * Load roles from the server
   */
  async loadRoles() {
    try {
      this.isLoading = true;
      this.render(); // Show loading state
      
      // Get roles from service
      const result = await getAllRoles();
      
      if (result.success) {
        this.roles = result.roles;
        console.log('[CRM Extension] Loaded roles:', this.roles.length);
      } else {
        console.error('[CRM Extension] Error loading roles:', result.error);
        this.roles = [];
      }
      
      this.isLoading = false;
      this.render();
    } catch (error) {
      console.error('[CRM Extension] Error loading roles:', error);
      this.isLoading = false;
      this.roles = [];
      this.render();
    }
  }
  
  /**
   * Render the role manager
   */
  render() {
    if (!this.roleManagerElement) return;
    
    // Clear existing content
    this.roleManagerElement.innerHTML = '';
    
    // Check permissions
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isAdmin) {
      this.renderAccessDenied();
      return;
    }
    
    // Create header
    const header = document.createElement('div');
    header.className = 'role-manager-header';
    this.applyStyles(header, {
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    });
    
    const titleBlock = document.createElement('div');
    
    const title = document.createElement('h3');
    title.textContent = 'Role Management';
    this.applyStyles(title, {
      margin: '0 0 8px 0',
      fontSize: '20px',
      fontWeight: 'bold'
    });
    
    const subtitle = document.createElement('p');
    subtitle.textContent = `${this.roles.length} roles in system`;
    this.applyStyles(subtitle, {
      margin: '0',
      color: '#6c757d',
      fontSize: '14px'
    });
    
    titleBlock.appendChild(title);
    titleBlock.appendChild(subtitle);
    
    // Action buttons
    const actionButtons = document.createElement('div');
    this.applyStyles(actionButtons, {
      display: 'flex',
      gap: '10px'
    });
    
    // Create role button
    const createButton = document.createElement('button');
    createButton.textContent = 'Create Role';
    createButton.id = 'create-role-btn';
    this.applyStyles(createButton, {
      padding: '8px 16px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center'
    });
    
    createButton.addEventListener('click', this.showCreateRoleModal);
    
    const createIcon = document.createElement('span');
    createIcon.textContent = '➕';
    this.applyStyles(createIcon, {
      marginRight: '5px'
    });
    
    createButton.prepend(createIcon);
    actionButtons.appendChild(createButton);
    
    header.appendChild(titleBlock);
    header.appendChild(actionButtons);
    this.roleManagerElement.appendChild(header);
    
    // Create and render toolbar (search)
    this.roleToolbar = new RoleToolbar({
      searchTerm: this.searchTerm,
      onSearch: this.handleSearch,
      onRefresh: this.loadRoles
    });
    
    this.roleManagerElement.appendChild(this.roleToolbar.render());
    
    // Show loading state or render role table
    if (this.isLoading) {
      const loadingElement = document.createElement('div');
      this.applyStyles(loadingElement, {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '50px',
        color: '#6c757d'
      });
      
      loadingElement.textContent = 'Loading roles...';
      this.roleManagerElement.appendChild(loadingElement);
    } else {
      // Filter roles
      const filteredRoles = this.filterRoles();
      
      // Create and render role table
      this.roleTable = new RoleTable({
        roles: filteredRoles,
        currentPage: this.currentPage,
        pageSize: this.pageSize,
        onPageChange: this.handlePageChange,
        onEditRole: this.showEditRoleModal,
        onDeleteRole: this.showDeleteRoleModal
      });
      
      this.roleManagerElement.appendChild(this.roleTable.render());
    }
    
    return this.roleManagerElement;
  }
  
  /**
   * Filter roles based on search term
   * @returns {Array} Filtered roles
   */
  filterRoles() {
    if (!Array.isArray(this.roles)) {
      console.warn('Roles is not an array:', this.roles);
      return [];
    }
    
    return this.roles.filter(role => {
      // Apply search filter
      const matchesSearch = this.searchTerm === '' || 
        (role.name && role.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (role.description && role.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }
  
  /**
   * Render access denied message
   */
  renderAccessDenied() {
    this.roleManagerElement.innerHTML = '';
    
    const accessDenied = document.createElement('div');
    this.applyStyles(accessDenied, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '20px',
      textAlign: 'center',
      color: '#721c24',
      backgroundColor: '#f8d7da'
    });
    
    const iconElement = document.createElement('div');
    iconElement.innerHTML = '⛔';
    this.applyStyles(iconElement, {
      fontSize: '48px',
      marginBottom: '16px'
    });
    
    const titleElement = document.createElement('h3');
    titleElement.textContent = 'Access Denied';
    this.applyStyles(titleElement, {
      margin: '0 0 10px 0',
      fontSize: '24px'
    });
    
    const messageElement = document.createElement('p');
    messageElement.textContent = 'Administrator privileges are required to access Role Management.';
    
    accessDenied.appendChild(iconElement);
    accessDenied.appendChild(titleElement);
    accessDenied.appendChild(messageElement);
    
    this.roleManagerElement.appendChild(accessDenied);
    
    // Log access attempt
    logChatEvent('admin', 'Access denied to role management');
  }
  
  /**
   * Handle search input
   * @param {string} searchTerm - Search term
   */
  handleSearch(searchTerm) {
    this.searchTerm = searchTerm;
    this.currentPage = 1; // Reset to first page
    this.render();
  }
  
  /**
   * Handle page change
   * @param {number} page - New page number
   */
  handlePageChange(page) {
    this.currentPage = page;
    this.render();
  }
  
  /**
   * Show create role modal
   */
  showCreateRoleModal() {
    try {
      const modal = new CreateRoleModal({
        onSuccess: this.handleCreateRole
      });
      
      this.activeModal = modal;
      modal.show();
      
      logChatEvent('admin', 'Opened create role modal');
    } catch (error) {
      console.error('[RoleManager] Error showing create role modal:', error);
      alert('Failed to open create role modal');
    }
  }
  
  /**
   * Show edit role modal
   * @param {Object} role - Role to edit
   */
  showEditRoleModal(role) {
    try {
      const modal = new EditRoleModal({
        role,
        onSuccess: this.handleEditRole
      });
      
      this.activeModal = modal;
      modal.show();
      
      logChatEvent('admin', 'Opened edit role modal', { roleName: role.name });
    } catch (error) {
      console.error('[RoleManager] Error showing edit role modal:', error);
      alert('Failed to open edit role modal');
    }
  }
  
  /**
   * Show delete role modal
   * @param {Object} role - Role to delete
   */
  showDeleteRoleModal(role) {
    try {
      const modal = new DeleteRoleModal({
        role,
        onSuccess: this.handleDeleteRole
      });
      
      this.activeModal = modal;
      modal.show();
      
      logChatEvent('admin', 'Opened delete role modal', { roleName: role.name });
    } catch (error) {
      console.error('[RoleManager] Error showing delete role modal:', error);
      alert('Failed to open delete role modal');
    }
  }
  
  /**
   * Handle role creation
   * @param {Object} role - Created role
   */
  async handleCreateRole(role) {
    try {
      // Reload roles to get the newly created role
      await this.loadRoles();
      
      // Log success
      logChatEvent('admin', 'Role created successfully', { 
        name: role.name,
        permissionCount: role.permissions.length
      });
    } catch (error) {
      console.error('[RoleManager] Error after creating role:', error);
    }
  }
  
  /**
   * Handle role edit
   * @param {Object} role - Edited role
   */
  async handleEditRole(role) {
    try {
      // Reload roles to get the updated role
      await this.loadRoles();
      
      // Log success
      logChatEvent('admin', 'Role edited successfully', { 
        name: role.name,
        id: role.id
      });
    } catch (error) {
      console.error('[RoleManager] Error after editing role:', error);
    }
  }
  
  /**
   * Handle role deletion
   * @param {string} roleId - ID of deleted role
   */
  async handleDeleteRole(roleId) {
    try {
      // Reload roles to remove the deleted role
      await this.loadRoles();
      
      // Log success
      logChatEvent('admin', 'Role deleted successfully', { roleId });
    } catch (error) {
      console.error('[RoleManager] Error after deleting role:', error);
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
   * Destroy the component
   */
  destroy() {
    // Close any open modal
    if (this.activeModal) {
      try {
        this.activeModal.close();
      } catch (e) {
        console.warn('Error closing active modal:', e);
      }
      this.activeModal = null;
    }
    
    // Remove from DOM
    if (this.roleManagerElement && this.roleManagerElement.parentNode) {
      this.roleManagerElement.parentNode.removeChild(this.roleManagerElement);
    }
    
    // Cleanup subcomponents
    if (this.roleTable) {
      this.roleTable.destroy();
    }
    
    if (this.roleToolbar) {
      this.roleToolbar.destroy();
    }
    
    // Log destruction
    logChatEvent('admin', 'Role manager destroyed');
  }
}

export default RoleManager;