/***************************************************
 * automationRemoveUtils.js (Robust & Cleaned-up Version)
 ***************************************************/

// List of automations to remove
const REMOVABLE_AUTOMATIONS = [
    'API - New Patient - Semaglutide Combo',
    'API - New Patient - Tirzepatide Combo',
    'API - Refill - Semaglutide Combo - (Step 1 Verify First Name)',
    'API - Refill - Tirzepatide Combo - (Step 1 Verify First Name)',
  ];

  // Array to store found automations
  let foundAutomations = [];

  /**
   * Helper to safely get the bounding rectangle of an element.
   * Returns a default rectangle if the element is missing or unsupported.
   */
  function safeGetBoundingRect(element) {
    try {
      if (element && typeof element.getBoundingClientRect === 'function') {
        return element.getBoundingClientRect();
      }
    } catch (e) {
      // Fall through
    }
    return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
  }

  /**
   * Initialize the automation removal system.
   */
  export function initAutomationRemoval() {
    console.log('[CRM Extension] Automation removal system initialized');
  }

  /**
   * Detect removable automations in the Active section.
   * Returns an array of objects { element, text }.
   */
  export function detectAutomations() {
    foundAutomations = [];
    try {
      const activeSection = findSectionByText('Active');
      if (!activeSection) {
        console.log('[CRM Extension] Active section not found.');
        return [];
      }
      // Get workflows via boundingRect filtering (or fallback if none found)
      const workflows = activeSection.workflows.length
        ? activeSection.workflows
        : filterActiveWorkflows(activeSection.label);
      // Filter workflows that match our known automation strings
      foundAutomations = workflows.filter(wf => {
        if (!wf) return false;
        const text = (wf.textContent || '').trim();
        return text.includes('Workflow') &&
               REMOVABLE_AUTOMATIONS.some(automation => text.includes(automation));
      });
      console.log(`[CRM Extension] Found ${foundAutomations.length} automation(s) in Active section.`);
      return foundAutomations;
    } catch (error) {
      console.error('[CRM Extension] Error detecting automations:', error);
      return [];
    }
  }

  /**
   * Fallback: Filter workflows using boundingRect based on the Active label.
   */
  function filterActiveWorkflows(activeLabel) {
    const activeLabelBottom = safeGetBoundingRect(activeLabel).bottom;
    // If a Past label exists, get its top; otherwise, ignore it.
    let pastLabelTop = null;
    const pastSection = findSectionByText('Past');
    if (pastSection && pastSection.label) {
      pastLabelTop = safeGetBoundingRect(pastSection.label).top;
    }
    const allWorkflows = Array.from(document.querySelectorAll('div[id^="workflow_"], div[data-workflow-id]'));
    return allWorkflows.filter(wf => {
      const rect = safeGetBoundingRect(wf);
      if (rect.top < activeLabelBottom) return false;
      if (pastLabelTop && rect.top >= pastLabelTop) return false;
      return true;
    });
  }

  /**
   * Find a section by its label text ("Active" or "Past") and return an object:
   * { label: HTMLElement, workflows: [HTMLElement, ...] }.
   */
  function findSectionByText(text) {
    try {
      const divs = Array.from(document.querySelectorAll('div.py-2'));
      const sectionDiv = divs.find(div => (div.textContent || '').trim() === text);
      if (sectionDiv) {
        return {
          label: sectionDiv,
          workflows: text === 'Active' ? getWorkflowsBetween(sectionDiv) : getWorkflowsBelow(sectionDiv)
        };
      }
      // Fallback for attribute-based selection
      const selector = text === 'Active'
        ? '[data-automation="Active"], #automation-active'
        : '[data-automation="Past"], #automation-past';
      const el = document.querySelector(selector);
      if (el) return { label: el, workflows: [] };
      return null;
    } catch (error) {
      console.error(`[CRM Extension] Error finding section for "${text}":`, error);
      return null;
    }
  }

  /**
   * Get workflows between the Active and Past labels.
   */
  function getWorkflowsBetween(activeLabel) {
    const activeBottom = safeGetBoundingRect(activeLabel).bottom;
    const divs = Array.from(document.querySelectorAll('div.py-2'));
    const pastDiv = divs.find(div => (div.textContent || '').trim() === 'Past');
    const pastTop = pastDiv ? safeGetBoundingRect(pastDiv).top : null;
    const allWorkflows = Array.from(document.querySelectorAll('div[id^="workflow_"], div[data-workflow-id]'));
    return allWorkflows.filter(wf => {
      const rect = safeGetBoundingRect(wf);
      return rect.top > activeBottom && (!pastTop || rect.top < pastTop);
    });
  }

  /**
   * Get workflows below the Past label.
   */
  function getWorkflowsBelow(pastLabel) {
    const pastBottom = safeGetBoundingRect(pastLabel).bottom;
    const allWorkflows = Array.from(document.querySelectorAll('div[id^="workflow_"], div[data-workflow-id]'));
    return allWorkflows.filter(wf => safeGetBoundingRect(wf).top > pastBottom);
  }

  /**
   * Climb up the DOM to find a parent element that represents the workflow.
   */
  function findWorkflowParent(element) {
    let current = element, depth = 0;
    while (current && depth < 5) {
      if (current.id && current.id.startsWith('workflow_')) return current;
      current = current.parentElement;
      depth++;
    }
    return null;
  }

  /**
   * Attempt to remove a given automation element.
   * Returns a boolean or a Promise (if scrolling is needed).
   */
  export function removeAutomation(automationElement) {
    if (!automationElement) {
      console.error('[CRM Extension] removeAutomation called with undefined element.');
      return false;
    }
    try {
      const rect = safeGetBoundingRect(automationElement);
      const isVisible = rect.width > 0 && rect.height > 0;
      const inViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
      );
      if (!isVisible || !inViewport) {
        automationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return new Promise(resolve => {
          setTimeout(() => resolve(attemptRemove(automationElement)), 500);
        });
      }
      return attemptRemove(automationElement);
    } catch (error) {
      console.error('[CRM Extension] Error removing automation:', error);
      return false;
    }
  }

  /**
   * Try various strategies to click a remove button.
   */
  function attemptRemove(automationElement) {
    if (!automationElement) return false;

    // Strategy 1: Look for close icon(s)
    try {
      const closeIcons = automationElement.querySelectorAll('i.icon-close, i.icon.icon-close');
      if (closeIcons.length) {
        closeIcons[0].click();
        return true;
      }
    } catch (e) {
      console.error('[CRM Extension] Error in Strategy 1:', e);
    }

    // Strategy 2: Anchor tags with an "×" or "x"
    try {
      const closeLinks = automationElement.querySelectorAll('a');
      for (const link of closeLinks) {
        const text = (link.textContent || '').trim();
        if (text === '×' || text.toLowerCase() === 'x') {
          link.click();
          return true;
        }
      }
    } catch (e) {
      console.error('[CRM Extension] Error in Strategy 2:', e);
    }

    // Strategy 3: Look for a Manage button to reveal removal options
    try {
      const manageButtons = automationElement.querySelectorAll('button, .btn, [role="button"]');
      for (const button of manageButtons) {
        const btnText = (button.textContent || '').toLowerCase();
        if (btnText.includes('manage')) {
          button.click();
          setTimeout(() => {
            const removeOptions = document.querySelectorAll('.dropdown-menu .dropdown-item, .menu-item');
            removeOptions.forEach(option => {
              const txt = (option.textContent || '').toLowerCase();
              if (txt.includes('remove') || txt.includes('delete')) option.click();
            });
          }, 300);
          return true;
        }
      }
    } catch (e) {
      console.error('[CRM Extension] Error in Strategy 3:', e);
    }

    // Strategy 4: ID-based selectors for known workflow elements
    if (automationElement.id && automationElement.id.startsWith('workflow_')) {
      const workflowId = automationElement.id;
      try {
        let sel = `#${workflowId} i.icon-close, #${workflowId} i.icon.icon-close`;
        let closeIcon = document.querySelector(sel);
        if (closeIcon) {
          closeIcon.click();
          return true;
        }
        sel = `#${workflowId} .remove, #${workflowId} .close`;
        let removeBtn = document.querySelector(sel);
        if (removeBtn) {
          removeBtn.click();
          return true;
        }
      } catch (e) {
        console.error('[CRM Extension] Error in Strategy 4:', e);
      }
    }

    // Strategy 5: Check for span elements containing an "×" or "x"
    try {
      const spans = automationElement.querySelectorAll('span');
      for (const span of spans) {
        const txt = (span.textContent || '').trim();
        if (txt === '×' || txt.toLowerCase() === 'x') {
          span.click();
          return true;
        }
      }
    } catch (e) {
      console.error('[CRM Extension] Error in Strategy 5:', e);
    }

    // Strategy 6: Check a few siblings for removal controls
    try {
      let sibling = automationElement.nextElementSibling, count = 0;
      while (sibling && count < 3) {
        if (
          (sibling.classList && (sibling.classList.contains('close') || sibling.classList.contains('remove'))) ||
          (sibling.textContent && (sibling.textContent.trim() === '×' || sibling.textContent.trim().toLowerCase() === 'x'))
        ) {
          sibling.click();
          return true;
        }
        const sibIcon = sibling.querySelector('i.icon-close, i.icon.icon-close');
        if (sibIcon) {
          sibIcon.click();
          return true;
        }
        sibling = sibling.nextElementSibling;
        count++;
      }
    } catch (e) {
      console.error('[CRM Extension] Error in Strategy 6:', e);
    }

    // Strategy 7: As a last resort, simulate a click near the top-right corner.
    try {
      const rect = safeGetBoundingRect(automationElement);
      const x = rect.right - 10;
      const y = rect.top + rect.height / 2;
      const elementsAtPoint = document.elementsFromPoint(x, y);
      for (const el of elementsAtPoint) {
        if (el !== automationElement) {
          el.click();
          return true;
        }
      }
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });
      (elementsAtPoint[0] || document.elementFromPoint(x, y))?.dispatchEvent(clickEvent);
      return true;
    } catch (e) {
      console.error('[CRM Extension] Error in Strategy 7:', e);
    }

    console.error('[CRM Extension] No method found to remove automation:', automationElement);
    return false;
  }

  /**
   * Handle confirmation dialogs if they appear.
   */
  function handleConfirmationDialog() {
    return new Promise(resolve => {
      setTimeout(() => {
        const modals = document.querySelectorAll('.modal, [role="dialog"], .dialog');
        if (modals.length) {
          const confirmButtons = document.querySelectorAll(
            '.modal .btn-primary, .modal .btn-danger, .modal .confirm-btn, ' +
            '[role="dialog"] .btn-primary, .modal button, [role="dialog"] button'
          );
          for (const btn of confirmButtons) {
            const txt = (btn.textContent || '').trim().toLowerCase();
            if (['delete', 'remove', 'yes', 'confirm', 'ok', 'continue'].includes(txt)) {
              btn.click();
              resolve(true);
              return;
            }
          }
          // Fallback: click the last button in the dialog.
          const dialogButtons = document.querySelectorAll('.modal button, [role="dialog"] button, .dialog button');
          if (dialogButtons.length) {
            dialogButtons[dialogButtons.length - 1].click();
            resolve(true);
            return;
          }
        }
        resolve(false);
      }, 500);
    });
  }

  /**
   * Remove all detected automations.
   * If nothing is found, exit immediately.
   */
  export function removeAllAutomations() {
    return new Promise((resolve, reject) => {
      try {
        const automations = detectAutomations();
        if (!automations.length) {
          console.log('[CRM Extension] No automations to remove.');
          resolve({ success: true, message: 'No automations to remove', removed: 0, total: 0 });
          return;
        }
        let successCount = 0;
        const total = automations.length;
        function removeNext(index) {
          if (index >= total) {
            resolve({ success: true, message: `Removed ${successCount} of ${total} automations`, removed: successCount, total });
            return;
          }
          const automation = automations[index];
          const removalResult = removeAutomation(automation.element);
          if (removalResult instanceof Promise) {
            removalResult.then(success => {
              if (success) successCount++;
              handleConfirmationDialog().then(() => setTimeout(() => removeNext(index + 1), 1000));
            });
          } else {
            if (removalResult) successCount++;
            handleConfirmationDialog().then(() => setTimeout(() => removeNext(index + 1), 1000));
          }
        }
        removeNext(0);
      } catch (error) {
        console.error('[CRM Extension] Error in removeAllAutomations:', error);
        reject(error);
      }
    });
  }
