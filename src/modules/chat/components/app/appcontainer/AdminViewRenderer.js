// chat/components/app/appcontainer/AdminViewRenderer.js
// Handles rendering of the admin view component

import AdminPanel from '../../admin/AdminPanel.js';

/**
 * Render the admin view
 * @param {HTMLElement} container - Container to render into
 * @param {Object} options - Rendering options
 * @returns {HTMLElement} The rendered admin view
 */
export function renderAdminView(container, options = {}) {
  const { currentUser = null } = options;
  
  // Clear any existing content
  if (container) {
    container.innerHTML = '';
  }
  
  // Instantiate the AdminPanel component
  const adminPanel = new AdminPanel(container);
  
  console.log('[AdminViewRenderer] Admin panel rendered using AdminPanel class');
  
  // Return the container for chaining
  return container;
}

/**
 * Apply CSS styles to an element
 * @param {HTMLElement} element - Element to style
 * @param {Object} styles - Styles to apply
 */
function applyStyles(element, styles) {
  Object.assign(element.style, styles);
}

export default { renderAdminView };