// modules/chat/network.js

import { addNewMessage } from './storage.js';

let networkMonitor = null;

/**
 * Monkey-patch XMLHttpRequest to monitor Firestore traffic
 */
export function monitorXHRForFirestore() {
  // Save reference to the original XHR open method
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  // Patch the open method to capture request details
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    // Store the URL for later use
    this._crmUrl = url;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  // Patch the send method to monitor responses
  XMLHttpRequest.prototype.send = function(body) {
    // If this seems to be a Firestore/database request
    if (this._crmUrl && isFirestoreUrl(this._crmUrl)) {
      // Listen for the response
      this.addEventListener('load', function() {
        try {
          // Try to process response
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
    
    // Send the original request
    return originalXHRSend.apply(this, arguments);
  };
  
  // Also patch fetch if available (as a backup method)
  if (window.fetch) {
    const originalFetch = window.fetch;
    
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      
      if (isFirestoreUrl(url)) {
        return originalFetch.apply(this, arguments)
          .then(response => {
            // Clone the response to read it without consuming it
            const clone = response.clone();
            
            // Try to process the response
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
  
  // Check for Firestore/database endpoints based on what we saw in the network tab
  return lowerUrl.includes('firestore') || 
         lowerUrl.includes('highlevel-backend') || 
         lowerUrl.includes('database') ||
         lowerUrl.includes('projects') && lowerUrl.includes('documents');
}

/**
 * Process a response that might contain Firestore data
 * @param {string} responseText - The response text
 */
function processFirestoreResponse(responseText) {
  try {
    // Check if the response contains valid document changes
    if (!responseText.includes('documentChange') && !responseText.includes('notification_data')) {
      return;
    }
    
    // Firestore responses might be wrapped with length prefixes and brackets
    // Extract actual JSON data by looking for patterns like "[[123,[{"
    const jsonMatches = responseText.match(/\[\[\d+,\[(\{.*?\})\]\]\]/g) || [];
    
    for (const match of jsonMatches) {
      try {
        // Extract the inner JSON data by removing wrapper
        const innerJson = match.replace(/^\[\[\d+,\[/, '').replace(/\]\]\]$/, '');
        const data = JSON.parse(innerJson);
        
        // Check if this is a document change event with notification data
        if (data.documentChange && data.documentChange.document) {
          const doc = data.documentChange.document;
          
          // Check if this is a notification document with chat/SMS data
          if (doc.fields && 
              doc.fields.notification_data && 
              doc.fields.notification_data.mapValue && 
              doc.fields.notification_data.mapValue.fields) {
            
            // Extract the notification data fields
            const notificationFields = doc.fields.notification_data.mapValue.fields;
            
            // Check if this is a chat/SMS notification
            if (doc.fields.type && 
                doc.fields.type.stringValue === 'sms' &&
                notificationFields.conversationId &&
                notificationFields.fromName &&
                notificationFields.body) {
              
              // Create a message object from the notification data
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
              
              // Add the message to our store
              addNewMessage(message);
            }
          }
        }
      } catch (innerError) {
        console.error('[CRM Extension] Error parsing inner JSON data:', innerError);
      }
    }
  } catch (error) {
    console.error('[CRM Extension] Error processing Firestore response:', error);
  }
}

/**
 * Clean up network monitoring resources
 */
export function cleanupNetworkMonitoring() {
  if (networkMonitor) {
    networkMonitor.disconnect();
    networkMonitor = null;
  }
}