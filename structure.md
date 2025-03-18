# CRM+ Extension Project Structure

## Root Files
- `build.js` - Main build script for packaging the extension
- `package.json` - Project dependencies and scripts
- `manifest.json` - Chrome/Edge extension manifest
- `manifest-firefox.json` - Firefox-specific manifest
- `update-version.js` - Script to update version numbers
- `zip.js` - Creates distribution zip files
- `extensionplan.md` - Developer guide for the extension
- `structure.md` - This file documenting the project structure

## Update Files
- `chrome-updates.xml` - Chrome extension update manifest
- `edge-updates.xml` - Edge extension update manifest
- `firefox-updates.json` - Firefox extension update manifest
- `updates.xml` - Unified update redirector for all browsers

## Source Directories

### /src
- `content.js` - Main content script injected into pages
- `background.js` - Extension background script
- `popup.html` - Popup interface HTML
- `popup.js` - Popup interface functionality

### /src/modules
Core utility modules used throughout the extension:
- `phoneUtils.js` - Phone number detection and formatting
- `nameUtils.js` - Patient name detection
- `dobUtils.js` - Date of birth detection and formatting
- `srxIdUtils.js` - SRx ID detection
- `consoleMonitor.js` - Console message monitoring
- `autoPhoneCopy.js` - Automatic phone copying
- `alertUtils.js` - Alert system for notifications
- `historyUtils.js` - Patient visit history tracking
- `tagRemoveUtils.js` - Tag removal functionality
- `automationRemoveUtils.js` - Automation workflow removal

### /src/modules/chat
Chat functionality module:
- `index.js` - Main API for chat module
- `monitor.js` - Chat monitoring system
- `dom.js` - DOM manipulation for chat messages
- `network.js` - Network monitoring for chat traffic
- `storage.js` - Chat data management
- `styles.js` - CSS styles for chat components
- `ui.js` - UI components for chat interface

### /src/modules/ui
UI component modules:
- `headerBar.js` - Main toolbar implementation

### /src/modules/ui/components
UI subcomponents:
- `clickableDisplay.js` - Display elements with click actions
- `actionsGroup.js` - Action button container
- `dropdownsGroup.js` - Dropdown container and utilities
- `settingsGroup.js` - Settings menu implementation

### /src/modules/ui/components/dropdowns
Dropdown-specific components:
- `automationDropdown.js` - Automation workflow options
- `historyDropdown.js` - Patient history dropdown
- `semaDropdown.js` - Semaglutide workflow options
- `tagsDropdown.js` - Tag management options
- `tirzDropdown.js` - Tirzepatide workflow options
- `vialSemaDropdown.js` - Vial-specific Sema options
- `vialTirzDropdown.js` - Vial-specific Tirz options

### /src/modules/ui/styles
UI style modules:
- `headerStyles.js` - CSS styles for header toolbar

### /dist
Distribution files:
- `/dist-chrome/` - Chrome build output
- `/dist-edge/` - Edge build output
- `/dist-firefox/` - Firefox build output
- `.zip` files for each browser

## Asset Directories
- `/src/assets/` - Icons and images
- `/src/styles/` - Global CSS styles