// modules/tagRemoveUtils.js
// Utility module for detecting and removing specific tags from patients

// List of tags we want to be able to remove
const REMOVABLE_TAGS = [
    'np-tirz-1.5ml-inj',
    'refill-sema-inj',
    'refill-tirz-inj',
    'vial-sema-b12',
    'vial-sema-b6',
    'vial-sema-lipo',
    'vial-sema-nad+',
    'vial-tirz-cyano',
    'vial-tirz-nad+',
    'vial-tirz-pyridoxine',
    'np-sema-0.125ml-inj',
    'np-sema-0.25ml-inj',
    'np-sema-0.5ml-inj',
    'np-sema-0.75ml-inj',
    'np-sema-1.0ml-inj',
    'np-sema-1.25ml-inj',
    'np-sema-1.5ml-inj',
    'np-sema-2.0ml-inj',
    'np-tirz-0.25ml-inj',
    'np-tirz-0.5ml-inj',
    'np-tirz-0.75ml-inj',
    'np-tirz-1.0ml-inj',
    'np-tirz-1.25ml-inj',

    'api-refill-patient-tirz',
    'api-refill-patient-sema',

    'api-tirz-b6-0.25ml-syringe',
    'api-tirz-b6-0.5ml-syringe',
    'api-tirz-b6-0.75ml-syringe',
    'api-tirz-b6-1.0ml-syringe',
    'api-tirz-b6-1.25ml-syringe',
    'api-tirz-b6-1.5ml-syringe',

    'api-tirz-b6-2.5ml-vial',
    'api-tirz-b6-5.0ml-vial',
    'api-tirz-b6-7.5ml-vial',
    'api-tirz-b6-10.0ml-vial',

    'api-tirz-b12-2.5ml-vial',
    'api-tirz-b12-5.0ml-vial',
    'api-tirz-b12-7.5ml-vial',
    'api-tirz-b12-10.0ml-vial',

    'api-tirz-nad+-2.5ml-vial',
    'api-tirz-nad+-5.0ml-vial',
    'api-tirz-nad+-7.5ml-vial',
    'api-tirz-nad+-10.0ml-vial',

    'api-sema-b6-2.5ml-vial',
    'api-sema-b6-5.0ml-vial',
    'api-sema-b6-7.5ml-vial',
    'api-sema-b6-10.0ml-vial',


    'api-sema-b12-0.125ml-syringe',
    'api-sema-b12-0.25ml-syringe',
    'api-sema-b12-0.5ml-syringe',
    'api-sema-b12-0.75ml-syringe',
    'api-sema-b12-1.0ml-syringe',
    'api-sema-b12-1.25ml-syringe',
    'api-sema-b12-1.5ml-syringe',
    'api-sema-b12-1.75ml-syringe',
    'api-sema-b12-2.0ml-syringe',

    'api-sema-b12-2.5ml-vial',
    'api-sema-b12-5.0ml-vial',
    'api-sema-b12-7.5ml-vial',
    'api-sema-b12-10.0ml-vial',

    'api-sema-nad+-2.5ml-vial',
    'api-sema-nad+-5.0ml-vial',
    'api-sema-nad+-7.5ml-vial',
    'api-sema-nad+-10.0ml-vial',

    'api-sema-lipo-2.5ml-vial',
    'api-sema-lipo-5.0ml-vial',
    'api-sema-lipo-7.5ml-vial',
    'api-sema-lipo-10.0ml-vial',
  ];

  // Store for found tags
  let foundTags = [];

  /**
   * Initialize the tag removal system
   */
  export function initTagRemoval() {
    console.log('[CRM Extension] Tag removal system initialized');
  }

  /**
   * Detect all removable tags on the current page
   * @returns {Array} Array of found tag elements
   */
  export function detectTags() {
    // Reset found tags
    foundTags = [];

    try {
      // Strategy 1: Look for tag elements with specific classes
      const tagElements = document.querySelectorAll('.tag, .tag-label, .pill, .badge');

      for (const tag of tagElements) {
        const tagText = tag.textContent.trim().toLowerCase();
        // Check if the tag text contains any of our removable tags
        if (REMOVABLE_TAGS.some(removableTag => tagText.includes(removableTag))) {
          foundTags.push({
            element: tag,
            text: tagText
          });
        }
      }

      // Strategy 2: Look for elements with data-tag attributes
      const dataTagElements = document.querySelectorAll('[data-tag]');
      for (const element of dataTagElements) {
        const tagValue = element.getAttribute('data-tag').toLowerCase();
        if (REMOVABLE_TAGS.some(removableTag => tagValue.includes(removableTag))) {
          foundTags.push({
            element: element,
            text: tagValue
          });
        }
      }

      // Strategy 3: Look for elements containing tag text within tag containers
      const tagContainers = document.querySelectorAll('.tags-container, .tag-list, .tags');
      for (const container of tagContainers) {
        const childElements = container.querySelectorAll('*');
        for (const element of childElements) {
          if (element.nodeType === 1) { // Only element nodes
            const text = element.textContent.trim().toLowerCase();
            if (REMOVABLE_TAGS.some(removableTag => text.includes(removableTag))) {
              // Avoid duplicates
              if (!foundTags.some(foundTag => foundTag.element === element)) {
                foundTags.push({
                  element: element,
                  text: text
                });
              }
            }
          }
        }
      }

      // Strategy 4: Look for elements with class names that might contain our tags
      const allElements = document.querySelectorAll('*[class]');
      for (const element of allElements) {
        const className = String(element.className).toLowerCase();
        if (className && typeof className === 'string' && REMOVABLE_TAGS.some(tag => className.includes(tag))) {
          // Avoid duplicates
          if (!foundTags.some(foundTag => foundTag.element === element)) {
            foundTags.push({
              element: element,
              text: element.textContent.trim().toLowerCase()
            });
          }
        }
      }

      console.log(`[CRM Extension] Found ${foundTags.length} removable tags`);
      return foundTags;
    } catch (error) {
      console.error('[CRM Extension] Error detecting tags:', error);
      return [];
    }
  }

  /**
   * Removes a specific tag by clicking its remove button or X icon
   * @param {Element} tagElement - The tag element to remove
   * @returns {boolean} Success status
   */
  export function removeTag(tagElement) {
    try {
      // Strategy 1: Look for a close button or X icon within the tag
      const closeButton = tagElement.querySelector('.close, .remove, .delete, .tag-remove, [aria-label="Remove"], .x-button');
      if (closeButton) {
        console.log('[CRM Extension] Found close button in tag, clicking it');
        closeButton.click();
        return true;
      }

      // Strategy 2: Look for a close icon that might be a sibling element
      const parent = tagElement.parentElement;
      if (parent) {
        const siblingCloseButton = parent.querySelector('.close, .remove, .delete, .tag-remove, [aria-label="Remove"], .x-button');
        if (siblingCloseButton) {
          console.log('[CRM Extension] Found close button as sibling, clicking it');
          siblingCloseButton.click();
          return true;
        }
      }

      // Strategy 3: Look at all children and siblings for any element that looks like an X button
      const possibleXElements = [...Array.from(tagElement.querySelectorAll('*')), ...Array.from(parent ? parent.children : [])];
      for (const elem of possibleXElements) {
        const text = elem.textContent.trim();
        if (text === '×' || text === 'x' || text === '✕' || text === '✖' || text === 'X') {
          console.log('[CRM Extension] Found X button by text content, clicking it');
          elem.click();
          return true;
        }

        // Check if there's an X in the class name
        if (elem.className && (elem.className.includes('close') || elem.className.includes('delete') ||
            elem.className.includes('remove') || elem.className.includes('x-button'))) {
          console.log('[CRM Extension] Found X button by class name, clicking it');
          elem.click();
          return true;
        }

        // Check if there's an X in FontAwesome or other icon fonts
        if (elem.classList && (elem.classList.contains('fa-times') || elem.classList.contains('fa-close') ||
            elem.classList.contains('icon-close') || elem.classList.contains('icon-remove'))) {
          console.log('[CRM Extension] Found X button by icon class, clicking it');
          elem.click();
          return true;
        }
      }

      // Strategy 4: Check if the tag itself is clickable (might be a delete action)
      if (tagElement.tagName === 'BUTTON' || tagElement.tagName === 'A' ||
          tagElement.getAttribute('role') === 'button' ||
          window.getComputedStyle(tagElement).cursor === 'pointer') {
        console.log('[CRM Extension] Tag appears to be clickable, clicking it');
        tagElement.click();
        return true;
      }

      // Strategy 5: Look in parent containers for X buttons
      let currentParent = parent;
      for (let i = 0; i < 3 && currentParent; i++) {  // Look up to 3 levels up
        const xButtons = currentParent.querySelectorAll('button, span, i, div');
        for (const btn of xButtons) {
          const text = btn.textContent.trim();
          if (text === '×' || text === 'x' || text === '✕' || text === '✖' || text === 'X' ||
              btn.classList.contains('fa-times') || btn.classList.contains('fa-close') ||
              btn.classList.contains('close') || btn.classList.contains('remove')) {
            console.log('[CRM Extension] Found X button in parent container, clicking it');
            btn.click();
            return true;
          }
        }
        currentParent = currentParent.parentElement;
      }

      console.log('[CRM Extension] No method found to remove tag:', tagElement);
      return false;
    } catch (error) {
      console.error('[CRM Extension] Error removing tag:', error);
      return false;
    }
  }

  /**
   * Removes all detected removable tags
   * @returns {Promise} Promise that resolves when all tags are processed
   */
  export function removeAllTags() {
    return new Promise((resolve, reject) => {
      try {
        // First refresh our list of tags
        detectTags();

        let successCount = 0;
        const totalTags = foundTags.length;

        if (totalTags === 0) {
          console.log('[CRM Extension] No removable tags found');
          // Resolve with a result object
          resolve({
            success: true,
            message: "No tags to remove",
            removed: 0,
            total: 0
          });
          return;
        }

        console.log(`[CRM Extension] Attempting to remove ${totalTags} tags`);

        // Use a recursive approach to ensure we remove tags one by one with delays
        function removeTagsSequentially(index) {
          if (index >= foundTags.length) {
            console.log(`[CRM Extension] Removed ${successCount}/${totalTags} tags`);
            // Resolve with a result object
            resolve({
              success: true,
              message: `Removed ${successCount} of ${totalTags} tags`,
              removed: successCount,
              total: totalTags
            });
            return;
          }

          const tag = foundTags[index];
          console.log(`[CRM Extension] Removing tag: ${tag.text}`);

          if (removeTag(tag.element)) {
            successCount++;
          }

          // Schedule the next tag removal after a short delay
          setTimeout(() => {
            removeTagsSequentially(index + 1);
          }, 300); // 300ms delay between removals to let UI update
        }

        // Start the sequential removal process
        removeTagsSequentially(0);
      } catch (error) {
        console.error('[CRM Extension] Error in removeAllTags:', error);
        reject(error);
      }
    });
  }
