// modules/chat/index.js

import { initChatMonitoring, cleanup } from './monitor.js';
import { createChatButton, scrollToMessage } from './ui.js';
import { onNewMessages, getAllMessages, getRecentMessages, 
         getAllConversations, getConversationMessages,
         markConversationAsRead } from './storage.js';

// Export the main public API
export {
  // Core functionality
  initChatMonitoring,
  cleanup,
  
  // UI components
  createChatButton,
  
  // Event listeners
  onNewMessages,
  
  // Data access
  getAllMessages,
  getRecentMessages,
  getAllConversations,
  getConversationMessages,
  markConversationAsRead,
  
  // Utilities
  scrollToMessage
};