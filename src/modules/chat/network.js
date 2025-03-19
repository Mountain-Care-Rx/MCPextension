/**
 * modules/chat/network.js
 */

import { addNewMessage } from './storage.js';

let networkMonitor = null;

/**
 * Monkey-patch XMLHttpRequest to monitor Firestore traffic
 */
export function monitorXHRForFirestore() {
  // Only activate if on the chat page
  if (!window.location.href.includes('/custom-menu-link/')) {
    console.warn('[CRM Extension] Not on chat page, network monitoring disabled.');
    return;
  }
  
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._crmUrl = url;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    if (this._crmUrl && isFirestoreUrl(this._crmUrl)) {
      this.addEventListener('load', function() {
        try {
          if (this.responseType === '' || this.responseType === 'text') {
            const response = this.responseText;
            if (response && response.length > 0) {
              processFirestoreResponse(response);
            }
          }
        } catch (e) {
          console.error('[CRM Extension] Error processing XHR response:', e);
        }
      });
    }
    return originalXHRSend.apply(this, arguments);
  };
  
  if (window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      if (isFirestoreUrl(url)) {
        return originalFetch.apply(this, arguments)
          .then(response => {
            const clone = response.clone();
            clone.text().then(text => {
              if (text && text.length > 0) {
                processFirestoreResponse(text);
              }
            }).catch(e => {
              console.error('[CRM Extension] Error processing fetch response:', e);
            });
            return response;
          });
      }
      return originalFetch.apply(this, arguments);
    };
  }
  
  console.log('[CRM Extension] Network monitoring set up for chat activity');
  return networkMonitor;
}

/**
 * Check if a URL is related to Firestore/database operations
 * @param {string} url - The URL to check
 * @returns {boolean} True if the URL appears to be Firestore-related
 */
function isFirestoreUrl(url) {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('firestore') || 
         lowerUrl.includes('highlevel-backend') || 
         lowerUrl.includes('database') ||
         (lowerUrl.includes('projects') && lowerUrl.includes('documents'));
}

/**
 * Process a response that might contain Firestore data
 * @param {string} responseText - The response text
 */
function processFirestoreResponse(responseText) {
  try {
    if (!responseText.includes('documentChange') && !responseText.includes('notification_data')) {
      return;
    }
    
    const jsonMatches = responseText.match(/\[\[\d+,\[(\{.*?\})\]\]\]/g) || [];
    
    for (const match of jsonMatches) {
      try {
        const innerJson = match.replace(/^\[\[\d+,\[/, '').replace(/\]\]\]$/, '');
        const data = JSON.parse(innerJson);
        if (data.documentChange && data.documentChange.document) {
          const doc = data.documentChange.document;
          if (doc.fields && 
              doc.fields.notification_data && 
              doc.fields.notification_data.mapValue && 
              doc.fields.notification_data.mapValue.fields) {
            
            const notificationFields = doc.fields.notification_data.mapValue.fields;
            
            if (doc.fields.type && 
                doc.fields.type.stringValue === 'sms' &&
                notificationFields.conversationId &&
                notificationFields.fromName &&
                notificationFields.body) {
              
              const message = {
                id: notificationFields.messageId ? notificationFields.messageId.stringValue : `msg-${Date.now()}`,
                conversationId: notificationFields.conversationId.stringValue,
                sender: notificationFields.fromName.stringValue,
                text: notificationFields.body.stringValue,
                timestamp: doc.fields.date_added ? doc.fields.date_added.timestampValue : new Date().toISOString(),
                fromNumber: notificationFields.fromNumber ? notificationFields.fromNumber.stringValue : null,
                fromEmail: notificationFields.fromEmail ? notificationFields.fromEmail.stringValue : null,
                contactId: notificationFields.contactId ? notificationFields.contactId.stringValue : null,
                source: notificationFields.source ? notificationFields.source.stringValue : null
              };
              
              addNewMessage(message);
            }
          }
        }
      } catch (innerError) {
        console.error('[CRM Extension] Error processing inner Firestore response:', innerError);
      }
    }
  } catch (error) {
    console.error('[CRM Extension] Error processing Firestore response:', error);
  }
}
