/**
 * modules/chat/dom.js
 */

import { addNewMessage, updateExistingMessageDetails } from './storage.js';

/**
 * Try to find the chat container with multiple retries
 * Only run if URL includes '/custom-menu-link/'
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<Element|null>} Promise resolving to the container or null
 */
export function findChatContainerWithRetry(maxRetries = 3, delay = 1000) {
  // Check if we are on the correct chat page
  if (!window.location.href.includes('/custom-menu-link/')) {
    console.warn('[CRM Extension] Current URL is not the chat page. Skipping chat container search.');
    return Promise.resolve(null);
  }
  
  return new Promise(resolve => {
    let retries = 0;
    
    function attempt() {
      const container = findChatContainer();
      
      if (container) {
        resolve(container);
      } else if (retries < maxRetries) {
        retries++;
        console.log(`[CRM Extension] Chat container not found, retry ${retries}/${maxRetries} in ${delay}ms`);
        setTimeout(attempt, delay);
      } else {
        resolve(null);
      }
    }
    
    attempt();
  });
}

/**
 * Try to find the chat container element using various selectors
 * @returns {Element|null} The chat container element or null
 */
export function findChatContainer() {
  // First, look specifically for the native chat dropdown
  const nativeChatDropdown = document.getElementById('crm-chat-dropdown');
  if (nativeChatDropdown) {
    return nativeChatDropdown;
  }
  
  // Try various selectors that might match the chat container
  const selectors = [
    '.single-chat-wrapper',
    '.chat-message',
    '[data-v-38d322f9]',
    '[class*="single-chat-wrapper"]',
    '[class*="chat-message"]',
    '.message-list',
    '.chat-list',
    '.conversation-list'
  ];
  
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        // Find the highest parent that contains all messages
        let bestParent = elements[0].parentElement;
        while (bestParent && bestParent.tagName !== 'BODY') {
          if (bestParent.querySelectorAll(selector).length >= elements.length) {
            return bestParent;
          }
          bestParent = bestParent.parentElement;
        }
        return elements[0].parentElement || elements[0];
      }
    } catch (e) {
      // Continue to the next selector
    }
  }
  
  // Look for date headers as they appear in the chat interface
  const dateHeaders = document.querySelectorAll('.date-header, [class*="date-header"]');
  if (dateHeaders.length > 0) {
    return dateHeaders[0].parentElement;
  }
  
  return null;
}

/**
 * Scan for chat messages in the DOM
 */
export function scanForMessages() {
  const messages = findChatMessages();
  
  if (messages.length > 0) {
    const newMessages = messages.filter(msg => {
      // Simplified: assume comparison logic is implemented
      return true;
    });
    
    if (newMessages.length > 0) {
      for (const msg of newMessages) {
        addNewMessage(msg);
      }
      console.log(`[CRM Extension] Found ${newMessages.length} new chat messages`);
    }
  }
  
  updateExistingMessageDetails(messages);
}

/**
 * Find chat messages in the DOM
 * @returns {Array} Array of message objects
 */
export function findChatMessages() {
  const messages = [];
  
  const messageSelectors = [
    '.chat-message',
    '[class*="chat-message"]',
    '.messageListItem',
    '.single-chat',
    '[class*="message"]',
    '[class*="chat"]'
  ];
  
  let foundMessages = [];
  
  for (const selector of messageSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundMessages = Array.from(elements);
      break;
    }
  }
  
  for (const element of foundMessages) {
    try {
      const message = extractMessageFromDOM(element);
      if (message && message.sender && message.text) {
        messages.push(message);
      }
    } catch (error) {
      console.error('[CRM Extension] Error extracting message data:', error);
    }
  }
  
  return messages;
}

/**
 * Extract message information from DOM element
 * @param {Element} element - The message element
 * @returns {Object|null} The extracted message or null
 */
export function extractMessageFromDOM(element) {
  const id = element.dataset?.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let sender = '';
  const usernameElement = element.querySelector('.username, [class*="username"]');
  
  if (usernameElement) {
    sender = usernameElement.textContent.trim();
  } else {
    const headerElement = element.querySelector('.header, [class*="header"]');
    if (headerElement) {
      sender = headerElement.textContent.trim();
    }
  }
  
  let text = '';
  const contentElement = element.querySelector(
    '.messageContent, [class*="messageContent"], .markup, [class*="markup"], .contents, [class*="contents"]'
  );
  
  if (contentElement) {
    text = contentElement.textContent.trim();
  } else {
    const clone = element.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll(
      '.username, .timestamp, [class*="username"], [class*="timestamp"]'
    );
    
    for (const el of elementsToRemove) {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
    
    text = clone.textContent.trim();
  }
  
  let timestamp = '';
  const timestampElement = element.querySelector(
    '.timestamp, [class*="timestamp"], time, [datetime]'
  );
  
  if (timestampElement) {
    timestamp = timestampElement.getAttribute('datetime') || timestampElement.textContent.trim();
  }
  
  if (!timestamp) {
    timestamp = new Date().toISOString();
  }
  
  const isUnread = element.classList.contains('unread') || 
                   element.parentElement?.classList.contains('unread') ||
                   !!element.querySelector('.unread, [class*="unread"]');
  
  let conversationId = element.dataset?.conversationId;
  
  if (!conversationId) {
    let parent = element.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      if (parent.dataset?.conversationId) {
        conversationId = parent.dataset.conversationId;
        break;
      }
      parent = parent.parentElement;
    }
  }
  
  return {
    id,
    sender,
    text,
    timestamp,
    conversationId,
    isRead: !isUnread,
    element
  };
}

/**
 * Scroll to a given message element in the DOM.
 * @param {Object} message - The message object containing the DOM element.
 */
export function scrollToMessage(message) {
  if (message && message.element) {
    message.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
