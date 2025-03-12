# CRM+ Extension Developer Guide

## Overview

CRM+ enhances the MtnCareRx CRM system with a convenient toolbar that provides patient information at a glance, quick copy functions, and automation tools for common workflows. The extension specializes in medication workflows for Semaglutide (Sema) and Tirzepatide (Tirz).

## Quick Reference

- **Extension Type**: Browser extension (Chrome, Edge, Firefox)
- **Target Site**: `*://app.mtncarerx.com/v2/*`
- **Key Features**: Header toolbar, patient data display, automation tools, tag management
- **Main Settings**:
  - `crmplus_headerBarVisible`: Controls header visibility
  - `crmplus_autoCopyPhone`: Controls automatic phone copying
  - `crmplus_automationEnabled`: Controls automation features visibility

## Core Components

### Header Toolbar
```
headerBar.js → Creates and manages the fixed header
├── clickableDisplay.js → Patient info displays (Name, Phone, DOB, SRx ID)
├── actionsGroup.js → Action buttons
├── dropdownsGroup.js → Container for all dropdown menus
│   ├── automationDropdown.js → Nested Sema/Tirz automation options
│   └── tagsDropdown.js → Tag management options
└── settingsGroup.js → Settings menu
```

### Utility Modules
```
phoneUtils.js → Phone detection, formatting, and clipboard operations
srxIdUtils.js → SRx ID detection strategies
consoleMonitor.js → Console message monitoring for debugging
autoPhoneCopy.js → Automatic phone number copying
```

## Technical Overview

### Initialization Flow

1. **Extension Installation**: `background.js` sets default settings
2. **Page Load**: `content.js` injects and sets up all components
3. **Toolbar Creation**: `headerBar.js` builds the UI and initializes detection
4. **Periodic Updates**: Timer-based updates refresh patient data
5. **User Interaction**: Event listeners handle dropdown toggles and settings changes

### Cross-Browser Compatibility

The extension implements a detection pattern for cross-browser support:
```javascript
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
```

This pattern is used throughout the codebase to ensure consistent API access.

### Module Dependencies

#### content.js
- Imports from: consoleMonitor.js, headerBar.js, autoPhoneCopy.js, srxIdUtils.js
- Primary initialization point for all extension features

#### headerBar.js
- Imports from: phoneUtils.js, clickableDisplay.js, actionsGroup.js, dropdownsGroup.js, settingsGroup.js, headerStyles.js, srxIdUtils.js
- Creates and manages the main UI component

#### automationDropdown.js & tagsDropdown.js
- Import from: dropdownsGroup.js, phoneUtils.js
- Provide specialized functionality for automation tasks and tag management

### Settings System

All settings use localStorage for persistence with optional sync to browser.storage:

```javascript
// Get a setting
const isEnabled = localStorage.getItem("crmplus_settingName") === "true";

// Set a setting
localStorage.setItem("crmplus_settingName", value.toString());
```

The background script handles synchronization between localStorage and browser.storage.

### UI Component Hierarchy

```
mcp-crm-header (main container)
├── logoGroup
├── nameGroup (clickable)
├── phoneGroup (clickable)
├── dobGroup (clickable)
├── srxIdGroup (clickable)
├── actionsGroup
├── dropdownsGroup
│   ├── automation-dropdown
│   │   ├── sema-nested-dropdown
│   │   └── tirz-nested-dropdown
│   └── tags-dropdown
│       ├── vial-sema-nested-dropdown
│       └── vial-tirz-nested-dropdown
├── spacer
└── settingsGroup
```

## Key Functions

### Patient Data Detection

- **Phone**: `getRawPhoneNumber()` in phoneUtils.js uses multiple selectors to find phone numbers
- **SRx ID**: `detectSRxID()` in srxIdUtils.js tries multiple methods including URL extraction
- **Other Fields**: `updatePatientFields()` in headerBar.js periodically updates all patient information

### Automation Workflows

- **Workflow Map**: `finalSelectionMap` in automationDropdown.js maps dropdown labels to exact system labels
- **Workflow Execution**: `runConsoleBased()` in automationDropdown.js handles the automation execution
- **Tag Application**: `selectTagOption()` in tagsDropdown.js manages tag selection and application

### Extension Settings

- **Initial Setup**: background.js handles installation and default settings
- **UI Controls**: settingsGroup.js provides the toggle interface
- **Visibility Toggle**: toggleHeaderVisibility() in headerBar.js controls toolbar visibility

## Build System

The build.js script creates browser-specific builds using esbuild:
```
# Build all versions
node build.js

# Output
/dist-chrome/    # Chrome build
/dist-edge/      # Edge build
/dist-firefox/   # Firefox build
```

## Modifying the Extension

### Adding a New Dropdown Item

1. Locate the relevant dropdown file (e.g., automationDropdown.js or tagsDropdown.js)
2. Add your new option to the relevant section:
   ```javascript
   // Example: Adding a new Sema option
   const newSemaItem = document.createElement("a");
   newSemaItem.className = "nested-dropdown-item";
   newSemaItem.textContent = "New Sema Option";
   newSemaItem.addEventListener("click", (e) => {
     e.stopPropagation();
     closeAllDropdowns();
     setTimeout(() => {
       // Your action function here
     }, 300);
   });
   semaNestedContent.appendChild(newSemaItem);
   ```

### Creating a New Module

1. Create your new .js file in the appropriate modules directory
2. Import any dependencies at the top of your file
3. Export your functions for use by other modules
4. Import and use your module in the relevant files
5. Add your file to the moduleFilesToCopy array in build.js

### Debugging Tips

- Check the browser console for logs with the prefix `[CRM Extension]`
- The consoleMonitor.js module can be used to capture and respond to specific console messages
- Toast notifications use showToast() from phoneUtils.js to display user messages