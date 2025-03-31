// chat/components/messages/MessageList.js
// Message list component for HIPAA-compliant chat

import { getChannelMessages, getDirectMessages, updateMessage as updateLocalMessage, deleteMessage as deleteLocalMessage } from '../../utils/storage.js';
import {
    addMessageListener,
    addMessageUpdateListener, // Import new listener
    addReadReceiptListener,  // Import new listener
    editMessage,             // Import edit function
    deleteMessage,           // Import delete function
    sendReadReceipt          // Import read receipt function
} from '../../services/messageService.js';
import { getCurrentUser } from '../../services/auth'; // Simplified import
import { hasPermission } from '../../services/auth/permissions.js'; // Import permission checker
import { logChatEvent } from '../../utils/logger.js';
import { containsPotentialPHI, escapeHtml } from '../../utils/validation.js';

class MessageList {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      channelId: null,
      userId: null, // For DMs, this is the *other* user's ID
      maxMessages: 100, // Increased default
      showTimestamps: true,
      groupMessages: true,
      highlightPHI: true,
      autoScroll: true,
      ...options
    };

    this.messageListElement = null;
    this.messages = []; // Holds the message objects currently displayed
    this.unsubscribeMessageListener = null;
    this.unsubscribeUpdateListener = null; // For edits/deletes
    this.unsubscribeReadReceiptListener = null; // For read receipts
    this.scrollLock = false;
    this.currentUser = getCurrentUser(); // Store current user info

    // Bind methods
    this.render = this.render.bind(this);
    this.loadMessages = this.loadMessages.bind(this);
    this.handleNewMessages = this.handleNewMessages.bind(this);
    this.handleMessageUpdate = this.handleMessageUpdate.bind(this); // New handler
    this.handleReadReceiptUpdate = this.handleReadReceiptUpdate.bind(this); // New handler
    this.handleScroll = this.handleScroll.bind(this);
    this.triggerEdit = this.triggerEdit.bind(this); // Edit action handler
    this.triggerDelete = this.triggerDelete.bind(this); // Delete action handler
    this.sendReadReceiptsForVisibleMessages = this.sendReadReceiptsForVisibleMessages.bind(this); // Read receipt trigger

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
      overflowY: 'auto', // Changed to Y only
      overflowX: 'hidden',
      padding: '16px',
      boxSizing: 'border-box',
      position: 'relative' // Needed for absolute positioning of indicators/buttons
    });

    // Add scroll event listener (debounced for performance)
    this.messageListElement.addEventListener('scroll', this.debounce(this.handleScroll, 100));

    // Add to container
    if (this.container) {
      this.container.appendChild(this.messageListElement);
    }

    // Load initial messages
    this.loadMessages();

    // Subscribe to message updates
    this.unsubscribeMessageListener = addMessageListener(this.handleNewMessages);
    this.unsubscribeUpdateListener = addMessageUpdateListener(this.handleMessageUpdate); // Subscribe to updates/deletes
    this.unsubscribeReadReceiptListener = addReadReceiptListener(this.handleReadReceiptUpdate); // Subscribe to read receipts

    // Log initialization
    logChatEvent('ui', 'Message list component initialized', {
      channelId: this.options.channelId,
      userId: this.options.userId
    });
  }

  /**
   * Debounce function
   */
  debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
          const later = () => {
              clearTimeout(timeout);
              func.apply(this, args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
      };
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    // Check if user has scrolled up
    const { scrollHeight, scrollTop, clientHeight } = this.messageListElement;
    // Consider scrolled to bottom if within a small threshold
    const isScrolledToBottom = scrollHeight - scrollTop - clientHeight <= 50;

    this.scrollLock = !isScrolledToBottom;

    // Send read receipts for newly visible messages in DMs
    if (this.options.userId) {
        this.sendReadReceiptsForVisibleMessages();
    }
  }

  /**
   * Load messages from storage
   */
  loadMessages() {
    this.currentUser = getCurrentUser(); // Ensure current user is up-to-date
    if (!this.currentUser) {
        this.messages = [];
        this.render();
        return;
    }

    // If channelId is provided, get channel messages
    if (this.options.channelId) {
      this.messages = getChannelMessages(
        this.options.channelId,
        this.options.maxMessages
      );
    }
    // If userId is provided, get direct messages
    else if (this.options.userId) {
      this.messages = getDirectMessages(
        this.currentUser.id,
        this.options.userId,
        this.options.maxMessages
      );
      // Mark messages as potentially needing read receipts sent
      this.messages.forEach(msg => {
          // Check if sender exists and has id before comparing
          if (msg.sender?.id && msg.sender.id !== this.currentUser.id && !msg.readByCurrentUser) {
              msg.needsReceipt = true;
          }
      });
    } else {
        this.messages = []; // Clear if no context
    }

    // Render the messages
    this.render();

    // Scroll to bottom on initial load or context switch
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }

    // Send read receipts for initially visible messages in DMs
    if (this.options.userId) {
        // Use timeout to ensure rendering is complete before checking visibility
        setTimeout(this.sendReadReceiptsForVisibleMessages, 100);
    }
  }

  /**
   * Update with new channel context
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
   * Update with new direct message context
   * @param {string} userId - The *other* user's ID
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
   * Handle new messages received via WebSocket.
   * @param {Array} newMessages - New messages from the service.
   */
  handleNewMessages(newMessages) {
    let shouldScroll = false;
    let addedMessages = false;

    newMessages.forEach(msg => {
        // Check if message belongs to the current view (channel or DM)
        const isRelevant = (this.options.channelId && msg.channelId === this.options.channelId) ||
                           (this.options.userId && this.currentUser && // Ensure currentUser exists
                            ((msg.sender?.id === this.currentUser.id && msg.recipientId === this.options.userId) ||
                             (msg.sender?.id === this.options.userId && msg.recipientId === this.currentUser.id)));

        if (isRelevant) {
            // Avoid duplicates if message already exists (e.g., from local echo)
            if (!this.messages.some(m => m.id === msg.id)) {
                // Mark DM messages needing receipts
                if (this.options.userId && this.currentUser && msg.sender?.id !== this.currentUser.id) {
                    msg.needsReceipt = true;
                }
                this.messages.push(msg);
                addedMessages = true;
                // If the user sent this message, we definitely want to scroll
                if (this.currentUser && msg.sender?.id === this.currentUser.id) {
                    shouldScroll = true;
                }
            }
        }
    });

    if (addedMessages) {
        // Re-render the list
        this.render();

        // Scroll to bottom if not locked or if user sent the message
        if (this.options.autoScroll && (!this.scrollLock || shouldScroll)) {
            this.scrollToBottom();
        }
        // Send receipts for newly added visible messages
        if (this.options.userId) {
             setTimeout(this.sendReadReceiptsForVisibleMessages, 100); // Delay slightly after render
        }
    }
  }

  /**
   * Handle message updates (edits/deletions) received via WebSocket.
   * @param {Object} updateData - { type: 'update'|'delete', message?, messageId?, channelId?, recipientId? }
   */
  handleMessageUpdate(updateData) {
      const { type, message, messageId } = updateData;
      let messageUpdated = false;

      if (type === 'update' && message) {
          const index = this.messages.findIndex(m => m.id === message.id);
          if (index !== -1) {
              // Update message content and edited status
              this.messages[index].content = message.content;
              this.messages[index].edited_at = message.edited_at;
              messageUpdated = true;
              logChatEvent('ui', 'Message updated in list', { messageId: message.id });
          }
      } else if (type === 'delete' && messageId) {
          const index = this.messages.findIndex(m => m.id === messageId);
          if (index !== -1) {
              this.messages.splice(index, 1);
              messageUpdated = true;
              logChatEvent('ui', 'Message deleted from list', { messageId });
          }
      }

      if (messageUpdated) {
          // Re-render the list to reflect changes
          this.render();
      }
  }

  /**
   * Handle read receipt updates received via WebSocket.
   * @param {Object} receiptData - { messageId, readerId, readAt }
   */
  handleReadReceiptUpdate(receiptData) {
      // Only relevant for DMs where the current user is the sender
      if (!this.options.userId || !this.currentUser) return;

      const messageIndex = this.messages.findIndex(m =>
          m.id === receiptData.messageId &&
          m.sender?.id === this.currentUser.id && // Must be sender
          m.recipientId === this.options.userId // Must be for the current DM partner
      );

      if (messageIndex !== -1) {
          // Mark the message as read by the recipient
          this.messages[messageIndex].readByRecipient = true;
          this.messages[messageIndex].readAt = receiptData.readAt; // Store read time if needed

          // Re-render the specific message bubble to update the indicator
          const messageElement = this.messageListElement.querySelector(`[data-message-id="${receiptData.messageId}"]`);
          if (messageElement) {
              // Find the bubble within the message element/group
              const bubbleElement = messageElement.querySelector('.message-bubble') || messageElement; // Adjust selector if needed
              const indicatorElement = bubbleElement.querySelector('.read-indicator');
              if (indicatorElement) {
                  indicatorElement.className = 'read-indicator read'; // Update class for styling
                  indicatorElement.textContent = '✓✓'; // Example: Double checkmark
                  indicatorElement.style.color = '#4CAF50'; // Update color
              } else {
                  // If indicator wasn't there, re-render the whole list (less efficient)
                  this.render(); // Fallback: re-render list
              }
          } else {
              this.render(); // Fallback: re-render list if element not found
          }
          logChatEvent('ui', 'Read receipt updated for message', { messageId: receiptData.messageId });
      }
  }

  /**
   * Render the message list
   */
  render() {
    if (!this.messageListElement) return;

    // Preserve scroll position if possible
    const { scrollHeight, scrollTop } = this.messageListElement;
    const shouldMaintainScroll = this.scrollLock && scrollTop > 0;
    const scrollOffsetFromBottom = scrollHeight - scrollTop;

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
      emptyState.innerHTML = `<div style="font-size: 48px; margin-bottom: 16px;">💬</div><p>No messages yet.</p>`;
      this.messageListElement.appendChild(emptyState);
      return;
    }

    // Sort messages by timestamp (oldest first) - ensure timestamps are valid Dates
    const sortedMessages = [...this.messages].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
    });

    // Group messages if enabled
    if (this.options.groupMessages) {
      this.renderGroupedMessages(sortedMessages);
    } else {
      this.renderIndividualMessages(sortedMessages);
    }

    // Restore scroll position if needed
    if (shouldMaintainScroll) {
        this.messageListElement.scrollTop = this.messageListElement.scrollHeight - scrollOffsetFromBottom;
    } else if (this.options.autoScroll && !this.scrollLock) {
        // Ensure scroll to bottom if new messages arrived and not locked
        this.scrollToBottom();
    }
  }

  /**
   * Render messages grouped by sender and date
   * @param {Array} messages - Messages to render
   */
  renderGroupedMessages(messages) {
    if (!messages.length) return;

    const messagesByDate = this.groupMessagesByDate(messages);

    Object.keys(messagesByDate).sort().forEach(date => { // Sort dates
      const dateHeader = this.createDateSeparator(date);
      this.messageListElement.appendChild(dateHeader);

      let currentSenderId = null;
      let messageGroup = null;

      messagesByDate[date].forEach((message, index) => {
        const senderId = message.sender?.id; // Use sender ID for grouping
        if (!senderId) return; // Skip messages without sender ID

        const newGroup = currentSenderId !== senderId ||
                         (index > 0 && this.messageTimeDiff(
                           messagesByDate[date][index-1],
                           message
                         ) > 5); // 5 minute threshold

        if (newGroup) {
          messageGroup = this.createMessageGroup(message);
          if (messageGroup) { // Check if group was created successfully
              this.messageListElement.appendChild(messageGroup);
              currentSenderId = senderId;
          }
        } else if (messageGroup) { // Check if messageGroup exists
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
      const messageElement = this.createMessageElement(message, false); // false indicates not part of a group bubble
      if (messageElement) { // Check if element was created
          this.messageListElement.appendChild(messageElement);
      }
    });
  }

  /**
   * Create a message group element
   * @param {Object} firstMessage - First message in the group
   * @returns {HTMLElement|null} Message group element or null if invalid
   */
  createMessageGroup(firstMessage) {
    if (!this.currentUser || !firstMessage.sender?.id) return null; // Need current user and sender ID

    const isCurrentUser = firstMessage.sender.id === this.currentUser.id;
    const senderUsername = firstMessage.sender.username || 'Unknown User';

    const groupElement = document.createElement('div');
    groupElement.className = `message-group ${isCurrentUser ? 'outgoing' : 'incoming'}`;
    groupElement.setAttribute('data-sender-id', firstMessage.sender.id);
    this.applyStyles(groupElement, {
        display: 'flex',
        marginBottom: '16px',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row'
    });

    // Avatar
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
    const initial = senderUsername.charAt(0).toUpperCase();
    avatar.textContent = initial;
    const hue = this.generateColorFromString(senderUsername);
    avatar.style.backgroundColor = `hsl(${hue}, 70%, 80%)`;
    avatar.style.color = `hsl(${hue}, 70%, 30%)`;
    this.applyStyles(avatar, {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '16px'
    });
    avatarContainer.appendChild(avatar);
    groupElement.appendChild(avatarContainer);

    // Messages Container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'messages-container';
    this.applyStyles(messagesContainer, {
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '80%'
    });

    // Sender Name
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = isCurrentUser ? 'You' : senderUsername;
    this.applyStyles(senderElement, {
        fontWeight: 'bold',
        marginBottom: '4px',
        padding: '0 8px',
        fontSize: '14px',
        color: '#555',
        textAlign: isCurrentUser ? 'right' : 'left'
    });
    messagesContainer.appendChild(senderElement);

    // Add first message bubble
    const firstBubble = this.createBubbleElement(firstMessage, isCurrentUser);
    if (firstBubble) { // Check if bubble was created
        messagesContainer.appendChild(firstBubble);
    }

    groupElement.appendChild(messagesContainer);
    return groupElement;
  }

  /**
   * Add a message to an existing message group
   * @param {HTMLElement} groupElement - Message group element
   * @param {Object} message - Message to add
   */
  addMessageToGroup(groupElement, message) {
    if (!groupElement || !message || !this.currentUser) return;

    const isCurrentUser = message.sender?.id === this.currentUser.id;
    const messagesContainer = groupElement.querySelector('.messages-container');
    if (!messagesContainer) return;

    const bubbleElement = this.createBubbleElement(message, isCurrentUser);
    if (bubbleElement) { // Check if bubble was created
        messagesContainer.appendChild(bubbleElement);
    }
  }

  /**
   * Create a single message element (used for non-grouped view)
   * @param {Object} message - Message data
   * @param {boolean} isGrouped - Internal flag, ignore for now
   * @returns {HTMLElement|null} Message element or null if invalid
   */
  createMessageElement(message, isGrouped = false) {
      // This function is similar to createMessageGroup but renders a single message
      // with avatar, sender, and bubble. For simplicity, we'll reuse
      // createBubbleElement within a simplified group structure.
      if (!this.currentUser || !message.sender?.id) return null;

      const isCurrentUser = message.sender.id === this.currentUser.id;
      const senderUsername = message.sender.username || 'Unknown User';

      const messageElement = document.createElement('div');
      // Add data-message-id here for consistency if needed for updates
      messageElement.setAttribute('data-message-id', message.id);
      messageElement.className = `message-item ${isCurrentUser ? 'outgoing' : 'incoming'}`;
      this.applyStyles(messageElement, {
          display: 'flex',
          marginBottom: '8px', // Smaller margin for individual messages
          flexDirection: isCurrentUser ? 'row-reverse' : 'row'
      });

      // Avatar (optional for individual messages, maybe smaller?)
      const avatarContainer = document.createElement('div');
      avatarContainer.className = 'avatar-container';
      this.applyStyles(avatarContainer, { /* ... avatar container styles ... */ });
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      const initial = senderUsername.charAt(0).toUpperCase();
      avatar.textContent = initial;
      const hue = this.generateColorFromString(senderUsername);
      avatar.style.backgroundColor = `hsl(${hue}, 70%, 80%)`;
      avatar.style.color = `hsl(${hue}, 70%, 30%)`;
      this.applyStyles(avatar, { /* ... avatar styles ... */ });
      avatarContainer.appendChild(avatar);
      messageElement.appendChild(avatarContainer);


      // Content Container
      const contentContainer = document.createElement('div');
      this.applyStyles(contentContainer, { maxWidth: '80%' });

      // Sender Name (optional for individual messages)
      const senderElement = document.createElement('div');
      senderElement.className = 'message-sender';
      senderElement.textContent = isCurrentUser ? 'You' : senderUsername;
      this.applyStyles(senderElement, { /* ... sender styles ... */ });
      contentContainer.appendChild(senderElement);


      // Bubble
      const bubble = this.createBubbleElement(message, isCurrentUser);
      if (bubble) { // Check if bubble was created
          contentContainer.appendChild(bubble);
          messageElement.appendChild(contentContainer); // Add content (bubble) to the main element
          return messageElement;
      }
      return null; // Return null if bubble creation failed
  }


  /**
   * Create a message bubble element with content and actions
   * @param {Object} message - Message data
   * @param {boolean} isCurrentUser - Whether message is from current user
   * @returns {HTMLElement|null} Message bubble element or null if invalid
   */
  createBubbleElement(message, isCurrentUser) {
    if (!message || !message.id) return null; // Need message and ID

    const bubbleElement = document.createElement('div');
    bubbleElement.className = `message-bubble ${isCurrentUser ? 'outgoing' : 'incoming'}`;
    // IMPORTANT: Add data-message-id here as well for targeting within groups
    bubbleElement.setAttribute('data-message-id', message.id);
    this.applyStyles(bubbleElement, {
        padding: '8px 12px',
        backgroundColor: isCurrentUser ? '#e3f2fd' : '#f5f5f5',
        borderRadius: '12px',
        marginBottom: '4px',
        maxWidth: '100%',
        wordWrap: 'break-word',
        position: 'relative', // For action buttons and indicators
        alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
        paddingBottom: '20px', // Space for timestamp/indicators
        overflow: 'visible' // Allow actions container to overflow
    });
     // Set border radius based on position
    if (isCurrentUser) {
      bubbleElement.style.borderBottomRightRadius = '4px';
    } else {
      bubbleElement.style.borderBottomLeftRadius = '4px';
    }


    // Message Text
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    const content = message.content || ''; // Ensure content exists
    const highlightedHtml = escapeHtml(content).replace(
        /@([a-zA-Z0-9_-]+)/g,
        '<span class="mention" style="background-color: #cfe2ff; color: #052c65; border-radius: 3px; padding: 1px 3px; font-weight: bold;">@$1</span>' // Basic mention style
    );
    messageText.innerHTML = highlightedHtml;
    bubbleElement.appendChild(messageText);

    // Timestamp and Status Container
    const statusContainer = document.createElement('div');
    statusContainer.className = 'message-status-container';
    this.applyStyles(statusContainer, {
        position: 'absolute',
        bottom: '4px',
        right: isCurrentUser ? '8px' : 'auto', // Position based on sender
        left: isCurrentUser ? 'auto' : '8px',
        fontSize: '10px',
        color: '#888',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    });

    // Edited Indicator
    if (message.edited_at) {
        const editedIndicator = document.createElement('span');
        editedIndicator.className = 'edited-indicator';
        editedIndicator.textContent = '(Edited)';
        this.applyStyles(editedIndicator, { fontStyle: 'italic' });
        statusContainer.appendChild(editedIndicator);
    }

    // Timestamp
    if (this.options.showTimestamps && message.timestamp) {
      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      timeElement.textContent = this.formatTime(new Date(message.timestamp));
      statusContainer.appendChild(timeElement);
    }

    // Read Receipt Indicator (for outgoing DMs)
    const isDM = !!this.options.userId;
    if (isCurrentUser && isDM) {
        const readIndicator = document.createElement('span');
        // Use message.id in class for specific targeting if needed
        readIndicator.className = `read-indicator ${message.readByRecipient ? 'read' : 'sent'}`;
        readIndicator.textContent = message.readByRecipient ? '✓✓' : '✓'; // Double/single check
        this.applyStyles(readIndicator, { fontWeight: 'bold', color: message.readByRecipient ? '#4CAF50' : '#aaa' });
        statusContainer.appendChild(readIndicator);
    }

    bubbleElement.appendChild(statusContainer);

    // Action Buttons (Edit/Delete) - Show on hover maybe?
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'message-actions';
    this.applyStyles(actionsContainer, {
        position: 'absolute',
        top: '-10px', // Position above the bubble slightly
        right: isCurrentUser ? '5px' : 'auto',
        left: isCurrentUser ? 'auto' : '5px',
        display: 'flex',
        gap: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px',
        padding: '2px 4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        opacity: '0', // Hidden by default
        transition: 'opacity 0.2s ease-in-out',
        zIndex: '1'
    });


    bubbleElement.addEventListener('mouseenter', () => actionsContainer.style.opacity = '1');
    bubbleElement.addEventListener('mouseleave', () => actionsContainer.style.opacity = '0');

    // --- Permission Checks ---
    let canEdit = false;
    let canDelete = false;

    if (this.currentUser) {
        // Edit: Only sender can edit
        if (message.sender?.id === this.currentUser.id) {
            canEdit = true;
        }

        // Delete: Sender in DMs, Admin in channels
        if (isDM && message.sender?.id === this.currentUser.id) {
            canDelete = true;
        } else if (!isDM && hasPermission(this.currentUser.permissions, 'message:delete:any')) {
            canDelete = true;
        }
    }
    // --- End Permission Checks ---


    if (canEdit) {
        const editButton = this.createActionButton('✏️', 'Edit Message', () => this.triggerEdit(message.id, message.content));
        actionsContainer.appendChild(editButton);
    }
    if (canDelete) {
        const deleteButton = this.createActionButton('🗑️', 'Delete Message', () => this.triggerDelete(message.id));
        actionsContainer.appendChild(deleteButton);
    }

    if (actionsContainer.hasChildNodes()) {
        bubbleElement.appendChild(actionsContainer);
    }

    // PHI Indicator (adjust positioning if needed)
    if (this.options.highlightPHI && containsPotentialPHI(content)) {
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

    return bubbleElement;
  }

  /**
   * Helper to create action buttons.
   */
  createActionButton(icon, title, onClick) {
      const button = document.createElement('button');
      button.innerHTML = icon;
      button.title = title;
      this.applyStyles(button, {
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '2px'
      });
      button.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent triggering other bubble events
          onClick();
      });
      return button;
  }

  /**
   * Trigger the edit process for a message.
   */
  triggerEdit(messageId, currentContent) {
      const newContent = prompt('Edit message:', currentContent);
      if (newContent !== null && newContent.trim() !== '' && newContent !== currentContent) {
          editMessage(messageId, newContent.trim());
      }
  }

  /**
   * Trigger the delete process for a message.
   */
  triggerDelete(messageId) {
      if (confirm('Are you sure you want to delete this message?')) {
          deleteMessage(messageId);
      }
  }

  /**
   * Send read receipts for messages currently visible in the viewport (for DMs).
   */
  sendReadReceiptsForVisibleMessages() {
      if (!this.options.userId || !this.messageListElement || !this.currentUser) return; // Only for DMs

      const listBounds = this.messageListElement.getBoundingClientRect();
      // Query within the message list element for bubbles
      const messageBubbles = this.messageListElement.querySelectorAll('.message-bubble[data-message-id]');

      messageBubbles.forEach(el => {
          const messageId = el.getAttribute('data-message-id');
          const message = this.messages.find(m => m.id === messageId);

          // Check if message exists, needs receipt, and is visible
          // Ensure sender exists and is not the current user
          if (message && message.needsReceipt && message.sender?.id !== this.currentUser.id) {
              const elBounds = el.getBoundingClientRect();
              // Check if element is at least partially visible within the list container
              const isVisible = elBounds.top < listBounds.bottom && elBounds.bottom > listBounds.top;

              if (isVisible) {
                  sendReadReceipt(messageId);
                  message.needsReceipt = false; // Mark as receipt sent/pending
                  // No immediate UI update needed here, wait for server confirmation ('read_receipt_update')
                  logChatEvent('ui', 'Sent read receipt for visible message', { messageId });
              }
          }
      });
  }


  /**
   * Format time for display
   * @param {Date} date - Date object
   * @returns {string} Formatted time
   */
  formatTime(date) {
    // ... (formatTime implementation as before) ...
    if (!date || isNaN(date.getTime())) {
      return '';
    }
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  /**
   * Calculate time difference between messages in minutes
   * @param {Object} message1 - First message
   * @param {Object} message2 - Second message
   * @returns {number} Time difference in minutes
   */
  messageTimeDiff(message1, message2) {
    // ... (messageTimeDiff implementation as before) ...
    const time1 = message1?.timestamp ? new Date(message1.timestamp).getTime() : 0;
    const time2 = message2?.timestamp ? new Date(message2.timestamp).getTime() : 0;
    if (time1 === 0 || time2 === 0) return Infinity; // Handle invalid timestamps
    return Math.abs(time2 - time1) / (60 * 1000);
  }

  /**
   * Group messages by date
   * @param {Array} messages - Messages to group
   * @returns {Object} Messages grouped by date
   */
  groupMessagesByDate(messages) {
    // ... (groupMessagesByDate implementation as before) ...
    const groups = {};
    messages.forEach(message => {
      if (!message?.timestamp) return; // Skip messages without timestamp
      const date = new Date(message.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    return groups;
  }

  /**
   * Create a date separator
   * @param {string} dateString - Date string (YYYY-MM-DD)
   * @returns {HTMLElement} Date separator element
   */
  createDateSeparator(dateString) {
    // ... (createDateSeparator implementation as before) ...
    const separator = document.createElement('div');
    separator.className = 'date-separator';
    this.applyStyles(separator, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '16px 0',
        position: 'relative'
    });
    const line = document.createElement('div');
    this.applyStyles(line, {
        width: '100%',
        height: '1px',
        backgroundColor: '#e0e0e0'
    });
    const dateLabel = document.createElement('div');
    dateLabel.className = 'date-label';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let dateText;
    if (date.toDateString() === today.toDateString()) dateText = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) dateText = 'Yesterday';
    else dateText = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    dateLabel.textContent = dateText;
    this.applyStyles(dateLabel, {
        backgroundColor: '#fff',
        padding: '0 10px',
        fontSize: '12px',
        color: '#888',
        position: 'absolute'
    });
    separator.appendChild(line);
    separator.appendChild(dateLabel);
    return separator;
  }

  /**
   * Scroll to the bottom of the message list
   */
  scrollToBottom() {
    if (this.messageListElement) {
      // Use requestAnimationFrame for smoother scrolling after render
      requestAnimationFrame(() => {
          this.messageListElement.scrollTop = this.messageListElement.scrollHeight;
          this.scrollLock = false; // Ensure scroll lock is off after auto-scroll
      });
    }
  }

  /**
   * Generate a color from a string (for user avatars)
   * @param {string} str - Input string
   * @returns {number} Hue value (0-360)
   */
  generateColorFromString(str = '') { // Add default value
    // ... (generateColorFromString implementation as before) ...
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360); // Ensure positive hue
  }

  /**
   * Apply CSS styles to an element
   * @param {HTMLElement} element - Element to style
   * @param {Object} styles - Styles to apply
   */
  applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Remove event listeners
    if (this.messageListElement) {
      // Need to store the debounced function reference to remove it correctly
      // Or simply don't remove it if the element itself is being destroyed.
      // this.messageListElement.removeEventListener('scroll', this.debouncedHandleScroll);
    }

    // Unsubscribe from message updates
    if (this.unsubscribeMessageListener) this.unsubscribeMessageListener();
    if (this.unsubscribeUpdateListener) this.unsubscribeUpdateListener(); // Unsubscribe
    if (this.unsubscribeReadReceiptListener) this.unsubscribeReadReceiptListener(); // Unsubscribe

    // Remove from DOM
    if (this.messageListElement && this.messageListElement.parentNode) {
      this.messageListElement.parentNode.removeChild(this.messageListElement);
    }

    // Log destruction
    logChatEvent('ui', 'Message list component destroyed');
  }
}

export default MessageList;