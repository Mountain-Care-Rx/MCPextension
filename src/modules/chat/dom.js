// modules/chat/dom.js

import { addNewMessage, updateExistingMessageDetails } from './storage.js';

/**
 * Try to find the chat container with multiple retries
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<Element|null>} Promise resolving to the container or null
 */
export function findChatContainerWithRetry(maxRetries = 3, delay = 1000) {
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
    // Direct container selectors
    '.single-chat-wrapper',
    '.chat-message',
    // Parent containers
    '[data-v-38d322f9]',
    '[class*="single-chat-wrapper"]',
    '[class*="chat-message"]',
    // More general selectors as fallbacks
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
      // Check if we already have this message based on existing messages in storage
      // This would need to be compared against getAllMessages() from storage
      // For modularization, we'll assume the comparison logic is implemented
      return true; // Simplified for now
    });
    
    if (newMessages.length > 0) {
      // Add new messages
      for (const msg of newMessages) {
        addNewMessage(msg);
      }
      
      console.log(`[CRM Extension] Found ${newMessages.length} new chat messages`);
    }
  }
  
  // Also update any existing message details (like timestamps, read status)
  updateExistingMessageDetails(messages);
}

/**
 * Find chat messages in the DOM
 * @returns {Array} Array of message objects
 */
export function findChatMessages() {
  const messages = [];
  
  // Try to find message containers using various selectors based on the HTML structure
  const messageSelectors = [
    // Direct message selectors based on the HTML in the screenshot
    '.chat-message',
    '[class*="chat-message"]',
    '.messageListItem',
    '.single-chat',
    // Fallbacks
    '[class*="message"]',
    '[class*="chat"]'
  ];
  
  let foundMessages = [];
  
  // Try each selector until we find messages
  for (const selector of messageSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundMessages = Array.from(elements);
      break;
    }
  }
  
  // Process each message element
  for (const element of foundMessages) {
    try {
      // Extract message data from structure
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
  // Generate a unique ID for the message
  const id = element.dataset?.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Try to find the sender's name based on the HTML structure
  let sender = '';
  const usernameElement = element.querySelector('.username, [class*="username"]');
  
  if (usernameElement) {
    sender = usernameElement.textContent.trim();
  } else {
    // Try with header information
    const headerElement = element.querySelector('.header, [class*="header"]');
    if (headerElement) {
      sender = headerElement.textContent.trim();
    }
  }
  
  // Try to find the message text
  let text = '';
  const contentElement = element.querySelector(
    '.messageContent, [class*="messageContent"], .markup, [class*="markup"], .contents, [class*="contents"]'
  );
  
  if (contentElement) {
    text = contentElement.textContent.trim();
  } else {
    // If no specific element found, try to get text while excluding username and timestamp
    const clone = element.cloneNode(true);
    
    // Remove username and timestamp elements if found
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
  
  // Try to find the timestamp
  let timestamp = '';
  const timestampElement = element.querySelector(
    '.timestamp, [class*="timestamp"], time, [datetime]'
  );
  
  if (timestampElement) {
    // Check for datetime attribute first
    timestamp = timestampElement.getAttribute('datetime') || timestampElement.textContent.trim();
  }
  
  // If no proper timestamp found, use current time
  if (!timestamp) {
    timestamp = new Date().toISOString();
  }
  
  // Check if message is unread
  const isUnread = element.classList.contains('unread') || 
                   element.parentElement?.classList.contains('unread') ||
                   !!element.querySelector('.unread, [class*="unread"]');
  
  // Try to extract conversation ID from data attributes or context
  let conversationId = element.dataset?.conversationId;
  
  // If not directly available, try to infer from context
  if (!conversationId) {
    // Check parent elements for conversation ID
    let parent = element.parentElement;
    for (let i = 0; i < 3 && parent; i++) {
      if (parent.dataset?.conversationId) {
        conversationId = parent.dataset.conversationId;
        break;
      }
      parent = parent.parentElement;
    }
    
    // If still not found, generate one based on sender
    if (!conversationId && sender) {
      conversationId = `conversation-${sender.replace(/\s+/g, '-').toLowerCase()}`;
    } else {
      conversationId = `unknown-conversation-${Date.now()}`;
    }
  }
  
  return {
    id,
    conversationId,
    sender,
    text,
    timestamp,
    isRead: !isUnread,
    element: element
  };
}

/**
 * Scrolls to a specific chat message
 * @param {Object} message - The message object
 */
export function scrollToMessage(message) {
  if (message && message.element) {
    try {
      // Scroll the message element into view
      message.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the message briefly
      const originalBackground = message.element.style.backgroundColor;
      message.element.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
      message.element.style.transition = 'background-color 1s';
      
      // Reset after 2 seconds
      setTimeout(() => {
        message.element.style.backgroundColor = originalBackground;
      }, 2000);
    } catch (e) {
      console.error('[CRM Extension] Error scrolling to message:', e);
    }
  }
}