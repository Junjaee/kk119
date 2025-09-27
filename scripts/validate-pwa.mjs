#!/usr/bin/env node

/**
 * PWA Validation Script
 * Validates PWA manifest, icon files, and deployment configuration
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

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(colors.green, `✅ ${message}`);
}

function logError(message) {
  log(colors.red, `❌ ${message}`);
}

function logWarning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

function logInfo(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

// Expected icon sizes for PWA
const expectedIconSizes = [
  '16x16', '32x32', '48x48', '72x72', '96x96',
  '128x128', '144x144', '192x192', '256x256',
  '384x384', '512x512'
];

// Required manifest fields
const requiredManifestFields = [
  'name', 'short_name', 'description', 'start_url',
  'display', 'background_color', 'theme_color', 'icons'
];

/**
 * Check if file exists and get its stats
 */
function checkFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      path: filePath
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message,
      path: filePath
    };
  }
}

/**
 * Validate PWA manifest file
 */
function validateManifest() {
  logInfo('Validating PWA manifest...');

  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  const manifestCheck = checkFile(manifestPath);

  if (!manifestCheck.exists) {
    logError(`Manifest file not found: ${manifestPath}`);
    return false;
  }

  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    logSuccess(`Manifest file found (${manifestCheck.size} bytes)`);

    // Check required fields
    let hasErrors = false;

    for (const field of requiredManifestFields) {
      if (!manifest[field]) {
        logError(`Missing required field: ${field}`);
        hasErrors = true;
      } else {
        logSuccess(`Required field present: ${field}`);
      }
    }

    // Validate icons array
    if (manifest.icons && Array.isArray(manifest.icons)) {
      logSuccess(`Icons array found with ${manifest.icons.length} entries`);

      for (const icon of manifest.icons) {
        if (!icon.src) {
          logError('Icon missing src field');
          hasErrors = true;
        }
        if (!icon.sizes) {
          logError('Icon missing sizes field');
          hasErrors = true;
        }
        if (!icon.type) {
          logError('Icon missing type field');
          hasErrors = true;
        }

        if (icon.src && icon.sizes) {
          logSuccess(`Icon: ${icon.src} (${icon.sizes})`);
        }
      }
    } else {
      logError('Icons array missing or invalid');
      hasErrors = true;
    }

    // Check PWA capabilities
    if (manifest.display === 'standalone' || manifest.display === 'fullscreen') {
      logSuccess(`PWA display mode: ${manifest.display}`);
    } else {
      logWarning(`Display mode should be 'standalone' or 'fullscreen', got: ${manifest.display}`);
    }

    if (manifest.start_url) {
      logSuccess(`Start URL: ${manifest.start_url}`);
    }

    return !hasErrors;

  } catch (error) {
    logError(`Error parsing manifest: ${error.message}`);
    return false;
  }
}

/**
 * Validate icon files exist and are accessible
 */
function validateIconFiles() {
  logInfo('Validating icon files...');

  const publicDir = path.join(projectRoot, 'public');
  let hasErrors = false;

  // Check generated icons
  for (const size of expectedIconSizes) {
    const iconPath = path.join(publicDir, `icon-${size}.png`);
    const iconCheck = checkFile(iconPath);

    if (iconCheck.exists) {
      logSuccess(`Icon found: icon-${size}.png (${iconCheck.size} bytes)`);
    } else {
      logError(`Missing icon: icon-${size}.png`);
      hasErrors = true;
    }
  }

  // Check special icons
  const specialIcons = [
    'favicon.ico',
    'apple-touch-icon.png',
    'favicon-16x16.png',
    'favicon-32x32.png'
  ];

  for (const iconName of specialIcons) {
    const iconPath = path.join(publicDir, iconName);
    const iconCheck = checkFile(iconPath);

    if (iconCheck.exists) {
      logSuccess(`Special icon found: ${iconName} (${iconCheck.size} bytes)`);
    } else {
      logError(`Missing special icon: ${iconName}`);
      hasErrors = true;
    }
  }

  return !hasErrors;
}

/**
 * Validate PWA meta tags in HTML
 */
function validateMetaTags() {
  logInfo('Validating PWA meta tags...');

  // Check if layout.tsx has proper meta tags
  const layoutPath = path.join(projectRoot, 'app', 'layout.tsx');

  if (!fs.existsSync(layoutPath)) {
    logError('Layout file not found');
    return false;
  }

  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');

  const requiredMetaTags = [
    'theme-color',
    'apple-mobile-web-app-capable',
    'apple-mobile-web-app-status-bar-style',
    'apple-mobile-web-app-title'
  ];

  let hasErrors = false;

  for (const metaTag of requiredMetaTags) {
    if (layoutContent.includes(metaTag)) {
      logSuccess(`Meta tag found: ${metaTag}`);
    } else {
      logWarning(`Meta tag missing or not found in layout: ${metaTag}`);
    }
  }

  // Check for manifest link
  if (layoutContent.includes('manifest.json')) {
    logSuccess('Manifest link found in layout');
  } else {
    logError('Manifest link not found in layout');
    hasErrors = true;
  }

  return !hasErrors;
}

/**
 * Test icon loading via HTTP
 */
async function testIconLoading() {
  logInfo('Testing icon loading via HTTP...');

  const baseUrl = 'http://localhost:3000';
  let hasErrors = false;

  // Test a few key icons
  const testIcons = [
    'favicon.ico',
    'icon-192x192.png',
    'icon-512x512.png',
    'apple-touch-icon.png'
  ];

  for (const iconName of testIcons) {
    try {
      const response = await fetch(`${baseUrl}/${iconName}`, {
        method: 'HEAD',
        timeout: 5000
      });

      if (response.ok) {
        logSuccess(`Icon loads successfully: ${iconName} (HTTP ${response.status})`);
      } else {
        logError(`Icon failed to load: ${iconName} (HTTP ${response.status})`);
        hasErrors = true;
      }
    } catch (error) {
      logWarning(`Could not test icon loading: ${iconName} (${error.message})`);
      logInfo('Note: Ensure development server is running on http://localhost:3000');
    }
  }

  return !hasErrors;
}

/**
 * Generate PWA validation report
 */
function generateReport(results) {
  logInfo('Generating PWA validation report...');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      manifestValid: results.manifest,
      iconsValid: results.icons,
      metaTagsValid: results.metaTags,
      httpLoadingValid: results.httpLoading,
      overallValid: results.manifest && results.icons && results.metaTags
    },
    checks: {
      manifestFile: results.manifest,
      iconFiles: results.icons,
      metaTags: results.metaTags,
      httpLoading: results.httpLoading
    },
    recommendations: []
  };

  if (!results.manifest) {
    report.recommendations.push('Fix PWA manifest validation errors');
  }

  if (!results.icons) {
    report.recommendations.push('Generate missing icon files using npm run generate:icons');
  }

  if (!results.metaTags) {
    report.recommendations.push('Add missing PWA meta tags to layout.tsx');
  }

  if (!results.httpLoading) {
    report.recommendations.push('Check server configuration for icon file serving');
  }

  const reportPath = path.join(projectRoot, '.taskmaster', 'reports', 'pwa-validation-report.json');
  const reportDir = path.dirname(reportPath);

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`Report saved to: ${reportPath}`);

  return report;
}

/**
 * Main validation function
 */
async function validatePWA() {
  console.log('\n' + colors.bold + colors.blue + '🔍 PWA Validation Starting...' + colors.reset + '\n');

  const results = {
    manifest: false,
    icons: false,
    metaTags: false,
    httpLoading: false
  };

  try {
    results.manifest = validateManifest();
    console.log();

    results.icons = validateIconFiles();
    console.log();

    results.metaTags = validateMetaTags();
    console.log();

    results.httpLoading = await testIconLoading();
    console.log();

    const report = generateReport(results);

    console.log('\n' + colors.bold + '📊 Validation Summary:' + colors.reset);
    console.log(`Manifest: ${results.manifest ? '✅' : '❌'}`);
    console.log(`Icons: ${results.icons ? '✅' : '❌'}`);
    console.log(`Meta Tags: ${results.metaTags ? '✅' : '❌'}`);
    console.log(`HTTP Loading: ${results.httpLoading ? '✅' : '⚠️'}`);

    const overallValid = results.manifest && results.icons && results.metaTags;
    console.log(`\nOverall PWA Validation: ${overallValid ? colors.green + '✅ PASSED' : colors.red + '❌ FAILED'} ${colors.reset}`);

    if (overallValid) {
      console.log(colors.green + '\n🎉 PWA is ready for deployment!' + colors.reset);
    } else {
      console.log(colors.red + '\n🔧 PWA needs fixes before deployment.' + colors.reset);
      if (report.recommendations.length > 0) {
        console.log('\nRecommendations:');
        report.recommendations.forEach(rec => console.log(`  • ${rec}`));
      }
    }

    return overallValid;

  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    return false;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validatePWA()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError(`Validation error: ${error.message}`);
      process.exit(1);
    });
}

export { validatePWA };