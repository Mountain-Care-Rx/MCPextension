// zip.js - Create distributable ZIP files for each browser
const zipdir = require('zip-dir');
const fs = require('fs');
const path = require('path');

const version = require('./package.json').version;

// Create packages directory if it doesn't exist
const packagesDir = path.join(__dirname, 'packages');
if (!fs.existsSync(packagesDir)) {
  fs.mkdirSync(packagesDir);
}

// Package for Chrome
zipdir(path.join(__dirname, 'dist-chrome'), { 
  saveTo: path.join(packagesDir, `crm-plus-chrome-v${version}.zip`),
  filter: (path, stat) => !path.includes('node_modules')
}, (err) => {
  if (err) {
    console.error('Error creating Chrome package:', err);
    return;
  }
  console.log(`✅ Chrome package created: crm-plus-chrome-v${version}.zip`);
});

// Package for Edge
zipdir(path.join(__dirname, 'dist-edge'), {
  saveTo: path.join(packagesDir, `crm-plus-edge-v${version}.zip`),
  filter: (path, stat) => !path.includes('node_modules')
}, (err) => {
  if (err) {
    console.error('Error creating Edge package:', err);
    return;
  }
  console.log(`✅ Edge package created: crm-plus-edge-v${version}.zip`);
});

// Package for Firefox
zipdir(path.join(__dirname, 'dist-firefox'), {
  saveTo: path.join(packagesDir, `crm-plus-firefox-v${version}.xpi`),
  filter: (path, stat) => !path.includes('node_modules')
}, (err) => {
  if (err) {
    console.error('Error creating Firefox package:', err);
    return;
  }
  console.log(`✅ Firefox package created: crm-plus-firefox-v${version}.xpi`);
});