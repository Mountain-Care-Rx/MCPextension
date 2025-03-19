/**
 * modules/chat/styles.js
 */

/**
 * Creates and adds CSS styles for chat UI components
 */
export function createChatStyles() {
    if (document.getElementById('crm-plus-chat-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'crm-plus-chat-styles';
    style.textContent = `
      .crm-plus-chat-button {
        display: flex;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 4px 8px;
        color: #e6e6e6;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .crm-plus-chat-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      
      .crm-plus-chat-icon {
        margin-right: 4px;
        font-size: 14px;
      }
      
      .crm-plus-chat-count {
        background-color: #F44336;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 10px;
        margin-left: 4px;
        display: none;
      }
      
      .crm-plus-chat-dropdown {
        position: absolute;
        top: 32px;
        right: 0;
        background-color: #2F3A4B;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        min-width: 300px;
        max-width: 350px;
        z-index: 1000000;
        display: none;
        flex-direction: column;
        max-height: 400px;
      }
      
      .crm-plus-chat-dropdown.show {
        display: flex;
      }
      
      .crm-plus-chat-tabs {
        display: flex;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .crm-plus-chat-tab {
        padding: 8px 12px;
        color: #e6e6e6;
        font-size: 13px;
        cursor: pointer;
        position: relative;
        flex-grow: 1;
        text-align: center;
      }
      
      .crm-plus-chat-tab.active {
        background-color: rgba(255, 255, 255, 0.1);
        border-bottom: 2px solid #2196F3;
      }
      
      .crm-plus-chat-tab:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .crm-plus-chat-tab-badge {
        position: absolute;
        top: 3px;
        right: 3px;
        background-color: #F44336;
        color: white;
        border-radius: 50%;
        padding: 1px 5px;
        font-size: 9px;
        display: none;
      }
      
      .crm-plus-chat-messages {
        overflow-y: auto;
        flex-grow: 1;
        max-height: 330px;
      }
      
      .crm-plus-chat-conversations {
        overflow-y: auto;
        flex-grow: 1;
        max-height: 330px;
      }
      
      .crm-plus-chat-message {
        padding: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
      }
      
      .crm-plus-chat-message:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .crm-plus-chat-user {
        font-weight: bold;
        color: #e6e6e6;
        font-size: 13px;
        margin-bottom: 3px;
      }
      
      .crm-plus-chat-text {
        color: #ccc;
        font-size: 12px;
        margin-bottom: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .crm-plus-chat-time {
        color: #999;
        font-size: 10px;
        text-align: right;
      }
      
      .crm-plus-chat-conversation {
        padding: 8px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
      }
      
      .crm-plus-chat-conversation:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .crm-plus-chat-conversation.active {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      .crm-plus-chat-conversation-info {
        flex-grow: 1;
        overflow: hidden;
      }
      
      .crm-plus-chat-conversation-name {
        font-weight: bold;
        color: #e6e6e6;
        font-size: 13px;
        margin-bottom: 3px;
      }
      
      .crm-plus-chat-conversation-preview {
        color: #ccc;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .crm-plus-chat-conversation-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        min-width: 50px;
      }
      
      .crm-plus-chat-conversation-time {
        color: #999;
        font-size: 10px;
        margin-bottom: 4px;
      }
      
      .crm-plus-chat-unread-badge {
        background-color: #F44336;
        color: white;
        border-radius: 50%;
        padding: 2px 5px;
        font-size: 10px;
        min-width: 15px;
        text-align: center;
      }
      
      .crm-plus-chat-header {
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        font-weight: bold;
        color: #e6e6e6;
      }
      
      .crm-plus-chat-header-action {
        color: #e6e6e6;
        font-size: 12px;
        cursor: pointer;
        margin-right: 10px;
      }
      
      .crm-plus-chat-header-action:hover {
        text-decoration: underline;
      }
      
      .crm-plus-chat-footer {
        padding: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .crm-plus-chat-input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #444;
        border-radius: 4px;
        background-color: #1e2a38;
        color: #e6e6e6;
        font-size: 12px;
      }
      
      .crm-plus-refresh-button {
        background: none;
        border: none;
        color: #e6e6e6;
        font-size: 14px;
        cursor: pointer;
        padding: 4px;
        position: absolute;
        top: 5px;
        right: 5px;
      }
      
      .crm-plus-chat-loading {
        padding: 10px;
        text-align: center;
        color: #aaa;
        font-style: italic;
      }
      
      .crm-plus-chat-empty {
        padding: 10px;
        text-align: center;
        color: #aaa;
        font-style: italic;
      }
      
      .crm-plus-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 8px;
      }
      
      .crm-plus-avatar-placeholder {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin-right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #7289DA;
        color: #fff;
        font-size: 12px;
      }
    `;
    
    document.head.appendChild(style);
}
