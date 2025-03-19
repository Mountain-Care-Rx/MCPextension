/**
 * modules/chat/ui.js
 */

import { onNewMessages, getRecentMessages, getChannels, getDirectMessages, getConversationById } from './storage.js';
import { scrollToMessage as scrollToMessageInDOM } from './dom.js';
import { fetchChannelsAndDirectMessages } from './platformIntegration.js';

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, duration = 2000) {
  let toastContainer = document.getElementById("crm-plus-toast-container");
  
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "crm-plus-toast-container";
    toastContainer.style.position = "fixed";
    toastContainer.style.bottom = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "100000";
    document.body.appendChild(toastContainer);
  }
  
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
  
  toastContainer.appendChild(toast);
  
  void toast.offsetWidth;
  
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
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
  
  const icon = document.createElement('span');
  icon.className = 'crm-plus-chat-icon';
  icon.innerHTML = '💬';
  button.appendChild(icon);
  
  const text = document.createElement('span');
  text.textContent = 'Chat';
  button.appendChild(text);
  
  const count = document.createElement('span');
  count.className = 'crm-plus-chat-count';
  count.id = 'crm-plus-chat-count';
  count.style.display = 'none';
  count.textContent = '0';
  button.appendChild(count);
  
  const dropdown = createChatDropdown();
  
  button.addEventListener('click', () => {
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    } else {
      dropdown.classList.add('show');
      count.textContent = '0';
      count.style.display = 'none';
      updateChatDropdown(dropdown);
    }
  });
  
  onNewMessages(messages => {
    if (!dropdown.classList.contains('show')) {
      const currentCount = parseInt(count.textContent, 10) || 0;
      const newCount = currentCount + messages.length;
      count.textContent = newCount.toString();
      count.style.display = 'inline';
      updateChatDropdown(dropdown);
    }
  });
  
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
    tabs.querySelectorAll('.crm-plus-chat-tab').forEach(t => {
      t.classList.remove('active');
    });
    dropdown.querySelectorAll('.crm-plus-chat-messages, .crm-plus-chat-channels, .crm-plus-chat-dms, .crm-plus-chat-conversations').forEach(c => {
      c.style.display = 'none';
    });
    tab.classList.add('active');
    container.style.display = 'block';
  }
  
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
  
  const refreshButton = document.createElement('button');
  refreshButton.className = 'crm-plus-refresh-button';
  refreshButton.innerHTML = '🔄';
  refreshButton.title = 'Refresh chat data';
  refreshButton.addEventListener('click', () => {
    refreshChatData(dropdown);
  });
  
  dropdown.appendChild(tabs);
  dropdown.appendChild(recentContainer);
  dropdown.appendChild(channelsContainer);
  dropdown.appendChild(dmsContainer);
  dropdown.appendChild(footer);
  dropdown.appendChild(refreshButton);
  
  refreshChatData(dropdown);
  
  return dropdown;
}

/**
 * Refresh chat data from external sources
 * @param {HTMLElement} dropdown - The chat dropdown element
 */
function refreshChatData(dropdown) {
  if (!window.location.href.includes('/custom-menu-link/')) {
    const containers = dropdown.querySelectorAll('.crm-plus-chat-messages, .crm-plus-chat-channels, .crm-plus-chat-dms');
    containers.forEach(container => {
      container.innerHTML = '<div class="crm-plus-chat-empty">Chat data not available on this page.</div>';
    });
    return;
  }
  
  const containers = dropdown.querySelectorAll('.crm-plus-chat-messages, .crm-plus-chat-channels, .crm-plus-chat-dms');
  containers.forEach(container => {
    container.innerHTML = '<div class="crm-plus-chat-loading">Loading...</div>';
  });
  
  fetchChannelsAndDirectMessages().then(() => {
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
    updateRecentMessages(dropdown);
  }
  
  updateUnreadCounts(dropdown);
}

/**
 * Update the recent messages tab content
 * @param {HTMLElement} dropdown - The chat dropdown element
 */
function updateRecentMessages(dropdown) {
  const messagesContainer = dropdown.querySelector('#crm-plus-chat-recent');
  if (!messagesContainer) return;
  
  const recentMessages = getRecentMessages(10);
  
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
    
    messageElement.addEventListener('click', () => {
      if (message.element) {
        scrollToMessageInDOM(message);
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
    
    if (channel.unreadCount && channel.unreadCount > 0) {
      const unreadBadge = document.createElement('div');
      unreadBadge.className = 'crm-plus-unread-badge';
      unreadBadge.textContent = channel.unreadCount > 9 ? '9+' : channel.unreadCount.toString();
      channelElement.appendChild(unreadBadge);
    }
    
    channelElement.addEventListener('click', () => {
      channelsContainer.querySelectorAll('.crm-plus-chat-channel.active').forEach(el => {
        el.classList.remove('active');
      });
      channelElement.classList.add('active');
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
    
    if (dm.unreadCount && dm.unreadCount > 0) {
      const unreadBadge = document.createElement('div');
      unreadBadge.className = 'crm-plus-unread-badge';
      unreadBadge.textContent = dm.unreadCount > 9 ? '9+' : dm.unreadCount.toString();
      dmElement.appendChild(unreadBadge);
    }
    
    dmElement.addEventListener('click', () => {
      dmsContainer.querySelectorAll('.crm-plus-chat-dm.active').forEach(el => {
        el.classList.remove('active');
      });
      dmElement.classList.add('active');
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
  let conversationView = dropdown.querySelector('#crm-plus-conversation-view');
  if (!conversationView) {
    conversationView = document.createElement('div');
    conversationView.id = 'crm-plus-conversation-view';
    conversationView.className = 'crm-plus-chat-conversations';
    dropdown.appendChild(conversationView);
  }
  
  dropdown.querySelectorAll('.crm-plus-chat-messages, .crm-plus-chat-channels, .crm-plus-chat-dms').forEach(container => {
    container.style.display = 'none';
  });
  
  conversationView.style.display = 'block';
  
  const conversation = getConversationById(id, type);
  if (!conversation) {
    conversationView.innerHTML = '<div class="crm-plus-chat-empty">Conversation not found</div>';
    return;
  }
  
  conversationView.innerHTML = '';
  
  const headerElement = document.createElement('div');
  headerElement.className = 'crm-plus-chat-header';
  
  const backButton = document.createElement('div');
  backButton.className = 'crm-plus-chat-header-action';
  backButton.textContent = '← Back';
  backButton.addEventListener('click', () => {
    conversationView.style.display = 'none';
    if (type === 'channel') {
      dropdown.querySelector('#crm-plus-chat-channels').style.display = 'block';
    } else if (type === 'dm') {
      dropdown.querySelector('#crm-plus-chat-dms').style.display = 'block';
    } else {
      dropdown.querySelector('#crm-plus-chat-recent').style.display = 'block';
    }
  });
  
  const nameElement = document.createElement('div');
  nameElement.textContent = conversation.name || (type === 'channel' ? `#${id}` : 'Direct Message');
  
  headerElement.appendChild(backButton);
  headerElement.appendChild(nameElement);
  conversationView.appendChild(headerElement);
  
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'crm-plus-chat-messages-container';
  
  if (!conversation.messages || conversation.messages.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'crm-plus-chat-empty';
    emptyMessage.textContent = 'No messages yet';
    messagesContainer.appendChild(emptyMessage);
  } else {
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
  // Update unread counts here as needed
}

/**
 * Dummy function to send a chat message.
 * Replace with actual sending logic.
 */
function sendChatMessage(text, conversationId) {
  console.log(`[CRM Extension] Sending message: "${text}" to conversation: ${conversationId}`);
}

/**
 * Dummy helper to get a random color based on a name.
 */
function getRandomColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

/**
 * Dummy helper to get initials from a name.
 */
function getInitials(name) {
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Re-export the scrollToMessage function imported from dom.js
export { scrollToMessageInDOM as scrollToMessage };
