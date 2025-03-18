// modules/chat/monitor.js

import { findChatContainerWithRetry, findChatContainer, scanForMessages } from './dom.js';
import { monitorXHRForFirestore } from './network.js';
import { createChatStyles } from './styles.js';

// State management
let isMonitoring = false;
let chatObserver = null;

/**
 * Initialize the chat monitoring system
 */
export function initChatMonitoring() {
  if (isMonitoring) return;
  
  console.log('[CRM Extension] Chat monitoring system initializing');
  
  // Create styles for chat UI components
  createChatStyles();
  
  // Start monitoring for chat messages via DOM
  startChatObserver();
  
  // Start monitoring network activity for chat-related requests
  startNetworkMonitoring();
  
  isMonitoring = true;
}

/**
 * Start monitoring for chat messages using MutationObserver
 */
function startChatObserver() {
  // Set up an observer to watch for DOM changes that represent new chat messages
  if (chatObserver) {
    chatObserver.disconnect();
  }
  
  chatObserver = new MutationObserver(mutations => {
    let hasNewMessages = false;
    
    // Check if any mutations look like new messages
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Look for added message containers
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // ELEMENT_NODE
            // Check if this is a chat message based on classes
            if (
              node.classList && 
              (node.classList.contains('single-chat-wrapper') || 
               node.classList.contains('chat-message'))
            ) {
              hasNewMessages = true;
              break;
            }
            
            // Also check if it contains any chat message element
            if (node.querySelector && (
                node.querySelector('.single-chat-wrapper') || 
                node.querySelector('.chat-message'))
            ) {
              hasNewMessages = true;
              break;
            }
          }
        }
      }
      
      if (hasNewMessages) break;
    }
    
    // If we found new messages, scan to extract them
    if (hasNewMessages) {
      scanForMessages();
    }
  });
  
  // Try to find the main chat container, scanning multiple times if needed
  findChatContainerWithRetry(5, 1000).then(container => {
    if (container) {
      chatObserver.observe(container, {
        childList: true,
        subtree: true
      });
      console.log('[CRM Extension] Chat observer successfully started on container:', container);
    } else {
      console.warn('[CRM Extension] Failed to find chat container after multiple attempts');
    }
  });
  
  // Perform an initial scan for existing messages
  setTimeout(scanForMessages, 2000);
}

/**
 * Start monitoring network activity for chat-related requests
 */
function startNetworkMonitoring() {
  // Monkey-patch XMLHttpRequest to monitor XHR traffic for chat messages
  monitorXHRForFirestore();
  
  // Set up a periodic polling function to check for updates (as a fallback)
  setInterval(() => {
    scanForMessages();
  }, 10000); // Check every 10 seconds as a fallback mechanism
}

/**
 * Clean up resources when the extension is unloaded
 */
export function cleanup() {
  if (chatObserver) {
    chatObserver.disconnect();
    chatObserver = null;
  }
  
  isMonitoring = false;
  
  console.log('[CRM Extension] Chat monitoring cleaned up');
}