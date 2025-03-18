// modules/chat/ui.js

import { onNewMessages, getAllMessages, getRecentMessages, getAllConversations, getConversationMessages, markConversationAsRead, getChannels, getDirectMessages, getConversationById } from './storage.js';
import { scrollToMessage as scrollToMessageInDOM } from './dom.js';
import { fetchChannelsAndDirectMessages } from './platformIntegration.js';

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, duration = 2000) {
  // Check if a toast container already exists
  let toastContainer = document.getElementById("crm-plus-toast-container");
  
  // Create a toast container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "crm-plus-toast-container";
    toastContainer.style.position = "fixed";
    toastContainer.style.bottom = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "100000";
    document.body.appendChild(toastContainer);
  }
  
  // Create the toast
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "10px";
  toast.style.borderRadius = "5px";
  toast.style.marginTop = "10px";
  toast.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  toast.style.transition = "opacity 0.5s, transform 0.5s";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  
  // Add the toast to the container
  toastContainer.appendChild(toast);
  
  // Force reflow to enable transition from initial state
  void toast.offsetWidth;
  
  // Show the toast with animation
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  
  // Hide and remove after duration
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    
    // Remove from DOM after transition
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // Remove container if empty
      if (toastContainer.childNodes.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 500);
  }, duration);
}

/**
 * Create a chat button for the CRM toolbar with custom dropdown
 * @returns {HTMLElement} The chat button element
 */
export function createChatButton() {
  const button = document.createElement('button');
  button.className = 'crm-plus-chat-button';
  button.id = 'crm-plus-chat-button';
  
  // Add chat icon
  const icon = document.createElement('span');
  icon.className = 'crm-plus-chat-icon';
  icon.innerHTML = '💬';
  button.appendChild(icon);
  
  // Add text
  const text = document.createElement('span');
  text.textContent = 'Chat';
  button.appendChild(text);
  
  // Add notification count (hidden by default)
  const count = document.createElement('span');
  count.className = 'crm-plus-chat-count';
  count.id = 'crm-plus-chat-count';
  count.style.display = 'none';
  count.textContent = '0';
  button.appendChild(count);
  
  // Create the dropdown
  const dropdown = createChatDropdown();
  
  // Toggle dropdown when button is clicked
  button.addEventListener('click', () => {
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    } else {
      dropdown.classList.add('show');
      // Reset the notification count
      count.textContent = '0';
      count.style.display = 'none';
      
      // Update dropdown content when opened
      updateChatDropdown(dropdown);
    }
  });
  
  // Subscribe to new messages to update notification count
  onNewMessages(messages => {
    if (!dropdown.classList.contains('show')) {
      const currentCount = parseInt(count.textContent, 10) || 0;
      const newCount = currentCount + messages.length;
      count.textContent = newCount.toString();
      count.style.display = 'inline';
      
      // Also update the dropdown content
      updateChatDropdown(dropdown);
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (!button.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.remove('show');
    }
  });
  
  return button;
}

/**
 * Create a chat dropdown for the chat button
 * @returns {HTMLElement} The chat dropdown element
 */
function createChatDropdown() {
  const dropdown = document.createElement('div');
  dropdown.className = 'crm-plus-chat-dropdown';
  dropdown.id = 'crm-plus-chat-dropdown';
  
  // Add tabs for Recent/Channels/DMs
  const tabs = document.createElement('div');
  tabs.className = 'crm-plus-chat-tabs';
  
  const recentTab = document.createElement('div');
  recentTab.className = 'crm-plus-chat-tab active';
  recentTab.textContent = 'Recent';
  recentTab.setAttribute('data-tab', 'recent');
  
  const channelsTab = document.createElement('div');
  channelsTab.className = 'crm-plus-chat-tab';
  channelsTab.textContent = 'Channels';
  channelsTab.setAttribute('data-tab', 'channels');
  
  const dmsTab = document.createElement('div');
  dmsTab.className = 'crm-plus-chat-tab';
  dmsTab.textContent = 'DMs';
  dmsTab.setAttribute('data-tab', 'dms');
  
  tabs.appendChild(recentTab);
  tabs.appendChild(channelsTab);
  tabs.appendChild(dmsTab);
  
  // Add containers for each tab
  const recentContainer = document.createElement('div');
  recentContainer.id = 'crm-plus-chat-recent';
  recentContainer.className = 'crm-plus-chat-messages';
  
  const channelsContainer = document.createElement('div');
  channelsContainer.id = 'crm-plus-chat-channels';
  channelsContainer.className = 'crm-plus-chat-channels';
  channelsContainer.style.display = 'none';
  
  const dmsContainer = document.createElement('div');
  dmsContainer.id = 'crm-plus-chat-dms';
  dmsContainer.className = 'crm-plus-chat-dms';
  dmsContainer.style.display = 'none';
  
  // Add tab click handlers
  recentTab.addEventListener('click', () => {
    setActiveTab(recentTab, recentContainer);
    updateRecentMessages(dropdown);
  });
  
  channelsTab.addEventListener('click', () => {
    setActiveTab(channelsTab, channelsContainer);
    populateChannels(channelsContainer);
  });
  
  dmsTab.addEventListener('click', () => {
    setActiveTab(dmsTab, dmsContainer);
    populateDMs(dmsContainer);
  });
  
  function setActiveTab(tab, container) {
    // Remove active class from all tabs
    tabs.querySelectorAll('.crm-plus-chat-tab').forEach(t => {
      t.classList.remove('active');
    });
    
    // Hide all containers
    dropdown.querySelectorAll('.crm-plus-chat-messages, .crm-plus-chat-channels, .crm-plus-chat-dms, .crm-plus-chat-conversations').forEach(c => {
      c.style.display = 'none';
    });
    
    // Set active tab and show container
    tab.classList.add('active');
    container.style.display = 'block';
  }
  
  // Add chat footer with input
  const footer = document.createElement('div');
  footer.className = 'crm-plus-chat-footer';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'crm-plus-chat-input';
  input.placeholder = 'Type a message...';
  
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const text = input.value.trim();
      if (text) {
        // Get active conversation ID if on conversations tab
        let targetConversationId = null;
        const activeTab = dropdown.querySelector('.crm-plus-chat-tab.active');
        if (activeTab) {
          const tabType = activeTab.getAttribute('data-tab');
          if (tabType === 'channels') {
            const activeChannel = channelsContainer.querySelector('.crm-plus-chat-channel.active');
            if (activeChannel) {
              targetConversationId = activeChannel.getAttribute('data-id');
            }
          } else if (tabType === 'dms') {
            const activeDM = dmsContainer.querySelector('.crm-plus-chat-dm.active');
            if (activeDM) {
              targetConversationId = activeDM.getAttribute('data-id');
            }
          } else {
            const activeConversation = recentContainer.querySelector('.crm-plus-chat-conversation.active');
            if (activeConversation) {
              targetConversationId = activeConversation.getAttribute('data-conversation-id');
            }
          }
        }
        
        sendChatMessage(text, targetConversationId);
        input.value = '';
      }
    }
  });
  
  footer.appendChild(input);
  
  // Add refresh button
  const refreshButton = document.createElement('button');
  refreshButton.className = 'crm-plus-refresh-button';
  refreshButton.innerHTML = '🔄';
  refreshButton.title = 'Refresh chat data';
  refreshButton.addEventListener('click', () => {
    refreshChatData(dropdown);
  });
  
  // Assemble dropdown
  dropdown.appendChild(tabs);
  dropdown.appendChild(recentContainer);
  dropdown.appendChild(channelsContainer);
  dropdown.appendChild(dmsContainer);
  dropdown.appendChild(footer);
  dropdown.appendChild(refreshButton);
  
  // Initial fetch of chat data
  refreshChatData(dropdown);
  
  return dropdown;
}

/**
 * Refresh chat data from external sources
 * @param {HTMLElement} dropdown - The chat dropdown element
 */
function refreshChatData(dropdown) {
  // Show loading indicators
  const containers = dropdown.querySelectorAll('.crm-plus-chat-messages, .crm-plus-chat-channels, .crm-plus-chat-dms');
  containers.forEach(container => {
    container.innerHTML = '<div class="crm-plus-chat-loading">Loading...</div>';
  });
  
  // Fetch channels and DMs
  fetchChannelsAndDirectMessages().then(() => {
    // Update containers based on active tab
    const activeTab = dropdown.querySelector('.crm-plus-chat-tab.active');
    if (activeTab) {
      const tabType = activeTab.getAttribute('data-tab');
      if (tabType === 'recent') {
        updateRecentMessages(dropdown);
      } else if (tabType === 'channels') {
        populateChannels(dropdown.querySelector('#crm-plus-chat-channels'));
      } else if (tabType === 'dms') {
        populateDMs(dropdown.querySelector('#crm-plus-chat-dms'));
      }
    }
  }).catch(error => {
    console.error('[CRM Extension] Error refreshing chat data:', error);
    showToast('Error refreshing chat data');
  });
}

/**
 * Update the chat dropdown with latest content
 * @param {HTMLElement} dropdown - The chat dropdown element
 */
function updateChatDropdown(dropdown) {
  if (!dropdown) return;
  
  // Determine which tab is active
  const activeTab = dropdown.querySelector('.crm-plus-chat-tab.active');
  if (activeTab) {
    const tabType = activeTab.getAttribute('data-tab');
    
    if (tabType === 'recent') {
      updateRecentMessages(dropdown);
    } else if (tabType === 'channels') {
      populateChannels(dropdown.querySelector('#crm-plus-chat-channels'));
    } else if (tabType === 'dms') {
      populateDMs(dropdown.querySelector('#crm-plus-chat-dms'));
    }
  } else {
    // Default to recent messages
    updateRecentMessages(dropdown);
  }
  
  // Update unread counts
  updateUnreadCounts(dropdown);
}

/**
 * Update the recent messages tab content
 * @param {HTMLElement} dropdown - The chat dropdown element
 */
function updateRecentMessages(dropdown) {
  const messagesContainer = dropdown.querySelector('#crm-plus-chat-recent');
  if (!messagesContainer) return;
  
  // Get recent messages
  const recentMessages = getRecentMessages(10);
  
  // Clear current content
  messagesContainer.innerHTML = '';
  
  if (recentMessages.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'crm-plus-chat-message';
    emptyMessage.textContent = 'No recent messages';
    emptyMessage.style.color = '#aaa';
    emptyMessage.style.fontStyle = 'italic';
    emptyMessage.style.textAlign = 'center';
    messagesContainer.appendChild(emptyMessage);
    return;
  }
  
  // Add each message
  for (const message of recentMessages) {
    const messageElement = document.createElement('div');
    messageElement.className = 'crm-plus-chat-message';
    
    const userElement = document.createElement('div');
    userElement.className = 'crm-plus-chat-user';
    userElement.textContent = message.sender;
    messageElement.appendChild(userElement);
    
    const textElement = document.createElement('div');
    textElement.className = 'crm-plus-chat-text';
    textElement.textContent = message.text;
    messageElement.appendChild(textElement);
    
    const timeElement = document.createElement('div');
    timeElement.className = 'crm-plus-chat-time';
    
    // Format timestamp
    try {
      const date = new Date(message.timestamp);
      if (!isNaN(date.getTime())) {
        timeElement.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        timeElement.textContent = message.timestamp;
      }
    } catch (e) {
      timeElement.textContent = message.timestamp;
    }
    
    messageElement.appendChild(timeElement);
    
    // Add click handler to navigate to the original message
    messageElement.addEventListener('click', () => {
      if (message.element) {
        scrollToMessage(message);
        dropdown.classList.remove('show');
      }
    });
    
    messagesContainer.appendChild(messageElement);
  }
}

/**
 * Populate channels tab with available channels
 * @param {HTMLElement} channelsContainer - The channels container element
 */
function populateChannels(channelsContainer) {
  const channels = getChannels();
  channelsContainer.innerHTML = '';
  
  if (channels.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'crm-plus-chat-empty';
    emptyMessage.textContent = 'No channels found';
    channelsContainer.appendChild(emptyMessage);
    return;
  }
  
  channels.forEach(channel => {
    const channelElement = document.createElement('div');
    channelElement.className = 'crm-plus-chat-channel';
    channelElement.setAttribute('data-id', channel.id);
    
    const channelIcon = document.createElement('div');
    channelIcon.className = 'crm-plus-channel-icon';
    channelIcon.textContent = '#';
    
    const channelName = document.createElement('div');
    channelName.className = 'crm-plus-channel-name';
    channelName.textContent = channel.name;
    
    channelElement.appendChild(channelIcon);
    channelElement.appendChild(channelName);
    
    // Add unread badge if applicable
    if (channel.unreadCount && channel.unreadCount > 0) {
      const unreadBadge = document.createElement('div');
      unreadBadge.className = 'crm-plus-unread-badge';
      unreadBadge.textContent = channel.unreadCount > 9 ? '9+' : channel.unreadCount.toString();
      channelElement.appendChild(unreadBadge);
    }
    
    // Add click handler to view channel
    channelElement.addEventListener('click', () => {
      // Mark as active
      channelsContainer.querySelectorAll('.crm-plus-chat-channel.active').forEach(el => {
        el.classList.remove('active');
      });
      channelElement.classList.add('active');
      
      // Show channel messages
      openConversation(channel.id, 'channel', channelsContainer.closest('.crm-plus-chat-dropdown'));
    });
    
    channelsContainer.appendChild(channelElement);
  });
}

/**
 * Populate DMs tab with available direct messages
 * @param {HTMLElement} dmsContainer - The DMs container element
 */
function populateDMs(dmsContainer) {
  const dms = getDirectMessages();
  dmsContainer.innerHTML = '';
  
  if (dms.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'crm-plus-chat-empty';
    emptyMessage.textContent = 'No direct messages found';
    dmsContainer.appendChild(emptyMessage);
    return;
  }
  
  dms.forEach(dm => {
    const dmElement = document.createElement('div');
    dmElement.className = 'crm-plus-chat-dm';
    dmElement.setAttribute('data-id', dm.id);
    
    // Create avatar element
    let avatarElement;
    if (dm.avatarSrc) {
      avatarElement = document.createElement('img');
      avatarElement.className = 'crm-plus-avatar';
      avatarElement.src = dm.avatarSrc;
      avatarElement.alt = dm.name;
    } else {
      avatarElement = document.createElement('div');
      avatarElement.className = 'crm-plus-avatar-placeholder';
      avatarElement.style.backgroundColor = dm.avatarColor || getRandomColor(dm.name);
      avatarElement.textContent = dm.initials || getInitials(dm.name);
    }
    
    const nameElement = document.createElement('div');
    nameElement.className = 'crm-plus-dm-name';
    nameElement.textContent = dm.name;
    
    dmElement.appendChild(avatarElement);
    dmElement.appendChild(nameElement);
    
    // Add unread badge if applicable
    if (dm.unreadCount && dm.unreadCount > 0) {
      const unreadBadge = document.createElement('div');
      unreadBadge.className = 'crm-plus-unread-badge';
      unreadBadge.textContent = dm.unreadCount > 9 ? '9+' : dm.unreadCount.toString();
      dmElement.appendChild(unreadBadge);
    }
    
    // Add click handler to view DM
    dmElement.addEventListener('click', () => {
      // Mark as active
      dmsContainer.querySelectorAll('.crm-plus-chat-dm.active').forEach(el => {
        el.classList.remove('active');
      });
      dmElement.classList.add('active');
      
      // Show DM messages
      openConversation(dm.id, 'dm', dmsContainer.closest('.crm-plus-chat-dropdown'));
    });
    
    dmsContainer.appendChild(dmElement);
  });
}

/**
 * Open a conversation and display its messages
 * @param {string} id - The conversation ID
 * @param {string} type - The conversation type ('channel' or 'dm')
 * @param {HTMLElement} dropdown - The chat dropdown element
 */
function openConversation(id, type, dropdown) {
  // Create a conversation view if it doesn't exist
  let conversationView = dropdown.querySelector('#crm-plus-conversation-view');
  if (!conversationView) {
    conversationView = document.createElement('div');
    conversationView.id = 'crm-plus-conversation-view';
    conversationView.className = 'crm-plus-chat-conversations';
    dropdown.appendChild(conversationView);
  }
  
  // Hide other containers
  dropdown.querySelectorAll('.crm-plus-chat-messages, .crm-plus-chat-channels, .crm-plus-chat-dms').forEach(container => {
    container.style.display = 'none';
  });
  
  // Show conversation view
  conversationView.style.display = 'block';
  
  // Get conversation details
  const conversation = getConversationById(id, type);
  if (!conversation) {
    conversationView.innerHTML = '<div class="crm-plus-chat-empty">Conversation not found</div>';
    return;
  }
  
  // Clear current content
  conversationView.innerHTML = '';
  
  // Add header with back button
  const headerElement = document.createElement('div');
  headerElement.className = 'crm-plus-chat-header';
  
  // Add back button
  const backButton = document.createElement('div');
  backButton.className = 'crm-plus-chat-header-action';
  backButton.textContent = '← Back';
  backButton.addEventListener('click', () => {
    // Hide conversation view
    conversationView.style.display = 'none';
    
    // Show previous container based on type
    if (type === 'channel') {
      dropdown.querySelector('#crm-plus-chat-channels').style.display = 'block';
    } else if (type === 'dm') {
      dropdown.querySelector('#crm-plus-chat-dms').style.display = 'block';
    } else {
      dropdown.querySelector('#crm-plus-chat-recent').style.display = 'block';
    }
  });
  
  // Add conversation name
  const nameElement = document.createElement('div');
  nameElement.textContent = conversation.name || (type === 'channel' ? `#${id}` : 'Direct Message');
  
  headerElement.appendChild(backButton);
  headerElement.appendChild(nameElement);
  conversationView.appendChild(headerElement);
  
  // Add messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'crm-plus-chat-messages-container';
  
  // No messages yet - show loading or empty state
  if (!conversation.messages || conversation.messages.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'crm-plus-chat-empty';
    emptyMessage.textContent = 'No messages yet';
    messagesContainer.appendChild(emptyMessage);
  } else {
    // Add each message
    conversation.messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = 'crm-plus-chat-message';
      
      const userElement = document.createElement('div');
      userElement.className = 'crm-plus-chat-user';
      userElement.textContent = message.sender || conversation.name;
      messageElement.appendChild(userElement);
      
      const textElement = document.createElement('div');
      textElement.className = 'crm-plus-chat-text';
      textElement.textContent = message.text;
      messageElement.appendChild(textElement);
      
      const timeElement = document.createElement('div');
      timeElement.className = 'crm-plus-chat-time';
      
      // Format timestamp
      try {
        const date = new Date(message.timestamp);
        if (!isNaN(date.getTime())) {
          timeElement.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          timeElement.textContent = message.timestamp;
        }
      } catch (e) {
        timeElement.textContent = message.timestamp;
      }
      
      messageElement.appendChild(timeElement);
      messagesContainer.appendChild(messageElement);
    });
  }
  
  conversationView.appendChild(messagesContainer);
  
  // Scroll to bottom of messages
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 10);
}

/**
 * Update unread counts in the dropdown
 * @param {HTMLElement} dropdown - The chat dropdown element
 */
function updateUnreadCounts(dropdown) {
  if (!dropdown) return;
  
  // Calculate total unread count across all conversations
  let totalUnread = 0;
  getAllConversations().forEach(conversation => {
    totalUnread += conversation.unreadCount || 0;
  });
  
  // Calculate total unread count for channels
  let channelsUnread = 0;
  getChannels().forEach(channel => {
    channelsUnread += channel.unreadCount || 0;
  });
  
  // Calculate total unread count for DMs
  let dmsUnread = 0;
  getDirectMessages().forEach(dm => {
    dmsUnread += dm.unreadCount || 0;
  });
  
  // Update main chat button badge
  const chatButton = document.getElementById('crm-plus-chat-button');
  const count = chatButton?.querySelector('.crm-plus-chat-count');
  if (count) {
    const totalAllUnread = totalUnread + channelsUnread + dmsUnread;
    if (totalAllUnread > 0) {
      count.textContent = totalAllUnread > 9 ? '9+' : totalAllUnread.toString();
      count.style.display = 'inline';
    } else {
      count.style.display = 'none';
    }
  }
  
  // Update conversations tab badge
  const channelsTab = dropdown.querySelector('.crm-plus-chat-tab[data-tab="channels"]');
  updateTabBadge(channelsTab, channelsUnread);
  
  // Update DMs tab badge
  const dmsTab = dropdown.querySelector('.crm-plus-chat-tab[data-tab="dms"]');
  updateTabBadge(dmsTab, dmsUnread);
}

/**
 * Update badge on a tab
 * @param {HTMLElement} tab - The tab element
 * @param {number} count - The unread count
 */
function updateTabBadge(tab, count) {
  if (!tab) return;
  
  let badge = tab.querySelector('.crm-plus-chat-tab-badge');
  
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'crm-plus-chat-tab-badge';
      tab.appendChild(badge);
    }
    
    badge.textContent = count > 9 ? '9+' : count.toString();
    badge.style.display = 'inline';
  } else if (badge) {
    badge.style.display = 'none';
  }
}

/**
 * Send a chat message using the native UI
 * @param {string} text - The message text to send
 * @param {string} conversationId - Optional conversation ID to target
 * @returns {boolean} Success status
 */
function sendChatMessage(text, conversationId = null) {
  if (!text) return false;
  
  try {
    // Try to find the chat input in the main UI
    const inputSelectors = [
      'textarea[placeholder*="message"], input[placeholder*="message"]',
      'textarea[placeholder*="chat"], input[placeholder*="chat"]',
      'textarea[placeholder*="type"], input[placeholder*="type"]',
      '.chat-input',
      '[contenteditable="true"]'
    ];
    
    let chatInput = null;
    
    // If conversation ID is provided, try to find that specific conversation first
    if (conversationId) {
      // Try to find and click on the specific conversation
      const conversationElements = Array.from(document.querySelectorAll('a, div, button')).filter(el => 
        (el.dataset && el.dataset.conversationId === conversationId) ||
        el.getAttribute('data-conversation-id') === conversationId ||
        el.textContent.includes(conversationId)
      );
      
      if (conversationElements.length > 0) {
        // Click on it to open that conversation
        conversationElements[0].click();
        
        // Wait a moment for the conversation UI to load
        setTimeout(() => {
          // Now find the input
          for (const selector of inputSelectors) {
            const input = document.querySelector(selector);
            if (input) {
              input.focus();
              
              // Set the value
              if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.value = text;
                input.dispatchEvent(new Event('input', { bubbles: true }));
              } else if (input.getAttribute('contenteditable') === 'true') {
                input.textContent = text;
                input.dispatchEvent(new InputEvent('input', { bubbles: true }));
              }
              
              // Trigger Enter key
              input.dispatchEvent(new KeyboardEvent('keydown', { 
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true 
              }));
              
              return true;
            }
          }
        }, 500);
      }
    }
    
    // General approach if no conversation ID or specific conversation not found
    for (const selector of inputSelectors) {
      const input = document.querySelector(selector);
      if (input) {
        chatInput = input;
        break;
      }
    }
    
    if (!chatInput) {
      console.error('[CRM Extension] Chat input not found');
      showToast('Chat input not found. Try clicking on a conversation first.');
      return false;
    }
    
    // Focus the input
    chatInput.focus();
    
    // Set the value
    if (chatInput.tagName === 'INPUT' || chatInput.tagName === 'TEXTAREA') {
      chatInput.value = text;
      
      // Trigger input event for reactive frameworks
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (chatInput.getAttribute('contenteditable') === 'true') {
      chatInput.textContent = text;
      
      // Trigger input event for reactive frameworks
      chatInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
    
    // Find send button
    const sendButtonSelectors = [
      'button[type="submit"]',
      'button.send',
      'button[class*="send"]',
      'button svg[class*="send"]',
      'button.chat-send',
      'button[aria-label*="send"]',
      'button[title*="send"]'
    ];
    
    let sendButton = null;
    
    for (const selector of sendButtonSelectors) {
      const button = document.querySelector(selector);
      if (button) {
        sendButton = button;
        break;
      }
    }
    
    if (sendButton) {
      // Click the send button
      sendButton.click();
    } else {
      // Try pressing Enter key
      chatInput.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true 
      }));
    }
    
    return true;
  } catch (error) {
    console.error('[CRM Extension] Error sending chat message:', error);
    showToast(`Error sending message: ${error.message}`);
    return false;
  }
}

/**
 * Get initials from a name
 * @param {string} name - The name to get initials from
 * @returns {string} The initials (up to 2 characters)
 */
function getInitials(name) {
  if (!name) return '';
  
  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return name.charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a consistent color based on a string
 * @param {string} str - The string to generate a color from
 * @returns {string} A hexadecimal color code
 */
function getRandomColor(str) {
  if (!str) return '#7289DA'; // Discord default color
  
  // Simple hash function to generate a number from a string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hexadecimal and ensure it's bright enough to see text
  let color = '#';
  for (let i = 0; i < 3; i++) {
    // Get a value between 128 and 255 for each RGB component (brighter colors)
    const value = ((hash >> (i * 8)) & 0xFF) % 128 + 128;
    color += value.toString(16).padStart(2, '0');
  }
  
  return color;
}

/**
 * Scrolls to a specific chat message
 * @param {Object} message - The message object
 */
export function scrollToMessage(message) {
  scrollToMessageInDOM(message);
}