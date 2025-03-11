// build.js - Bundles and prepares the Chrome/Edge/Firefox extension with date-based versioning

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const archiver = require('archiver');

// Configure paths
const GITHUB_REPO_PATH = path.join("C:", "Users", "mcpadmin", "Desktop", "Other", "MCPextension", "MCPextension");
const PROJECT_PATH = path.join("C:", "Users", "mcpadmin", "Desktop", "Other", "BrowserExt");

// Helper function to get current date in YYYY.MM.DD format
function getDateVersion() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// Helper function to update version in a file
function updateVersionInFile(filePath, versionPattern, newVersion) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Validate JSON for manifest files before updating
    if (filePath.endsWith('manifest.json') || filePath.endsWith('manifest-firefox.json')) {
      try {
        JSON.parse(content);
      } catch (jsonError) {
        console.error(`❌ File ${filePath} is not valid JSON before updating. Skipping.`);
        return false;
      }
    }
    
    // For manifest files, use a more specific pattern to ensure we only replace the version field
    if (filePath.endsWith('manifest.json') || filePath.endsWith('manifest-firefox.json')) {
      const regex = /"version"\s*:\s*"([^"]+)"/;
      const updatedContent = content.replace(regex, `"version": "${newVersion}"`);
      
      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        
        // Validate the updated JSON
        try {
          JSON.parse(updatedContent);
          console.log(`✅ Updated version in ${filePath} to ${newVersion}`);
          return true;
        } catch (jsonError) {
          console.error(`❌ Error: Updated file ${filePath} is not valid JSON after version update.`);
          // Restore the original content
          fs.writeFileSync(filePath, content, 'utf8');
          return false;
        }
      } else {
        console.log(`ℹ️ No version update needed in ${filePath}`);
        return false;
      }
    } else {
      // For non-manifest files, use the provided pattern
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
    }
  } catch (error) {
    console.error(`❌ Error updating version in ${filePath}:`, error);
    return false;
  }
}

// Helper function to create or update file
function createOrUpdateFile(filePath, content) {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created/updated file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating/updating file: ${filePath}`, error);
    return false;
  }
}

// Update all version information to current date
function updateVersions() {
  const newVersion = getDateVersion();
  console.log(`🔄 Updating versions to ${newVersion}`);

  // Update manifest.json files
  updateVersionInFile(
    path.join(PROJECT_PATH, 'src/manifest.json'),
    /"version"\s*:\s*"([^"]+)"/,
    newVersion
  );
  
  updateVersionInFile(
    path.join(PROJECT_PATH, 'src/manifest-firefox.json'),
    /"version"\s*:\s*"([^"]+)"/,
    newVersion
  );

  // Create or update chrome-updates.xml
  const chromeUpdatesXml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="[YOUR_CHROME_EXTENSION_ID]">
    <updatecheck codebase="https://latteralus.github.io/MCPextension/dist/dist-chrome.zip" version="${newVersion}" />
  </app>
</gupdate>`;

  createOrUpdateFile(path.join(GITHUB_REPO_PATH, 'chrome-updates.xml'), chromeUpdatesXml);

  // Create or update edge-updates.xml
  const edgeUpdatesXml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="[YOUR_EDGE_EXTENSION_ID]">
    <updatecheck codebase="https://latteralus.github.io/MCPextension/dist/dist-edge.zip" version="${newVersion}" />
  </app>
</gupdate>`;

  createOrUpdateFile(path.join(GITHUB_REPO_PATH, 'edge-updates.xml'), edgeUpdatesXml);

  // Create or update updates.xml
  const updatesXml = `<?xml version="1.0" encoding="UTF-8"?>
<updates>
  <browser id="chrome">
    <redirect url="https://latteralus.github.io/MCPextension/chrome-updates.xml" />
  </browser>
  <browser id="edge">
    <redirect url="https://latteralus.github.io/MCPextension/edge-updates.xml" />
  </browser>
  <browser id="firefox">
    <redirect url="https://latteralus.github.io/MCPextension/firefox-updates.json" />
  </browser>
  <default>
    <!-- Default to Chrome format if browser can't be determined -->
    <redirect url="https://latteralus.github.io/MCPextension/chrome-updates.xml" />
  </default>
</updates>`;

  createOrUpdateFile(path.join(GITHUB_REPO_PATH, 'updates.xml'), updatesXml);

  // Create or update firefox-updates.json
  const firefoxUpdatesJson = `{
  "addons": {
    "crm-plus@example.com": {
      "updates": [
        {
          "version": "${newVersion}",
          "update_link": "https://latteralus.github.io/MCPextension/dist/dist-firefox.zip",
          "applications": {
            "gecko": {
              "strict_min_version": "109.0"
            }
          }
        }
      ]
    }
  }
}`;

  createOrUpdateFile(path.join(GITHUB_REPO_PATH, 'firefox-updates.json'), firefoxUpdatesJson);

  return newVersion;
}

// Helper function to copy files/directories recursively.
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Helper function to create browser-specific builds
function createBrowserSpecificBuild(browser) {
  console.log(`Creating ${browser} build...`);
  
  // Define the output directory for the bundled extension.
  const distDir = path.join(PROJECT_PATH, `dist-${browser.toLowerCase()}`);

  // Clean and recreate the dist directory.
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir);

  // List of JS files to bundle.
  const scriptsToBundle = [
    { entry: "src/content/content.js", output: "content.js" },
    { entry: "src/background/background.js", output: "background.js" },
    { entry: "src/popup/popup.js", output: "popup.js" }
  ];

  // Bundle each script.
  scriptsToBundle.forEach(({ entry, output }) => {
    esbuild.buildSync({
      entryPoints: [path.join(PROJECT_PATH, entry)],
      outfile: path.join(distDir, output),
      bundle: true,
      minify: true,
      format: "iife",
      target: ["es2020"],
      define: {
        'process.env.BROWSER': JSON.stringify(browser)
      }
    });
  });

  // Create modules directory structure in dist
  const modulesDir = path.join(distDir, "modules");
  const uiDir = path.join(modulesDir, "ui");
  const componentsDir = path.join(uiDir, "components");
  const dropdownsDir = path.join(componentsDir, "dropdowns");
  const stylesDir = path.join(uiDir, "styles");

  // Make sure all directories exist
  [modulesDir, uiDir, componentsDir, dropdownsDir, stylesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

// Copy the modules files
const moduleFilesToCopy = [
  // Core utilities
  { src: "src/modules/phoneUtils.js", dest: "modules/phoneUtils.js" },
  { src: "src/modules/nameUtils.js", dest: "modules/nameUtils.js" },
  { src: "src/modules/dobUtils.js", dest: "modules/dobUtils.js" },
  { src: "src/modules/srxIdUtils.js", dest: "modules/srxIdUtils.js" },
  { src: "src/modules/consoleMonitor.js", dest: "modules/consoleMonitor.js" },
  { src: "src/modules/autoPhoneCopy.js", dest: "modules/autoPhoneCopy.js" },
  { src: "src/modules/alertUtils.js", dest: "modules/alertUtils.js" }, // New alert system module
  
  // UI Components
  { src: "src/modules/ui/headerBar.js", dest: "modules/ui/headerBar.js" },
  { src: "src/modules/ui/styles/headerStyles.js", dest: "modules/ui/styles/headerStyles.js" },
  { src: "src/modules/ui/components/clickableDisplay.js", dest: "modules/ui/components/clickableDisplay.js" },
  { src: "src/modules/ui/components/actionsGroup.js", dest: "modules/ui/components/actionsGroup.js" },
  { src: "src/modules/ui/components/dropdownsGroup.js", dest: "modules/ui/components/dropdownsGroup.js" },
  { src: "src/modules/ui/components/settingsGroup.js", dest: "modules/ui/components/settingsGroup.js" },
  
  // Dropdown Components
  { src: "src/modules/ui/components/dropdowns/semaDropdown.js", dest: "modules/ui/components/dropdowns/semaDropdown.js" },
  { src: "src/modules/ui/components/dropdowns/vialSemaDropdown.js", dest: "modules/ui/components/dropdowns/vialSemaDropdown.js" },
  { src: "src/modules/ui/components/dropdowns/tirzDropdown.js", dest: "modules/ui/components/dropdowns/tirzDropdown.js" },
  { src: "src/modules/ui/components/dropdowns/vialTirzDropdown.js", dest: "modules/ui/components/dropdowns/vialTirzDropdown.js" },
  { src: "src/modules/ui/components/dropdowns/tagsDropdown.js", dest: "modules/ui/components/dropdowns/tagsDropdown.js" },
  { src: "src/modules/ui/components/dropdowns/automationDropdown.js", dest: "modules/ui/components/dropdowns/automationDropdown.js" }
];

  // Copy each module file
  moduleFilesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(PROJECT_PATH, src);
    const destPath = path.join(distDir, dest);
    
    if (fs.existsSync(srcPath)) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      console.warn(`⚠️ Module file not found: ${src}`);
    }
  });

  // Copy essential static files.
  const filesToCopy = [
    { src: browser === "Firefox" ? "src/manifest-firefox.json" : "src/manifest.json", dest: "manifest.json" },
    { src: "src/popup/popup.html", dest: "popup.html" }
  ];

  filesToCopy.forEach(({ src, dest }) => {
    if (fs.existsSync(path.join(PROJECT_PATH, src))) {
      copyRecursiveSync(path.join(PROJECT_PATH, src), path.join(distDir, dest));
    } else {
      console.warn(`⚠️ File not found: ${src}`);
    }
  });

  // Copy extension icons.
  const assetsPath = path.join(PROJECT_PATH, "src", "assets");
  if (fs.existsSync(assetsPath)) {
    copyRecursiveSync(assetsPath, path.join(distDir, "assets"));
  }

  // Optionally, copy styles if they exist.
  const stylesPath = path.join(PROJECT_PATH, "src", "styles");
  if (fs.existsSync(stylesPath)) {
    copyRecursiveSync(stylesPath, path.join(distDir, "styles"));
  }

  console.log(`✅ ${browser} build complete! Your bundled extension is in the 'dist-${browser.toLowerCase()}' folder.`);

  // Create ZIP archive for distribution
  const zipPath = path.join(PROJECT_PATH, `dist-${browser.toLowerCase()}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Log when archive is finalized
  output.on('close', () => {
    console.log(`✅ ${browser} archive created: ${zipPath} (${archive.pointer()} total bytes)`);
    
    // Copy ZIP to GitHub repo
    const repoZipPath = path.join(GITHUB_REPO_PATH, `dist/dist-${browser.toLowerCase()}.zip`);
    
    // Make sure the dist directory exists in the repo
    const repoDistDir = path.join(GITHUB_REPO_PATH, 'dist');
    if (!fs.existsSync(repoDistDir)) {
      fs.mkdirSync(repoDistDir, { recursive: true });
    }
    
    fs.copyFileSync(zipPath, repoZipPath);
    console.log(`✅ Copied ${browser} archive to GitHub repo: ${repoZipPath}`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(distDir, false);
  archive.finalize();
}

// Main build process
console.log('🚀 Starting build process...');

// Step 1: Update all version information to current date
const currentVersion = updateVersions();
console.log(`📅 Using version: ${currentVersion}`);

// Step 2: Create builds for all browsers
createBrowserSpecificBuild("Chrome");
createBrowserSpecificBuild("Edge");
createBrowserSpecificBuild("Firefox");

console.log('🎉 All builds completed successfully!');