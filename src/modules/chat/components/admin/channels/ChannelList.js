// components/messages/ChannelList.js
// Component to display the list of channels

import { getAvailableChannels, joinChannel } from '../../services/channel/channelService';
import { logChatEvent } from '../../utils/logger';

/**
 * Channel List Component
 * Displays a list of available channels
 */
class ChannelList {
  /**
   * Create a new ChannelList
   * @param {Object} options - Configuration options
   * @param {Array} options.channels - List of channels to display
   * @param {string} options.selectedChannel - Currently selected channel
   * @param {Function} options.onChannelSelect - Channel selection callback
   * @param {string} options.connectionStatus - Current connection status
   */
  constructor(options = {}) {
    this.options = {
      channels: [],
      selectedChannel: 'general',
      onChannelSelect: () => {},
      connectionStatus: 'disconnected',
      ...options
    };
    
    // State
    this.channels = this.options.channels || [];
    this.isLoading = false;
    
    // DOM elements
    this.element = null;
    this.channelList = null;
    this.loadingIndicator = null;
    this.errorMessage = null;
    
    // Bind methods
    this.render = this.render.bind(this);
    this.renderChannelItem = this.renderChannelItem.bind(this);
    this.handleChannelClick = this.handleChannelClick.bind(this);
    this.refreshChannels = this.refreshChannels.bind(this);
  }
  
  /**
   * Render the channel list component
   * @returns {HTMLElement} Channel list element
   */
  render() {
    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'channel-list-container';
    this.applyStyles(this.element, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderRight: '1px solid #e1e4e8',
      backgroundColor: '#f7f9fb'
    });
    
    // Create header
    const header = document.createElement('div');
    header.className = 'channel-list-header';
    this.applyStyles(header, {
      padding: '16px',
      borderBottom: '1px solid #e1e4e8',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    });
    
    // Header title
    const title = document.createElement('h2');
    title.textContent = 'Channels';
    this.applyStyles(title, {
      margin: '0',
      fontSize: '16px',
      fontWeight: 'bold'
    });
    
    // Channel count
    const count = document.createElement('span');
    count.className = 'channel-count';
    count.textContent = this.channels.length;
    this.applyStyles(count, {
      display: 'inline-block',
      background: '#e1e4e8',
      color: '#586069',
      fontSize: '12px',
      fontWeight: 'bold',
      padding: '2px 6px',
      borderRadius: '10px',
      marginLeft: '5px'
    });
    
    // Refresh button
    const refreshButton = document.createElement('button');
    refreshButton.title = 'Refresh Channels';
    refreshButton.innerHTML = '↻';
    this.applyStyles(refreshButton, {
      background: 'transparent',
      border: 'none',
      color: '#586069',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '4px',
      borderRadius: '4px'
    });
    
    refreshButton.addEventListener('click', this.refreshChannels);
    
    // Add elements to header
    title.appendChild(count);
    header.appendChild(title);
    header.appendChild(refreshButton);
    this.element.appendChild(header);
    
    // Create the actual channel list
    this.channelList = document.createElement('div');
    this.channelList.className = 'channels';
    this.applyStyles(this.channelList, {
      flex: '1',
      overflowY: 'auto',
      padding: '8px 0'
    });
    
    // Create loading indicator
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.className = 'loading-indicator';
    this.loadingIndicator.textContent = 'Loading channels...';
    this.applyStyles(this.loadingIndicator, {
      padding: '16px',
      textAlign: 'center',
      color: '#586069',
      display: this.isLoading ? 'block' : 'none'
    });
    
    // Create error message
    this.errorMessage = document.createElement('div');
    this.errorMessage.className = 'error-message';
    this.applyStyles(this.errorMessage, {
      padding: '16px',
      textAlign: 'center',
      color: '#cb2431',
      display: 'none'
    });
    
    // Add loading indicator and error message to the list container
    this.element.appendChild(this.loadingIndicator);
    this.element.appendChild(this.errorMessage);
    
    // Render channels
    if (this.channels && this.channels.length > 0) {
      this.channels.forEach(channel => {
        const channelItem = this.renderChannelItem(channel);
        this.channelList.appendChild(channelItem);
      });
    } else if (!this.isLoading) {
      // Show no channels message when not loading
      const noChannels = document.createElement('div');
      noChannels.className = 'no-channels';
      noChannels.textContent = this.options.connectionStatus === 'connected' ? 
                              'No channels available' : 
                              'Channels will appear when connected';
      this.applyStyles(noChannels, {
        padding: '16px',
        textAlign: 'center',
        color: '#586069',
        fontStyle: 'italic'
      });
      this.channelList.appendChild(noChannels);
    }
    
    // Add channel list to container
    this.element.appendChild(this.channelList);
    
    // Create "New Channel" button for admins
    // TODO: Check if user has admin permissions
    const currentUser = window.hipaaChat && window.hipaaChat.currentUser;
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (isAdmin) {
      const newChannelButton = document.createElement('button');
      newChannelButton.className = 'new-channel-button';
      newChannelButton.textContent = 'New Channel';
      this.applyStyles(newChannelButton, {
        margin: '16px',
        padding: '8px 16px',
        backgroundColor: '#0366d6',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        textAlign: 'center'
      });
      
      newChannelButton.addEventListener('click', () => {
        if (typeof this.options.onNewChannel === 'function') {
          this.options.onNewChannel();
        } else {
          // Fallback if no handler provided
          console.log('Create new channel clicked, but no handler provided');
          alert('Create new channel functionality coming soon!');
        }
      });
      
      this.element.appendChild(newChannelButton);
    }
    
    return this.element;
  }
  
  /**
   * Render a single channel item
   * @param {Object} channel - Channel data
   * @returns {HTMLElement} Channel item element
   */
  renderChannelItem(channel) {
    // Handle both formats: full channel object or just channel ID
    const channelId = typeof channel === 'string' ? channel : channel.id;
    const channelName = typeof channel === 'string' ? channel : (channel.name || channelId);
    const channelDescription = typeof channel === 'string' ? '' : (channel.description || '');
    const isPrivate = typeof channel === 'string' ? false : !!channel.isPrivate;
    
    // Create item container
    const item = document.createElement('div');
    item.className = 'channel-item';
    item.dataset.channelId = channelId;
    
    // Determine if this is the selected channel
    const isSelected = this.options.selectedChannel === channelId;
    
    this.applyStyles(item, {
      padding: '10px 16px',
      borderLeft: isSelected ? '3px solid #0366d6' : '3px solid transparent',
      backgroundColor: isSelected ? 'rgba(3, 102, 214, 0.08)' : 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    });
    
    // Add hover effect
    item.addEventListener('mouseover', () => {
      if (!isSelected) {
        item.style.backgroundColor = 'rgba(3, 102, 214, 0.04)';
      }
    });
    
    item.addEventListener('mouseout', () => {
      if (!isSelected) {
        item.style.backgroundColor = 'transparent';
      }
    });
    
    // Channel icon based on public/private status
    const icon = document.createElement('span');
    icon.textContent = isPrivate ? '🔒' : '#';
    this.applyStyles(icon, {
      fontWeight: isPrivate ? 'normal' : 'bold',
      color: isSelected ? '#0366d6' : '#586069',
      width: '20px',
      textAlign: 'center'
    });
    
    // Channel name
    const name = document.createElement('span');
    name.className = 'channel-name';
    name.textContent = channelName;
    this.applyStyles(name, {
      flex: '1',
      fontWeight: isSelected ? 'bold' : 'normal',
      color: isSelected ? '#0366d6' : '#24292e',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    });
    
    // Unread indicator (placeholder for future functionality)
    // This would typically show the count of unread messages
    // const unread = document.createElement('span');
    // unread.className = 'unread-count';
    // this.applyStyles(unread, {
    //   display: 'none', // Hide for now
    //   backgroundColor: '#0366d6',
    //   color: 'white',
    //   borderRadius: '10px',
    //   padding: '0 6px',
    //   fontSize: '12px',
    //   fontWeight: 'bold'
    // });
    
    // Add channel elements
    item.appendChild(icon);
    item.appendChild(name);
    // item.appendChild(unread);
    
    // Add tooltip with description if available
    if (channelDescription) {
      item.title = channelDescription;
    }
    
    // Add click handler
    item.addEventListener('click', () => this.handleChannelClick(channel));
    
    return item;
  }
  
  /**
   * Handle channel click
   * @param {Object|string} channel - Channel that was clicked
   */
  handleChannelClick(channel) {
    // Get channel ID
    const channelId = typeof channel === 'string' ? channel : channel.id;
    
    // Don't do anything if already selected
    if (this.options.selectedChannel === channelId) {
      return;
    }
    
    // Check connection status
    if (this.options.connectionStatus !== 'connected') {
      console.warn('Cannot join channel when not connected');
      // Show a notification to the user
      const event = new CustomEvent('show_notification', {
        detail: {
          type: 'error',
          message: 'Cannot join channel when not connected to server'
        }
      });
      window.dispatchEvent(event);
      return;
    }
    
    console.log(`[ChannelList] Channel clicked: ${channelId}`);
    
    // Attempt to join the channel via WebSocket
    joinChannel(channelId)
      .then(success => {
        if (success) {
          // Call the selection callback
          if (typeof this.options.onChannelSelect === 'function') {
            this.options.onChannelSelect(channel);
          }
          
          // Log channel selection
          logChatEvent('chat', 'Selected channel', { channelId });
          
          // Update selected channel highlight in UI
          this.updateSelectedChannel(channelId);
        } else {
          console.warn(`[ChannelList] Failed to join channel: ${channelId}`);
          
          // Show failure notification
          const event = new CustomEvent('show_notification', {
            detail: {
              type: 'error',
              message: 'Failed to join channel. Please try again.'
            }
          });
          window.dispatchEvent(event);
        }
      })
      .catch(error => {
        console.error('[ChannelList] Error joining channel:', error);
        
        // Show error notification
        const event = new CustomEvent('show_notification', {
          detail: {
            type: 'error',
            message: `Error joining channel: ${error.message}`
          }
        });
        window.dispatchEvent(event);
      });
  }
  
  /**
   * Update selected channel in UI
   * @param {string} channelId - Selected channel ID
   */
  updateSelectedChannel(channelId) {
    if (!this.channelList) return;
    
    // Update local state
    this.options.selectedChannel = channelId;
    
    // Update UI
    const items = this.channelList.querySelectorAll('.channel-item');
    
    items.forEach(item => {
      if (item.dataset.channelId === channelId) {
        // Selected channel
        this.applyStyles(item, {
          borderLeft: '3px solid #0366d6',
          backgroundColor: 'rgba(3, 102, 214, 0.08)'
        });
        
        // Update text color
        const nameElement = item.querySelector('.channel-name');
        if (nameElement) {
          this.applyStyles(nameElement, {
            fontWeight: 'bold',
            color: '#0366d6'
          });
        }
        
        const iconElement = item.firstChild;
        if (iconElement) {
          this.applyStyles(iconElement, {
            color: '#0366d6'
          });
        }
      } else {
        // Unselected channels
        this.applyStyles(item, {
          borderLeft: '3px solid transparent',
          backgroundColor: 'transparent'
        });
        
        // Update text color
        const nameElement = item.querySelector('.channel-name');
        if (nameElement) {
          this.applyStyles(nameElement, {
            fontWeight: 'normal',
            color: '#24292e'
          });
        }
        
        const iconElement = item.firstChild;
        if (iconElement) {
          this.applyStyles(iconElement, {
            color: '#586069'
          });
        }
      }
    });
  }
  
  /**
   * Refresh channel list from server
   */
  async refreshChannels() {
    if (this.isLoading) return;
    
    // Check connection status
    if (this.options.connectionStatus !== 'connected') {
      console.warn('[ChannelList] Cannot refresh channels when not connected');
      
      // Show error message
      if (this.errorMessage) {
        this.errorMessage.textContent = 'Cannot refresh channels when not connected to server';
        this.errorMessage.style.display = 'block';
      }
      
      // Show notification
      const event = new CustomEvent('show_notification', {
        detail: {
          type: 'error',
          message: 'Cannot refresh channels when not connected to server'
        }
      });
      window.dispatchEvent(event);
      
      return;
    }
    
    try {
      // Show loading state
      this.isLoading = true;
      
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'block';
      }
      
      if (this.errorMessage) {
        this.errorMessage.style.display = 'none';
      }
      
      // Fetch channels
      const channels = await getAvailableChannels();
      
      // Update state
      this.channels = channels;
      
      // Update UI if needed
      if (this.channelList) {
        // Clear existing channels
        this.channelList.innerHTML = '';
        
        // Render channels
        if (channels && channels.length > 0) {
          channels.forEach(channel => {
            const channelItem = this.renderChannelItem(channel);
            this.channelList.appendChild(channelItem);
          });
        } else {
          // Show no channels message
          const noChannels = document.createElement('div');
          noChannels.className = 'no-channels';
          noChannels.textContent = 'No channels available';
          this.applyStyles(noChannels, {
            padding: '16px',
            textAlign: 'center',
            color: '#586069',
            fontStyle: 'italic'
          });
          this.channelList.appendChild(noChannels);
        }
        
        // Update channel count in header
        const countElement = this.element.querySelector('.channel-count');
        if (countElement) {
          countElement.textContent = channels.length;
        }
      }
      
      // Log channel refresh
      logChatEvent('chat', 'Refreshed channel list', { 
        count: channels.length
      });
    } catch (error) {
      console.error('[ChannelList] Error refreshing channels:', error);
      
      // Show error message
      if (this.errorMessage) {
        this.errorMessage.textContent = `Error refreshing channels: ${error.message}`;
        this.errorMessage.style.display = 'block';
      }
      
      // Show notification
      const event = new CustomEvent('show_notification', {
        detail: {
          type: 'error',
          message: `Error refreshing channels: ${error.message}`
        }
      });
      window.dispatchEvent(event);
      
      // Log error
      logChatEvent('error', 'Channel refresh failed', { 
        error: error.message
      });
    } finally {
      // Reset loading state
      this.isLoading = false;
      
      if (this.loadingIndicator) {
        this.loadingIndicator.style.display = 'none';
      }
    }
  }
  
  /**
   * Update the component with new options
   * @param {Object} newOptions - New options to apply
   */
  update(newOptions = {}) {
    // Update options
    this.options = {
      ...this.options,
      ...newOptions
    };
    
    // Update channels if provided
    if (newOptions.channels) {
      this.channels = newOptions.channels;
    }
    
    // Update selected channel if needed
    if (newOptions.selectedChannel && 
        this.channelList && 
        newOptions.selectedChannel !== this.options.selectedChannel) {
      this.updateSelectedChannel(newOptions.selectedChannel);
    }
  }
  
  /**
   * Apply CSS styles to an element
   * @param {HTMLElement} element - Element to style
   * @param {Object} styles - Styles to apply
   */
  applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }
}

export default ChannelList;