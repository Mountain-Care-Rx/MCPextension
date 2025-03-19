/**
 * modules/chat/platformIntegration.js
 */

import { setChannels, setDirectMessages } from './storage.js';
import { showToast } from './ui.js';

/**
 * Fetch channels and direct messages from the platform
 * @returns {Promise} A promise that resolves when data is fetched
 */
export async function fetchChannelsAndDirectMessages() {
  try {
    const platform = detectChatPlatform();
    
    let channels = [];
    let directMessages = [];
    
    switch(platform) {
      case 'gohighlevel':
      case 'commsmessenger':
        const ghlData = await fetchGoHighLevelData();
        channels = ghlData.channels;
        directMessages = ghlData.directMessages;
        break;
      case 'discord':
        const discordData = await fetchDiscordData();
        channels = discordData.channels;
        directMessages = discordData.directMessages;
        break;
      case 'slack':
        const slackData = await fetchSlackData();
        channels = slackData.channels;
        directMessages = slackData.directMessages;
        break;
      case 'mtncare-internal':
        const internalData = await fetchInternalChatData();
        channels = internalData.channels;
        directMessages = internalData.directMessages;
        break;
      default:
        channels = scrapeChannelsFromDOM();
        directMessages = scrapeDirectMessagesFromDOM();
    }
    
    setChannels(channels);
    setDirectMessages(directMessages);
    
    console.log(`[CRM Extension] Fetched ${channels.length} channels and ${directMessages.length} DMs from ${platform} platform`);
    
    return { channels, directMessages };
  } catch (error) {
    console.error('[CRM Extension] Error fetching channels and DMs:', error);
    showToast('Error loading chat data');
    setChannels([]);
    setDirectMessages([]);
    throw error;
  }
}

/**
 * Detect what chat platform is being used
 * @returns {string} The detected platform name
 */
function detectChatPlatform() {
  if (window.location.hostname.includes('gohighlevel.com') || 
      document.querySelector('[data-ghl]') ||
      document.querySelector('.ghl-messenger')) {
    console.log('[CRM Extension] Detected GoHighLevel platform');
    return 'gohighlevel';
  }
  
  if (document.querySelector('#commsmessenger-app') ||
      document.querySelector('[data-app-id="commsmessenger"]') ||
      document.querySelector('.commsmessenger-container') ||
      findCOMMSMESSENGERIframe()) {
    console.log('[CRM Extension] Detected COMMSMESSENGER app');
    return 'commsmessenger';
  }
  
  if (window.location.hostname.includes('discord.com') || 
      document.querySelector('[data-app-id="discord"]') || 
      document.querySelector('[class*="discord"]')) {
    return 'discord';
  }
  
  if (window.location.hostname.includes('slack.com') || 
      document.querySelector('[data-slack]') || 
      document.querySelector('[class*="slack"]')) {
    return 'slack';
  }
  
  if (window.location.hostname.includes('mtncarerx.com') || 
      document.querySelector('[data-mtncare]')) {
    return 'mtncare-internal';
  }
  
  console.log('[CRM Extension] Using generic platform detection');
  return 'unknown';
}

/**
 * Find COMMSMESSENGER iframe if it exists
 * @returns {HTMLElement|null} The iframe element or null
 */
function findCOMMSMESSENGERIframe() {
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      if (iframe.src && iframe.src.toLowerCase().includes('commsmessenger')) {
        console.log('[CRM Extension] Found COMMSMESSENGER iframe by src');
        return iframe;
      }
      if (iframe.getAttribute('data-app') === 'commsmessenger' || 
          iframe.id === 'commsmessenger-iframe') {
        console.log('[CRM Extension] Found COMMSMESSENGER iframe by attributes');
        return iframe;
      }
    } catch (e) {
      // Skip iframe if access error (cross-origin)
    }
  }
  return null;
}

/**
 * Fetch channels and DMs from GoHighLevel/COMMSMESSENGER
 * @returns {Promise<Object>} Object with channels and directMessages arrays
 */
async function fetchGoHighLevelData() {
  // Only fetch if on the actual chat page
  if (!window.location.href.includes('/custom-menu-link/')) {
    console.warn('[CRM Extension] Not on chat page, skipping GoHighLevel data fetch.');
    return { channels: [], directMessages: [] };
  }
  
  try {
    console.log('[CRM Extension] Fetching data from GoHighLevel/COMMSMESSENGER');
    
    const messengerContainer = document.querySelector('#commsmessenger-app, .commsmessenger-container, [data-app="commsmessenger"]');
    
    if (messengerContainer) {
      console.log('[CRM Extension] Found COMMSMESSENGER container element');
      const isInIframe = messengerContainer.tagName === 'IFRAME';
      
      if (isInIframe) {
        console.log('[CRM Extension] COMMSMESSENGER is in an iframe');
        try {
          const iframeDocument = messengerContainer.contentDocument || messengerContainer.contentWindow.document;
          const channels = scrapeGoHighLevelChannels(iframeDocument);
          const directMessages = scrapeGoHighLevelDMs(iframeDocument);
          return { channels, directMessages };
        } catch (iframeError) {
          console.error('[CRM Extension] Cannot access iframe contents due to cross-origin restrictions:', iframeError);
        }
      } else {
        const channels = scrapeGoHighLevelChannels(messengerContainer);
        const directMessages = scrapeGoHighLevelDMs(messengerContainer);
        return { channels, directMessages };
      }
    }
    
    const messengerIframe = findCOMMSMESSENGERIframe();
    if (messengerIframe) {
      console.log('[CRM Extension] Using standalone COMMSMESSENGER iframe');
      try {
        const iframeDocument = messengerIframe.contentDocument || messengerIframe.contentWindow.document;
        const channels = scrapeGoHighLevelChannels(iframeDocument);
        const directMessages = scrapeGoHighLevelDMs(iframeDocument);
        return { channels, directMessages };
      } catch (iframeError) {
        console.error('[CRM Extension] Cannot access iframe contents due to cross-origin restrictions:', iframeError);
      }
    }
    
    console.log('[CRM Extension] Falling back to generic GoHighLevel scraping');
    return {
      channels: scrapeGoHighLevelChannels(document),
      directMessages: scrapeGoHighLevelDMs(document)
    };
  } catch (error) {
    console.error('[CRM Extension] Error fetching GoHighLevel data:', error);
    return { channels: [], directMessages: [] };
  }
}

/**
 * GoHighLevel-specific channel scraping
 * @param {Document|Element} container - The container to search within
 * @returns {Array} Array of channel objects
 */
function scrapeGoHighLevelChannels(container) {
  try {
    console.log('[CRM Extension] Scraping GoHighLevel channels');
    
    const channelSelectors = [
      '.channel-list .channel',
      '.channel-sidebar .channel',
      '.channel-item',
      '[data-type="channel"]',
      '.channels-list li',
      'ul li:has(svg)',
      'li a[href*="channel"]',
      'div[class*="channel"]'
    ];
    
    let channelElements = [];
    
    for (const selector of channelSelectors) {
      try {
        const elements = container.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          channelElements = Array.from(elements);
          console.log(`[CRM Extension] Found ${channelElements.length} channels with selector: ${selector}`);
          break;
        }
      } catch (selectorError) {
        // Continue to next selector
      }
    }
    
    if (channelElements.length === 0) {
      const allListItems = container.querySelectorAll('li');
      channelElements = Array.from(allListItems).filter(li => {
        const text = li.textContent.trim();
        return (text.includes('#') || 
                li.querySelector('svg') || 
                li.classList.contains('channel') ||
                li.parentElement?.classList.contains('channels')) &&
                !text.includes('@');
      });
      console.log(`[CRM Extension] Found ${channelElements.length} channels using general approach`);
    }
    
    const channels = channelElements.map((element, index) => {
      let name = '';
      const nameElement = element.querySelector('.channel-name, .name');
      if (nameElement) {
        name = nameElement.textContent.trim();
      } else {
        name = element.textContent.trim();
      }
      name = name.replace(/^#\s*/, '').trim();
      const id = element.getAttribute('data-channel-id') || 
                element.getAttribute('data-id') || 
                element.getAttribute('href')?.split('/').pop() || 
                `ghl-channel-${index}`;
      const unreadBadge = element.querySelector('.badge, .unread-count, .unread-badge');
      const hasUnreadIndicator = element.querySelector('.unread, .unread-indicator, [class*="unread"]') !== null;
      let unreadCount = 0;
      if (unreadBadge) {
        const badgeText = unreadBadge.textContent.trim();
        unreadCount = parseInt(badgeText, 10) || 1;
      } else if (hasUnreadIndicator) {
        unreadCount = 1;
      }
      return {
        id,
        name,
        type: 'channel',
        unreadCount
      };
    });
    
    return channels.filter(channel => 
      channel.name && 
      channel.name.length > 0 && 
      !channel.name.includes('@') &&
      !channel.name.includes('…') &&
      channel.name.length < 30
    );
  } catch (error) {
    console.error('[CRM Extension] Error scraping GoHighLevel channels:', error);
    return [];
  }
}

/**
 * GoHighLevel-specific DM scraping
 * @param {Document|Element} container - The container to search within
 * @returns {Array} Array of DM objects
 */
function scrapeGoHighLevelDMs(container) {
  try {
    console.log('[CRM Extension] Scraping GoHighLevel DMs');
    
    const dmSelectors = [
      '.contact-list .contact', 
      '.dm-list .contact',
      '.user-item',
      '.direct-message-item',
      '[data-type="dm"]',
      '[data-type="direct-message"]',
      '.dm-list li',
      'div[class*="user-list"] li',
      'li:has(img)',
      'div[class*="avatar"]'
    ];
    
    let dmElements = [];
    
    for (const selector of dmSelectors) {
      try {
        const elements = container.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          dmElements = Array.from(elements);
          console.log(`[CRM Extension] Found ${dmElements.length} DMs with selector: ${selector}`);
          break;
        }
      } catch (selectorError) {
        // Continue to next selector
      }
    }
    
    if (dmElements.length === 0) {
      const allListItems = container.querySelectorAll('li');
      dmElements = Array.from(allListItems).filter(li => {
        const hasAvatar = li.querySelector('img') !== null || 
                         li.querySelector('[class*="avatar"]') !== null;
        const text = li.textContent.trim();
        return (hasAvatar || 
                (text.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) !== null) || 
                text.includes('@')) && 
                !text.includes('#');
      });
      console.log(`[CRM Extension] Found ${dmElements.length} DMs using general approach`);
    }
    
    const dms = dmElements.map((element, index) => {
      let name = '';
      const nameElement = element.querySelector('.contact-name, .user-name, .name');
      if (nameElement) {
        name = nameElement.textContent.trim();
      } else {
        name = element.textContent.trim();
      }
      name = name.replace(/^@\s*/, '').trim();
      if (name.length > 30) {
        name = name.substring(0, 30);
      }
      const id = element.getAttribute('data-contact-id') || 
                element.getAttribute('data-user-id') || 
                element.getAttribute('data-id') || 
                element.getAttribute('href')?.split('/').pop() || 
                `ghl-dm-${index}`;
      const avatarElement = element.querySelector('.avatar, .contact-avatar, img, [class*="avatar"]');
      let avatarSrc = '';
      let avatarColor = '';
      let initials = '';
      if (avatarElement) {
        if (avatarElement.tagName === 'IMG') {
          avatarSrc = avatarElement.src;
        } else {
          const img = avatarElement.querySelector('img');
          if (img && img.src) {
            avatarSrc = img.src;
          } else {
            avatarColor = getComputedStyle(avatarElement).backgroundColor || '#7289DA';
            initials = avatarElement.textContent.trim().substring(0, 2).toUpperCase();
          }
        }
      }
      if (!initials && name) {
        const parts = name.split(/\s+/);
        if (parts.length === 1) {
          initials = parts[0].substring(0, 2).toUpperCase();
        } else {
          initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
      }
      const unreadBadge = element.querySelector('.badge, .unread-count, .unread-badge');
      const hasUnreadIndicator = element.querySelector('.unread, .unread-indicator, [class*="unread"]') !== null;
      let unreadCount = 0;
      if (unreadBadge) {
        const badgeText = unreadBadge.textContent.trim();
        unreadCount = parseInt(badgeText, 10) || 1;
      } else if (hasUnreadIndicator) {
        unreadCount = 1;
      }
      return {
        id,
        name,
        type: 'dm',
        avatarSrc,
        avatarColor,
        initials,
        unreadCount
      };
    });
    
    return dms.filter(dm => 
      dm.name && 
      dm.name.length > 0 && 
      !dm.name.includes('#') && 
      !dm.name.includes('…')
    );
  } catch (error) {
    console.error('[CRM Extension] Error scraping GoHighLevel DMs:', error);
    return [];
  }
}

async function fetchDiscordData() {
  try {
    return {
      channels: scrapeChannelsFromDOM(),
      directMessages: scrapeDirectMessagesFromDOM()
    };
  } catch (error) {
    console.error('[CRM Extension] Error fetching Discord data:', error);
    return { channels: [], directMessages: [] };
  }
}

async function fetchSlackData() {
  try {
    return {
      channels: scrapeChannelsFromDOM(),
      directMessages: scrapeDirectMessagesFromDOM()
    };
  } catch (error) {
    console.error('[CRM Extension] Error fetching Slack data:', error);
    return { channels: [], directMessages: [] };
  }
}

async function fetchInternalChatData() {
  try {
    return {
      channels: scrapeChannelsFromDOM(),
      directMessages: scrapeDirectMessagesFromDOM()
    };
  } catch (error) {
    console.error('[CRM Extension] Error fetching internal chat data:', error);
    return { channels: [], directMessages: [] };
  }
}

function scrapeChannelsFromDOM() {
  try {
    const channelSelectors = [
      '[role="listitem"] [data-list-item-id*="channels"]',
      '.channel-name',
      'div:has(> .channel-name)',
      'div > a[href*="channels"]',
      'div[class*="channel"]',
      'li', 
      'a[href]'
    ];
    
    let channelElements = [];
    
    for (const selector of channelSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          channelElements = Array.from(elements);
          console.log(`[CRM Extension] Found ${channelElements.length} potential channels with selector: ${selector}`);
          break;
        }
      } catch (selectorError) {}
    }
    
    if (channelElements.length > 0 && (channelSelectors.includes('li') || channelSelectors.includes('a[href]'))) {
      channelElements = Array.from(document.querySelectorAll('li')).filter(li => {
        const text = li.textContent.trim();
        return (text.includes('#') || li.querySelector('svg') || li.classList.contains('channel') || li.parentElement?.classList.contains('channels')) &&
               !text.includes('@');
      });
      console.log(`[CRM Extension] Found ${channelElements.length} channels using general approach`);
    }
    
    const channels = channelElements.map((element, index) => {
      let name = '';
      const nameElement = element.querySelector('.channel-name, .name');
      if (nameElement) {
        name = nameElement.textContent.trim();
      } else {
        name = element.textContent.trim();
      }
      name = name.replace(/^#\s*/, '').trim();
      const id = element.getAttribute('data-channel-id') || 
                element.getAttribute('data-id') || 
                element.getAttribute('href')?.split('/').pop() || 
                `ghl-channel-${index}`;
      const unreadBadge = element.querySelector('.badge, .unread-count, .unread-badge');
      const hasUnreadIndicator = element.querySelector('.unread, .unread-indicator, [class*="unread"]') !== null;
      let unreadCount = 0;
      if (unreadBadge) {
        const badgeText = unreadBadge.textContent.trim();
        unreadCount = parseInt(badgeText, 10) || 1;
      } else if (hasUnreadIndicator) {
        unreadCount = 1;
      }
      return {
        id,
        name,
        type: 'channel',
        unreadCount
      };
    });
    
    return channels.filter(channel => 
      channel.name && channel.name.length > 0 && 
      !channel.name.includes('@') &&
      !channel.name.includes('…') && 
      channel.name.length < 30
    );
  } catch (error) {
    console.error('[CRM Extension] Error scraping channels from DOM:', error);
    return [];
  }
}

function scrapeDirectMessagesFromDOM() {
  try {
    const dmSelectors = [
      '[role="listitem"] [data-list-item-id*="dm"]',
      '.contact-name, .user-name, .name'
    ];
    
    let dmElements = [];
    
    for (const selector of dmSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
          dmElements = Array.from(elements);
          console.log(`[CRM Extension] Found ${dmElements.length} potential DMs with selector: ${selector}`);
          break;
        }
      } catch (selectorError) {}
    }
    
    if (dmElements.length === 0) {
      const allListItems = document.querySelectorAll('li');
      dmElements = Array.from(allListItems).filter(li => {
        const hasAvatar = li.querySelector('img') !== null || li.querySelector('[class*="avatar"]') !== null;
        const text = li.textContent.trim();
        return (hasAvatar || (text.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/) !== null) || text.includes('@')) && 
               !text.includes('#');
      });
      console.log(`[CRM Extension] Found ${dmElements.length} DMs using general approach`);
    }
    
    const dms = dmElements.map((element, index) => {
      let name = '';
      const nameElement = element.querySelector('.contact-name, .user-name, .name');
      if (nameElement) {
        name = nameElement.textContent.trim();
      } else {
        name = element.textContent.trim();
      }
      name = name.replace(/^@\s*/, '').trim();
      if (name.length > 30) {
        name = name.substring(0, 30);
      }
      const id = element.getAttribute('data-contact-id') || 
                element.getAttribute('data-user-id') || 
                element.getAttribute('data-id') || 
                element.getAttribute('href')?.split('/').pop() || 
                `ghl-dm-${index}`;
      const avatarElement = element.querySelector('.avatar, .contact-avatar, img, [class*="avatar"]');
      let avatarSrc = '';
      let avatarColor = '';
      let initials = '';
      if (avatarElement) {
        if (avatarElement.tagName === 'IMG') {
          avatarSrc = avatarElement.src;
        } else {
          const img = avatarElement.querySelector('img');
          if (img && img.src) {
            avatarSrc = img.src;
          } else {
            avatarColor = getComputedStyle(avatarElement).backgroundColor || '#7289DA';
            initials = avatarElement.textContent.trim().substring(0, 2).toUpperCase();
          }
        }
      }
      if (!initials && name) {
        const parts = name.split(/\s+/);
        if (parts.length === 1) {
          initials = parts[0].substring(0, 2).toUpperCase();
        } else {
          initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
      }
      const unreadBadge = element.querySelector('.badge, .unread-count, .unread-badge');
      const hasUnreadIndicator = element.querySelector('.unread, .unread-indicator, [class*="unread"]') !== null;
      let unreadCount = 0;
      if (unreadBadge) {
        const badgeText = unreadBadge.textContent.trim();
        unreadCount = parseInt(badgeText, 10) || 1;
      } else if (hasUnreadIndicator) {
        unreadCount = 1;
      }
      return {
        id,
        name,
        type: 'dm',
        avatarSrc,
        avatarColor,
        initials,
        unreadCount
      };
    });
    
    return dms.filter(dm => 
      dm.name && dm.name.length > 0 && 
      !dm.name.includes('#') && 
      !dm.name.includes('…')
    );
  } catch (error) {
    console.error('[CRM Extension] Error scraping DMs from DOM:', error);
    return [];
  }
}
