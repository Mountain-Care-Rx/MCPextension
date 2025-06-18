import { showToast } from "../../../phoneUtils";
import { removeAllTags, removeAllAutomations } from '../../../ui/headerBar.js';
// List of frequent tags (edit this array to add/remove tags)
const FREQUENT_TAGS = [
  "wait",
  "warm",
  "provider-wait",
  "tirz-vial-price",
  "tirz-syringe-price",
  "sema-vial-price",
  "sema-syringe-price",
  "ship-duration",
  "no-refill",
  "no-titration",
  "pickup-msg",
  "call",
  "fda",
  "glp",
  "states",
  "video",
  "talk-to-crm",
  // Add more tags as needed
];

export function createFrequentTagsDropdown() {
  // Styled bar similar to apiDropdown
  const tagBar = document.createElement("div");
  tagBar.id = "crm-frequent-tags-bar";
  tagBar.style.display = "flex";
  tagBar.style.flexDirection = "row";
  tagBar.style.alignItems = "center";
  tagBar.style.gap = "8px";
  tagBar.style.background = "#23272e";
  tagBar.style.borderRadius = "4px";
  tagBar.style.padding = "4px 8px";
  tagBar.style.margin = "0 0 4px 0";
  tagBar.style.minWidth = "0";
  tagBar.style.boxShadow = "0px 4px 8px 0px rgba(0,0,0,0.10)";
  tagBar.style.border = "1px solid rgba(255,255,255,0.06)";

  const label = document.createElement("label");
  label.textContent = "📎Hi I'm Snippy:";
  label.style.fontSize = "12px";
  label.style.color = "#e6e6e6";
  label.style.marginRight = "2px";

  // Custom typable dropdown
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Type or select a tag";
  input.autocomplete = "off";
  input.style.background = "#23272e";
  input.style.color = "#a0e0ff";
  input.style.border = "1px solid #444";
  input.style.borderRadius = "2px";
  input.style.padding = "2px 6px";
  input.style.fontWeight = "normal";
  input.style.fontSize = "12px";
  input.style.height = "24px";
  input.style.minWidth = "160px";
  input.style.boxSizing = "border-box";
  input.style.verticalAlign = "middle";

  // Suggestion list
  const suggestionBox = document.createElement("div");
  suggestionBox.style.position = "absolute";
  suggestionBox.style.background = "#23272e";
  suggestionBox.style.color = "#a0e0ff";
  suggestionBox.style.border = "1px solid #444";
  suggestionBox.style.borderRadius = "2px";
  suggestionBox.style.boxShadow = "0px 4px 8px 0px rgba(0,0,0,0.10)";
  suggestionBox.style.fontSize = "12px";
  suggestionBox.style.marginTop = "2px";
  suggestionBox.style.zIndex = "10000";
  suggestionBox.style.display = "none";
  suggestionBox.style.maxHeight = "180px";
  suggestionBox.style.overflowY = "auto";

  // Container for relative positioning
  const inputWrapper = document.createElement("div");
  inputWrapper.style.position = "relative";
  inputWrapper.appendChild(input);
  inputWrapper.appendChild(suggestionBox);

  let filteredTags = [];
  let selectedIndex = -1;

  function updateSuggestions() {
    const value = input.value.trim().toLowerCase();
    // Use sorted tags
    const sortedTags = getSortedTags();
    if (!value && document.activeElement === input) {
      filteredTags = [...sortedTags];
    } else {
      filteredTags = sortedTags.filter(tag => tag.toLowerCase().includes(value));
    }
    suggestionBox.innerHTML = "";
    selectedIndex = -1;
    if (filteredTags.length === 0) {
      suggestionBox.style.display = "none";
      return;
    }
    filteredTags.forEach((tag, idx) => {
      const item = document.createElement("div");
      item.textContent = tag;
      item.style.padding = "4px 8px";
      item.style.cursor = "pointer";
      item.style.borderRadius = "2px";
      // Highlight on mouse hover
      item.addEventListener("mouseenter", () => {
        selectedIndex = idx;
        updateSuggestionHighlight();
      });
      item.addEventListener("mouseleave", () => {
        selectedIndex = -1;
        updateSuggestionHighlight();
      });
      item.addEventListener("mousedown", async (e) => {
        e.preventDefault();
        await selectTag(tag);
      });
      if (idx === selectedIndex) {
        item.style.background = "#1e90ff";
        item.style.color = "#fff";
      }
      suggestionBox.appendChild(item);
    });
    suggestionBox.style.display = "block";
  }

  async function selectTag(tag) {
    // Remove focus from input to trigger blur and hide suggestions
    input.blur();
    // Wait a bit to ensure the input blur doesn't interfere with tag selection
    setTimeout(async () => {
      await selectTagOptionAsync(tag);
      incrementTagUsage(tag);
      input.value = "";
      suggestionBox.style.display = "none";
    }, 120);
  }

  input.addEventListener("input", updateSuggestions);
  input.addEventListener("focus", updateSuggestions);
  input.addEventListener("blur", () => {
    setTimeout(() => suggestionBox.style.display = "none", 100);
  });

  input.addEventListener("keydown", (e) => {
    if (suggestionBox.style.display === "block" && filteredTags.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredTags.length;
        updateSuggestionHighlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredTags.length) % filteredTags.length;
        updateSuggestionHighlight();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredTags.length) {
          selectTag(filteredTags[selectedIndex]);
        } else if (filteredTags.length === 1) {
          selectTag(filteredTags[0]);
        }
      } else if (e.key === "Escape") {
        suggestionBox.style.display = "none";
      }
    }
  });

  function updateSuggestionHighlight() {
    Array.from(suggestionBox.children).forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.style.background = "#1e90ff";
        item.style.color = "#fff";
      } else {
        item.style.background = "#23272e";
        item.style.color = "#a0e0ff";
      }
    });
  }

  tagBar.appendChild(label);
  tagBar.appendChild(inputWrapper);
  return tagBar;
}
// Use the robust tag selection logic from apiDropdown, but do not remove tags first
function selectTagOptionAsync(tagText) {
  return new Promise((resolve) => {
    let tagInput = findTagInput();

    if (tagInput) {
      tagInput.focus();
      setTimeout(() => {
        tagInput.value = tagText;
        tagInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Poll for up to 500ms for the tag option to appear
        const start = Date.now();
        const pollInterval = 50;
        const maxWait = 500;
        function trySelect() {
          const options = document.querySelectorAll('.v-list-item, .dropdown-item, .select-option, li');
          for (const option of options) {
            if (option.textContent.toLowerCase().includes(tagText)) {
              option.click();
              showToast(`Selected tag: ${tagText}`);
              setTimeout(resolve, 300); // allow UI to update
              return;
            }
          }
          if (Date.now() - start < maxWait) {
            setTimeout(trySelect, pollInterval);
          } else {
            // fallback: try the old logic
            let found = false;
            for (const option of options) {
              if (option.textContent.toLowerCase().includes(tagText)) {
                option.click();
                found = true;
                showToast(`Selected tag: ${tagText}`);
                break;
              }
            }
            if (!found) {
              const allElements = document.querySelectorAll('*');
              for (const elem of allElements) {
                if (elem.textContent.trim().toLowerCase() === tagText) {
                  elem.click();
                  found = true;
                  showToast(`Selected tag: ${tagText}`);
                  break;
                }
              }
              if (!found) {
                tagInput.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true
                }));
              }
            }
            setTimeout(resolve, 300);
          }
        }
        trySelect();
      }, 400); // Wait for dropdown to appear
    } else {
      showToast("Tags field not found");
      resolve();
    }
  });
}

// Use the robust findTagInput from apiDropdown
function findTagInput() {
  // Strategy 1: Original selector - looking for "Add Tags" placeholder
  let tagInput = document.querySelector('input[placeholder="Add Tags"]');
  if (tagInput) return tagInput;

  // Strategy 2: Broader placeholder pattern - any input with "tag" in placeholder
  const tagInputs = Array.from(document.querySelectorAll('input[placeholder]')).filter(input => {
    return input.placeholder.toLowerCase().includes('tag');
  });
  if (tagInputs.length > 0) return tagInputs[0];

  // Strategy 3: Input within element with tag-related class
  const tagContainers = document.querySelectorAll('.tag-input, .tags-input, .tag-container');
  for (const container of tagContainers) {
    const input = container.querySelector('input');
    if (input) return input;
  }

  // Strategy 4: Looking for smartList.bulkTags placeholder (from your example)
  tagInput = document.querySelector('input[placeholder="smartList.bulkTags.addTags"]');
  if (tagInput) return tagInput;

  // Strategy 5: Generic attribute search - looking for any input that might be for tags
  const possibleTagInputs = document.querySelectorAll('.hl-text-input');
  if (possibleTagInputs.length > 0) {
    return possibleTagInputs[0]; // Return the first one as best guess
  }

  // If no tag input found with any strategy
  console.error('[CRM Extension] Could not find tag input field with any strategy');

  // One last attempt - log all inputs to help diagnose
  const allInputs = document.querySelectorAll('input');
  console.log('[CRM Extension] All inputs on page:', allInputs);

  return null;
}

// Track tag usage in localStorage
function getTagUsage() {
  try {
    return JSON.parse(localStorage.getItem('crm_frequent_tag_usage') || '{}');
  } catch {
    return {};
  }
}
function incrementTagUsage(tag) {
  const usage = getTagUsage();
  usage[tag] = (usage[tag] || 0) + 1;
  localStorage.setItem('crm_frequent_tag_usage', JSON.stringify(usage));
}
function getSortedTags() {
  const usage = getTagUsage();
  // Sort by usage descending, then alphabetically
  return [...FREQUENT_TAGS].sort((a, b) => {
    const ua = usage[a] || 0;
    const ub = usage[b] || 0;
    if (ua !== ub) return ub - ua;
    return a.localeCompare(b);
  });
}
