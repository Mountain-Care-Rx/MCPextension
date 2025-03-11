// zip.js - Create distributable ZIP files for each browser
const zipdir = require('zip-dir');
const fs = require('fs');
const path = require('path');

const version = require('./package.json').version;

// Create packages directory in the new location
const packagesDir = path.join(__dirname, 'dist');
if (!fs.existsSync(packagesDir)) {
  fs.mkdirSync(packagesDir, { recursive: true });
}

// Package for Chrome
zipdir(path.join(__dirname, 'dist-chrome'), { 
  saveTo: path.join(packagesDir, `dist-chrome.zip`),
  filter: (path, stat) => !path.includes('node_modules')
}, (err) => {
  if (err) {
    console.error('Error creating Chrome package:', err);
    return;
  }
  console.log(`✅ Chrome package created: dist/dist-chrome.zip`);
});

// Package for Edge
zipdir(path.join(__dirname, 'dist-edge'), {
  saveTo: path.join(packagesDir, `dist-edge.zip`),
  filter: (path, stat) => !path.includes('node_modules')
}, (err) => {
  if (err) {
    console.error('Error creating Edge package:', err);
    return;
  }
  console.log(`✅ Edge package created: dist/dist-edge.zip`);
});

// Package for Firefox
zipdir(path.join(__dirname, 'dist-firefox'), {
  saveTo: path.join(packagesDir, `dist-firefox.zip`),
  filter: (path, stat) => !path.includes('node_modules')
}, (err) => {
  if (err) {
    console.error('Error creating Firefox package:', err);
    return;
  }
  console.log(`✅ Firefox package created: dist/dist-firefox.zip`);
});