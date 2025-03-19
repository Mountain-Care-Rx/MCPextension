/**
 * modules/chat/index.js
 */

import { initChatMonitoring, cleanup } from './monitor.js';
import { createChatButton, scrollToMessage } from './ui.js';
import { onNewMessages, getAllMessages, getRecentMessages, 
         getAllConversations, getConversationMessages,
         markConversationAsRead } from './storage.js';

// Export the main public API
export {
  initChatMonitoring,
  cleanup,
  createChatButton,
  onNewMessages,
  getAllMessages,
  getRecentMessages,
  getAllConversations,
  getConversationMessages,
  markConversationAsRead,
  scrollToMessage
};
