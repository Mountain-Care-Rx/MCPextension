// chat/components/messages/MessageList.js
// Message list component for HIPAA-compliant chat

import { getChannelMessages, getDirectMessages } from '../../utils/storage.js';
import { addMessageListener } from '../../services/messageService.js';
import { getUserById, getCurrentUser } from '../../services/authService.js';
import { logChatEvent } from '../../utils/logger.js';
import { containsPotentialPHI, escapeHtml } from '../../utils/validation.js';

class MessageList {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      channelId: null,
      userId: null,
      maxMessages: 50,
      showTimestamps: true,
      groupMessages: true,
      highlightPHI: true,
      autoScroll: true,
      ...options
    };
    
    this.messageListElement = null;
    this.messages = [];
    this.unsubscribeMessageListener = null;
    this.scrollLock = false;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.loadMessages = this.loadMessages.bind(this);
    this.handleNewMessages = this.handleNewMessages.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the message list
   */
  initialize() {
    // Create container element
    this.messageListElement = document.createElement('div');
    this.messageListElement.className = 'message-list';
    this.applyStyles(this.messageListElement, {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'auto',
      padding: '16px',
      boxSizing: 'border-box'
    });
    
    // Add scroll event listener
    this.messageListElement.addEventListener('scroll', this.handleScroll);
    
    // Add to container
    if (this.container) {
      this.container.appendChild(this.messageListElement);
    }
    
    // Load initial messages
    this.loadMessages();
    
    // Subscribe to message updates
    this.unsubscribeMessageListener = addMessageListener(this.handleNewMessages);
    
    // Log initialization
    logChatEvent('ui', 'Message list component initialized', {
      channelId: this.options.channelId,
      userId: this.options.userId
    });
  }
  
  /**
   * Handle scroll events
   */
  handleScroll() {
    // Check if user has scrolled up
    const { scrollHeight, scrollTop, clientHeight } = this.messageListElement;
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight <= 50;
    
    this.scrollLock = !isScrolledToBottom;
  }
  
  /**
   * Load messages from storage
   */
  loadMessages() {
    // If channelId is provided, get channel messages
    if (this.options.channelId) {
      this.messages = getChannelMessages(
        this.options.channelId, 
        this.options.maxMessages
      );
    }
    // If userId is provided, get direct messages
    else if (this.options.userId) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        this.messages = getDirectMessages(
          currentUser.id,
          this.options.userId,
          this.options.maxMessages
        );
      }
    }
    
    // Render the messages
    this.render();
    
    // Scroll to bottom on initial load
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
  }
  
  /**
   * Update with new messages
   * @param {string} channelId - Channel ID
   */
  updateChannel(channelId) {
    if (this.options.channelId !== channelId) {
      this.options.channelId = channelId;
      this.options.userId = null; // Clear user ID if channel is set
      this.loadMessages();
      
      // Log channel change
      logChatEvent('ui', 'Message list switched to channel', {
        channelId
      });
    }
  }
  
  /**
   * Update with direct messages
   * @param {string} userId - User ID
   */
  updateDirectMessage(userId) {
    if (this.options.userId !== userId) {
      this.options.userId = userId;
      this.options.channelId = null; // Clear channel ID if user is set
      this.loadMessages();
      
      // Log direct message change
      logChatEvent('ui', 'Message list switched to direct messages', {
        userId
      });
    }
  }
  
  /**
   * Handle new messages
   * @param {Array} newMessages - New messages
   */
  handleNewMessages(newMessages) {
    let hasRelevantMessages = false;
    
    // Filter for messages matching current context
    const relevantMessages = newMessages.filter(msg => {
      if (this.options.channelId && msg.channel === this.options.channelId) {
        return true;
      }
      
      if (this.options.userId) {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;
        
        // Check if direct message between these users
        return (msg.sender === currentUser.id && msg.recipient === this.options.userId) ||
               (msg.sender === this.options.userId && msg.recipient === currentUser.id);
      }
      
      return false;
    });
    
    // If we have new messages for this context
    if (relevantMessages.length > 0) {
      // Reload messages from storage (includes the new ones)
      this.loadMessages();
      
      // Scroll to bottom if not scrolled up
      if (this.options.autoScroll && !this.scrollLock) {
        this.scrollToBottom();
      }
      
      hasRelevantMessages = true;
    }
    
    return hasRelevantMessages;
  }
  
  /**
   * Render the message list
   */
  render() {
    if (!this.messageListElement) return;
    
    // Clear existing content
    this.messageListElement.innerHTML = '';
    
    // If no messages, show empty state
    if (this.messages.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-messages';
      this.applyStyles(emptyState, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: '#666'
      });
      
      const emptyIcon = document.createElement('div');
      emptyIcon.innerHTML = '💬';
      this.applyStyles(emptyIcon, {
        fontSize: '48px',
        marginBottom: '16px'
      });
      
      const emptyText = document.createElement('p');
      emptyText.textContent = 'No messages yet.';
      
      emptyState.appendChild(emptyIcon);
      emptyState.appendChild(emptyText);
      this.messageListElement.appendChild(emptyState);
      return;
    }
    
    // Sort messages by timestamp (oldest first)
    const sortedMessages = [...this.messages].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Group messages if enabled
    if (this.options.groupMessages) {
      this.renderGroupedMessages(sortedMessages);
    } else {
      this.renderIndividualMessages(sortedMessages);
    }
  }
  
  /**
   * Render messages grouped by sender and date
   * @param {Array} messages - Messages to render
   */
  renderGroupedMessages(messages) {
    if (!messages.length) return;
    
    // Group messages by date first
    const messagesByDate = this.groupMessagesByDate(messages);
    
    // Render each date group
    Object.keys(messagesByDate).forEach(date => {
      // Add date separator
      const dateHeader = this.createDateSeparator(date);
      this.messageListElement.appendChild(dateHeader);
      
      // Group messages by sender within this date
      let currentSender = null;
      let messageGroup = null;
      
      messagesByDate[date].forEach((message, index) => {
        // If new sender or break in time (>5 min), start new group
        const newGroup = currentSender !== message.sender || 
                         (index > 0 && this.messageTimeDiff(
                           messagesByDate[date][index-1], 
                           message
                         ) > 5);
        
        if (newGroup) {
          // Create new message group
          messageGroup = this.createMessageGroup(message);
          this.messageListElement.appendChild(messageGroup);
          currentSender = message.sender;
        } else {
          // Add to existing group
          this.addMessageToGroup(messageGroup, message);
        }
      });
    });
  }
  
  /**
   * Render individual messages without grouping
   * @param {Array} messages - Messages to render
   */
  renderIndividualMessages(messages) {
    messages.forEach(message => {
      const messageElement = this.createMessageElement(message, false);
      this.messageListElement.appendChild(messageElement);
    });
  }
  
  /**
   * Create a message group element
   * @param {Object} firstMessage - First message in the group
   * @returns {HTMLElement} Message group element
   */
  createMessageGroup(firstMessage) {
    const currentUser = getCurrentUser();
    const isCurrentUser = currentUser && firstMessage.sender === currentUser.username;
    
    const groupElement = document.createElement('div');
    groupElement.className = `message-group ${isCurrentUser ? 'outgoing' : 'incoming'}`;
    this.applyStyles(groupElement, {
      display: 'flex',
      marginBottom: '16px',
      flexDirection: isCurrentUser ? 'row-reverse' : 'row'
    });
    
    // Add avatar
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatar-container';
    this.applyStyles(avatarContainer, {
      width: '36px',
      height: '36px',
      marginRight: isCurrentUser ? '0' : '8px',
      marginLeft: isCurrentUser ? '8px' : '0',
      flexShrink: '0'
    });
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    
    // Get first letter of username
    const initial = firstMessage.sender.charAt(0).toUpperCase();
    avatar.textContent = initial;
    
    // Generate color based on username
    const hue = this.generateColorFromString(firstMessage.sender);
    const bgColor = `hsl(${hue}, 70%, 80%)`;
    const textColor = `hsl(${hue}, 70%, 30%)`;
    
    this.applyStyles(avatar, {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: bgColor,
      color: textColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '16px'
    });
    
    avatarContainer.appendChild(avatar);
    groupElement.appendChild(avatarContainer);
    
    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'messages-container';
    this.applyStyles(messagesContainer, {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '80%'
    });
    
    // Add sender name
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = isCurrentUser ? 'You' : firstMessage.sender;
    this.applyStyles(senderElement, {
      fontWeight: 'bold',
      marginBottom: '4px',
      padding: '0 8px',
      fontSize: '14px',
      color: '#555',
      textAlign: isCurrentUser ? 'right' : 'left'
    });
    
    // Add first message
    const firstMessageElement = this.createBubbleElement(firstMessage, isCurrentUser);
    
    messagesContainer.appendChild(senderElement);
    messagesContainer.appendChild(firstMessageElement);
    
    groupElement.appendChild(messagesContainer);
    
    return groupElement;
  }
  
  /**
   * Add a message to an existing message group
   * @param {HTMLElement} groupElement - Message group element
   * @param {Object} message - Message to add
   */
  addMessageToGroup(groupElement, message) {
    if (!groupElement) return;
    
    const currentUser = getCurrentUser();
    const isCurrentUser = currentUser && message.sender === currentUser.username;
    
    const messagesContainer = groupElement.querySelector('.messages-container');
    if (!messagesContainer) return;
    
    const bubbleElement = this.createBubbleElement(message, isCurrentUser);
    messagesContainer.appendChild(bubbleElement);
  }
  
  /**
   * Create a message bubble element
   * @param {Object} message - Message data
   * @param {boolean} isCurrentUser - Whether message is from current user
   * @returns {HTMLElement} Message bubble element
   */
  createBubbleElement(message, isCurrentUser) {
    const bubbleElement = document.createElement('div');
    bubbleElement.className = `message-bubble ${isCurrentUser ? 'outgoing' : 'incoming'}`;
    this.applyStyles(bubbleElement, {
      padding: '8px 12px',
      backgroundColor: isCurrentUser ? '#e3f2fd' : '#f5f5f5',
      borderRadius: '12px',
      marginBottom: '4px',
      maxWidth: '100%',
      wordWrap: 'break-word',
      position: 'relative',
      alignSelf: isCurrentUser ? 'flex-end' : 'flex-start'
    });
    
    // Set border radius based on position
    if (isCurrentUser) {
      bubbleElement.style.borderBottomRightRadius = '4px';
    } else {
      bubbleElement.style.borderBottomLeftRadius = '4px';
    }
    
    // Message text
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.innerHTML = escapeHtml(message.text);
    
    // Add timestamp if enabled
    if (this.options.showTimestamps) {
      const timeElement = document.createElement('div');
      timeElement.className = 'message-time';
      timeElement.textContent = this.formatTime(new Date(message.timestamp));
      this.applyStyles(timeElement, {
        fontSize: '10px',
        color: '#999',
        marginTop: '2px',
        textAlign: 'right'
      });
      
      bubbleElement.appendChild(messageText);
      bubbleElement.appendChild(timeElement);
    } else {
      bubbleElement.appendChild(messageText);
    }
    
    // Add PHI indicator if needed
    if (this.options.highlightPHI && containsPotentialPHI(message.text)) {
      const phiIndicator = document.createElement('div');
      phiIndicator.className = 'phi-indicator';
      phiIndicator.innerHTML = '🔒 PHI';
      this.applyStyles(phiIndicator, {
        position: 'absolute',
        top: '-6px',
        right: isCurrentUser ? 'auto' : '5px',
        left: isCurrentUser ? '5px' : 'auto',
        backgroundColor: '#ffecb3',
        color: '#bf360c',
        fontSize: '9px',
        padding: '2px 4px',
        borderRadius: '3px',
        fontWeight: 'bold'
      });
      
      bubbleElement.appendChild(phiIndicator);
    }
  }
}

export default MessageList;