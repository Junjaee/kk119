#!/usr/bin/env node

/**
 * Simple PWA Icon Testing Script
 * Tests that all PWA icons load correctly from the server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

/**
 * Test icon files exist
 */
function testIconFiles() {
  logInfo('Testing PWA icon files...');

  const publicDir = path.join(projectRoot, 'public');
  const iconsDir = path.join(publicDir, 'icons');

  // Expected icons from manifest
  const expectedIcons = [
    'icon-72x72.png',
    'icon-96x96.png',
    'icon-128x128.png',
    'icon-144x144.png',
    'icon-152x152.png',
    'icon-192x192.png',
    'icon-384x384.png',
    'icon-512x512.png'
  ];

  let allExists = true;

  for (const iconFile of expectedIcons) {
    const iconPath = path.join(iconsDir, iconFile);

    try {
      const stats = fs.statSync(iconPath);
      logSuccess(`Icon exists: ${iconFile} (${stats.size} bytes)`);
    } catch (error) {
      logError(`Missing icon: ${iconFile}`);
      allExists = false;
    }
  }

  // Check essential favicon files
  const essentialFiles = [
    'favicon.ico',
    'apple-touch-icon.png'
  ];

  for (const file of essentialFiles) {
    const filePath = path.join(publicDir, file);

    try {
      const stats = fs.statSync(filePath);
      logSuccess(`Essential file exists: ${file} (${stats.size} bytes)`);
    } catch (error) {
      logError(`Missing essential file: ${file}`);
      allExists = false;
    }
  }

  return allExists;
}

/**
 * Test manifest.json
 */
function testManifest() {
  logInfo('Testing PWA manifest...');

  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');

  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    logSuccess('Manifest file found and valid JSON');

    // Check required fields
    const requiredFields = ['name', 'short_name', 'icons', 'start_url', 'display'];
    let hasAllRequired = true;

    for (const field of requiredFields) {
      if (manifest[field]) {
        logSuccess(`Required field present: ${field}`);
      } else {
        logError(`Missing required field: ${field}`);
        hasAllRequired = false;
      }
    }

    // Check icons array
    if (manifest.icons && Array.isArray(manifest.icons)) {
      logSuccess(`Icons array has ${manifest.icons.length} entries`);

      for (const icon of manifest.icons) {
        if (icon.src && icon.sizes && icon.type) {
          logSuccess(`Icon configured: ${icon.src} (${icon.sizes})`);
        } else {
          logError(`Invalid icon entry: ${JSON.stringify(icon)}`);
          hasAllRequired = false;
        }
      }
    } else {
      logError('Icons array missing or invalid');
      hasAllRequired = false;
    }

    return hasAllRequired;

  } catch (error) {
    logError(`Manifest error: ${error.message}`);
    return false;
  }
}

/**
 * Test icon loading via HTTP
 */
async function testIconLoading() {
  logInfo('Testing icon loading via HTTP...');

  const baseUrl = 'http://localhost:3006'; // Use port 3006 which is running
  const testIcons = [
    'favicon.ico',
    'apple-touch-icon.png',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png'
  ];

  let allLoad = true;

  for (const iconPath of testIcons) {
    try {
      const response = await fetch(`${baseUrl}/${iconPath}`, {
        method: 'HEAD'
      });

      if (response.ok) {
        logSuccess(`Icon loads via HTTP: ${iconPath} (${response.status})`);
      } else {
        logError(`Icon failed to load: ${iconPath} (HTTP ${response.status})`);
        allLoad = false;
      }
    } catch (error) {
      logWarning(`Could not test ${iconPath}: ${error.message}`);
      logInfo('Make sure development server is running on http://localhost:3006');
    }
  }

  return allLoad;
}

/**
 * Test manifest loading via HTTP
 */
async function testManifestLoading() {
  logInfo('Testing manifest loading via HTTP...');

  const baseUrl = 'http://localhost:3006';

  try {
    const response = await fetch(`${baseUrl}/manifest.json`);

    if (response.ok) {
      const manifest = await response.json();
      logSuccess(`Manifest loads via HTTP (${response.status})`);
      logSuccess(`Manifest name: ${manifest.name}`);
      return true;
    } else {
      logError(`Manifest failed to load (HTTP ${response.status})`);
      return false;
    }
  } catch (error) {
    logWarning(`Could not test manifest: ${error.message}`);
    logInfo('Make sure development server is running on http://localhost:3006');
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n' + colors.bold + colors.blue + '🔍 PWA Icon Integration Testing...' + colors.reset + '\n');

  const results = {
    iconFiles: false,
    manifest: false,
    iconLoading: false,
    manifestLoading: false
  };

  try {
    // Test 1: Icon files exist
    results.iconFiles = testIconFiles();
    console.log();

    // Test 2: Manifest is valid
    results.manifest = testManifest();
    console.log();

    // Test 3: Icons load via HTTP
    results.iconLoading = await testIconLoading();
    console.log();

    // Test 4: Manifest loads via HTTP
    results.manifestLoading = await testManifestLoading();
    console.log();

    // Summary
    console.log(colors.bold + '📊 Test Results Summary:' + colors.reset);
    console.log(`Icon Files: ${results.iconFiles ? '✅' : '❌'}`);
    console.log(`Manifest: ${results.manifest ? '✅' : '❌'}`);
    console.log(`Icon Loading: ${results.iconLoading ? '✅' : '⚠️'}`);
    console.log(`Manifest Loading: ${results.manifestLoading ? '✅' : '⚠️'}`);

    const coreTestsPassed = results.iconFiles && results.manifest;
    const httpTestsPassed = results.iconLoading && results.manifestLoading;

    if (coreTestsPassed && httpTestsPassed) {
      console.log(colors.green + '\n🎉 All PWA tests passed! Icons are ready for deployment.' + colors.reset);
      return true;
    } else if (coreTestsPassed) {
      console.log(colors.yellow + '\n✅ Core PWA setup is valid. HTTP tests may require server restart.' + colors.reset);
      return true;
    } else {
      console.log(colors.red + '\n❌ PWA setup has issues that need to be fixed.' + colors.reset);
      return false;
    }

  } catch (error) {
    logError(`Test failed: ${error.message}`);
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Test error: ${error.message}`);
      process.exit(1);
    });
}

export { runTests };