// chat/components/admin/roles/RoleToolbar.js
// Role search and filtering toolbar for role management

/**
 * Role Toolbar Component
 * Provides search functionality for the role list
 */
class RoleToolbar {
  /**
   * Create a new RoleToolbar
   * @param {Object} options - Toolbar options
   * @param {string} options.searchTerm - Initial search term
   * @param {Function} options.onSearch - Search callback
   * @param {Function} options.onRefresh - Refresh callback
   */
  constructor(options = {}) {
    this.options = {
      searchTerm: '',
      onSearch: () => {},
      onRefresh: () => {},
      ...options
    };
    
    this.toolbarElement = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
  }
  
  /**
   * Render the toolbar
   * @returns {HTMLElement} The rendered toolbar element
   */
  render() {
    // Create toolbar container
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'role-toolbar';
    this.applyStyles(this.toolbarElement, {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '15px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #dee2e6'
    });
    
    // Search box
    const searchContainer = document.createElement('div');
    this.applyStyles(searchContainer, {
      display: 'flex',
      alignItems: 'center',
      flex: '1',
      marginRight: '15px'
    });
    
    const searchIcon = document.createElement('span');
    searchIcon.textContent = '🔍';
    this.applyStyles(searchIcon, {
      marginRight: '8px'
    });
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search roles by name or description...';
    searchInput.value = this.options.searchTerm;
    searchInput.id = 'search-roles-input';
    this.applyStyles(searchInput, {
      flex: '1',
      padding: '8px 12px',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      fontSize: '14px'
    });
    
    searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Clear search on Escape key
        searchInput.value = '';
        this.handleSearch('');
      }
    });
    
    // Add clear button for search
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.textContent = '✕';
    clearButton.title = 'Clear search';
    clearButton.id = 'clear-role-search';
    this.applyStyles(clearButton, {
      marginLeft: '8px',
      padding: '4px 8px',
      backgroundColor: this.options.searchTerm ? '#6c757d' : 'transparent',
      color: this.options.searchTerm ? 'white' : '#6c757d',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      display: this.options.searchTerm ? 'block' : 'none'
    });
    
    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      this.handleSearch('');
      clearButton.style.display = 'none';
    });
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(clearButton);
    
    // Actions container
    const actionsContainer = document.createElement('div');
    this.applyStyles(actionsContainer, {
      display: 'flex',
      alignItems: 'center'
    });
    
    // Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh';
    refreshButton.id = 'refresh-roles-btn';
    this.applyStyles(refreshButton, {
      padding: '8px 12px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #ced4da',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center'
    });
    
    refreshButton.addEventListener('click', this.handleRefresh);
    
    const refreshIcon = document.createElement('span');
    refreshIcon.textContent = '🔄';
    this.applyStyles(refreshIcon, {
      marginRight: '5px'
    });
    
    refreshButton.prepend(refreshIcon);
    
    actionsContainer.appendChild(refreshButton);
    
    this.toolbarElement.appendChild(searchContainer);
    this.toolbarElement.appendChild(actionsContainer);
    
    return this.toolbarElement;
  }
  
  /**
   * Handle search input
   * @param {string} value - Search input value
   */
  handleSearch(value) {
    // Update clear button visibility
    if (this.toolbarElement) {
      const clearButton = this.toolbarElement.querySelector('#clear-role-search');
      if (clearButton) {
        clearButton.style.display = value ? 'block' : 'none';
        clearButton.style.backgroundColor = value ? '#6c757d' : 'transparent';
        clearButton.style.color = value ? 'white' : '#6c757d';
      }
    }
    
    // Call search callback
    if (this.options.onSearch && typeof this.options.onSearch === 'function') {
      this.options.onSearch(value);
    }
  }
  
  /**
   * Handle refresh button click
   */
  handleRefresh() {
    // Show loading indicator on button
    if (this.toolbarElement) {
      const refreshButton = this.toolbarElement.querySelector('#refresh-roles-btn');
      if (refreshButton) {
        const originalText = refreshButton.innerHTML;
        refreshButton.innerHTML = '<span>🔄</span> Refreshing...';
        refreshButton.disabled = true;
        
        // Re-enable after a short delay
        setTimeout(() => {
          refreshButton.innerHTML = originalText;
          refreshButton.disabled = false;
        }, 1000);
      }
    }
    
    // Call refresh callback
    if (this.options.onRefresh && typeof this.options.onRefresh === 'function') {
      this.options.onRefresh();
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
    // Remove event listeners if needed
    
    // Remove from DOM
    if (this.toolbarElement && this.toolbarElement.parentNode) {
      this.toolbarElement.parentNode.removeChild(this.toolbarElement);
    }
    
    // Clear references
    this.toolbarElement = null;
  }
}

export default RoleToolbar;