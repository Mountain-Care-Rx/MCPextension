// chat/components/app/appcontainer/AppInitializer.js
// Handles initialization of the application container

import { initChat, isChatInitialized } from '../../../index.js';
import { connectToServer } from '../../../services/messageService.js';
import { isAuthenticated } from '../../../services/auth';
import { applyStyles } from './StylesHelper.js';
import { setupMockData } from './index.js';

/**
 * Initialize the application container
 * @param {Object} appContainer - The AppContainer instance
 * @returns {Promise<Object>} Initialization result with container and appElement
 */
export async function initializeAppContainer(appContainer) {
  // Create a wrapper div that will hold the chat window
  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'hipaa-chat-wrapper';
  wrapperDiv.id = 'hipaa-chat-container';
  
  // Position the wrapper in the bottom-right corner of the viewport
  applyStyles(wrapperDiv, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '9999', // High z-index to appear above other elements
    width: '700px', // Fixed width for the chat window
    height: '500px', // Fixed height for the chat window
    boxSizing: 'border-box',
    display: 'none' // Start hidden by default
  });
  
  // If the existing container has a parent, replace it with our wrapper
  if (appContainer.container && appContainer.container.parentNode) {
    appContainer.container.parentNode.replaceChild(wrapperDiv, appContainer.container);
  } 
  // Otherwise, append the wrapper to the body
  else {
    document.body.appendChild(wrapperDiv);
  }
  
  // Create main app element
  const appElement = document.createElement('div');
  appElement.className = 'hipaa-chat-app';
  applyStyles(appElement, {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    color: '#333',
    backgroundColor: '#fff'
  });
  
  // Add to container
  wrapperDiv.appendChild(appElement);
  
  // Setup mock data for the application
  const mockData = setupMockData();
  
  // Initialize chat system if not already initialized
  if (!isChatInitialized()) {
    await initChat();
  }
  
  return {
    container: wrapperDiv,
    appElement: appElement,
    mockData: mockData
  };
}