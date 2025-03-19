/**
 * modules/chat/monitor.js
 */

import { findChatContainerWithRetry, scanForMessages } from './dom.js';
import { monitorXHRForFirestore } from './network.js';
import { createChatStyles } from './styles.js';

let isMonitoring = false;
let chatObserver = null;
let lastScanTime = 0;  // For throttling

function throttledScanForMessages() {
  const now = Date.now();
  if (now - lastScanTime > 1000) { // 1-second threshold
    lastScanTime = now;
    scanForMessages();
  }
}

/**
 * Initialize the chat monitoring system
 */
export function initChatMonitoring() {
  // Only initialize if on the chat page
  if (!window.location.href.includes('/custom-menu-link/')) {
    console.warn('[CRM Extension] Not on the chat page. Chat monitoring not initialized.');
    return;
  }
  
  if (isMonitoring) return;
  
  console.log('[CRM Extension] Chat monitoring system initializing');
  
  createChatStyles();
  startChatObserver();
  startNetworkMonitoring();
  
  isMonitoring = true;
}

/**
 * Start monitoring for chat messages using MutationObserver
 */
function startChatObserver() {
  if (chatObserver) {
    chatObserver.disconnect();
  }
  
  chatObserver = new MutationObserver(mutations => {
    let hasNewMessages = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            if (
              node.classList && 
              (node.classList.contains('single-chat-wrapper') || 
               node.classList.contains('chat-message'))
            ) {
              hasNewMessages = true;
              break;
            }
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
    
    if (hasNewMessages) {
      throttledScanForMessages();
    }
  });
  
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
  
  setTimeout(throttledScanForMessages, 2000);
}

/**
 * Start monitoring network activity for chat-related requests
 */
function startNetworkMonitoring() {
  monitorXHRForFirestore();
  
  setInterval(() => {
    throttledScanForMessages();
  }, 10000);
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
