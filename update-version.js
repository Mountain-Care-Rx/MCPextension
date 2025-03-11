// update-version.js - Updates manifest.json and update files with date-based version

const fs = require('fs');
const path = require('path');

// Get current date in YYYY.MM.DD format
function getDateVersion() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// Update version in a file
function updateVersionInFile(filePath, versionPattern, newVersion) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(versionPattern, (match, prefix, version, suffix) => {
      return `${prefix}${newVersion}${suffix}`;
    });

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated version in ${filePath} to ${newVersion}`);
      return true;
    } else {
      console.log(`ℹ️ No version update needed in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating version in ${filePath}:`, error);
    return false;
  }
}

// Main function
function updateVersions() {
  const newVersion = getDateVersion();
  console.log(`🔄 Updating versions to ${newVersion}`);

  // Update manifest.json files
  updateVersionInFile(
    path.join(__dirname, 'src/manifest.json'),
    /"version"\s*:\s*"([^"]+)"/,
    newVersion
  );
  
  updateVersionInFile(
    path.join(__dirname, 'src/manifest-firefox.json'),
    /"version"\s*:\s*"([^"]+)"/,
    newVersion
  );

  // Update update manifests with new GitHub URLs
  updateVersionInFile(
    path.join(__dirname, 'chrome-updates.xml'),
    /(version=")([^"]+)(")/,
    newVersion
  );
  
  updateVersionInFile(
    path.join(__dirname, 'edge-updates.xml'),
    /(version=")([^"]+)(")/,
    newVersion
  );
  
  updateVersionInFile(
    path.join(__dirname, 'firefox-updates.json'),
    /("version"\s*:\s*")([^"]+)(")/,
    newVersion
  );

  console.log('✅ Version update complete!');
}

// Run the update
updateVersions();