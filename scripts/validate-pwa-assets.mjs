import fs from 'fs';
import path from 'path';

console.log('🔍 [PWA-VALIDATOR] Validating PWA assets...');

const errors = [];
const warnings = [];
const validatedFiles = [];

// Required icon sizes from manifest.json
const requiredIconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Required PWA files
const requiredFiles = [
  'public/manifest.json',
  'public/favicon.ico',
  'public/apple-touch-icon.png',
  'public/favicon-32x32.png'
];

// Additional recommended files
const recommendedFiles = [
  'public/robots.txt',
  'public/sitemap.xml'
];

/**
 * Validate that a file exists and return its stats
 */
function validateFile(filePath, isRequired = true) {
  try {
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);

    validatedFiles.push({
      path: filePath,
      exists: true,
      size: stats.size,
      sizeKB,
      required: isRequired
    });

    console.log(`✅ [PWA-VALIDATOR] ${filePath} (${sizeKB} KB)`);
    return true;
  } catch (error) {
    const message = `Missing ${isRequired ? 'required' : 'recommended'} file: ${filePath}`;

    if (isRequired) {
      errors.push(message);
      console.log(`❌ [PWA-VALIDATOR] ${message}`);
    } else {
      warnings.push(message);
      console.log(`⚠️ [PWA-VALIDATOR] ${message}`);
    }

    validatedFiles.push({
      path: filePath,
      exists: false,
      required: isRequired
    });

    return false;
  }
}

/**
 * Validate manifest.json content
 */
function validateManifest() {
  try {
    const manifestPath = 'public/manifest.json';
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    console.log('\n📱 [PWA-VALIDATOR] Validating manifest.json...');

    // Check required fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);

    if (missingFields.length > 0) {
      errors.push(`Manifest missing required fields: ${missingFields.join(', ')}`);
    }

    // Check theme colors
    if (manifest.theme_color) {
      console.log(`✅ [PWA-VALIDATOR] Theme color: ${manifest.theme_color}`);
    } else {
      warnings.push('Manifest missing theme_color for better UX');
    }

    // Check icons array
    if (manifest.icons && Array.isArray(manifest.icons)) {
      console.log(`✅ [PWA-VALIDATOR] Manifest defines ${manifest.icons.length} icons`);

      const manifestIconSizes = manifest.icons.map(icon => {
        const match = icon.sizes.match(/(\d+)x\d+/);
        return match ? parseInt(match[1]) : null;
      }).filter(Boolean);

      const missingIconSizes = requiredIconSizes.filter(size =>
        !manifestIconSizes.includes(size)
      );

      if (missingIconSizes.length > 0) {
        errors.push(`Manifest missing icon sizes: ${missingIconSizes.join(', ')}`);
      }
    } else {
      errors.push('Manifest icons array is missing or invalid');
    }

    return manifest;
  } catch (error) {
    errors.push(`Failed to parse manifest.json: ${error.message}`);
    return null;
  }
}

/**
 * Validate all PWA icon files
 */
function validateIcons() {
  console.log('\n🎨 [PWA-VALIDATOR] Validating PWA icons...');

  for (const size of requiredIconSizes) {
    const iconPath = `public/icons/icon-${size}x${size}.png`;
    validateFile(iconPath, true);
  }

  // Check for oversized icons
  const iconDir = 'public/icons';
  if (fs.existsSync(iconDir)) {
    const iconFiles = fs.readdirSync(iconDir).filter(file => file.endsWith('.png'));
    let totalIconSize = 0;

    iconFiles.forEach(file => {
      const filePath = path.join(iconDir, file);
      const stats = fs.statSync(filePath);
      totalIconSize += stats.size;
    });

    const totalSizeKB = Math.round(totalIconSize / 1024);
    console.log(`📊 [PWA-VALIDATOR] Total icon size: ${totalSizeKB} KB`);

    if (totalSizeKB > 100) {
      warnings.push(`Total icon size (${totalSizeKB} KB) is quite large. Consider further optimization.`);
    } else {
      console.log(`✅ [PWA-VALIDATOR] Icon sizes are well optimized`);
    }
  }
}

/**
 * Performance analysis
 */
function analyzePerformance() {
  console.log('\n⚡ [PWA-VALIDATOR] Performance Analysis...');

  const totalSize = validatedFiles
    .filter(file => file.exists)
    .reduce((sum, file) => sum + (file.size || 0), 0);

  const totalSizeKB = Math.round(totalSize / 1024);

  console.log(`📊 [PWA-VALIDATOR] Total PWA asset size: ${totalSizeKB} KB`);

  if (totalSizeKB < 50) {
    console.log(`🟢 [PWA-VALIDATOR] Excellent - PWA assets are lightweight`);
  } else if (totalSizeKB < 100) {
    console.log(`🟡 [PWA-VALIDATOR] Good - PWA assets are reasonably sized`);
  } else {
    console.log(`🔴 [PWA-VALIDATOR] Warning - PWA assets are quite large`);
    warnings.push('Consider optimizing PWA assets for better performance');
  }
}

// Main validation process
console.log('🔍 [PWA-VALIDATOR] Starting PWA asset validation...\n');

// 1. Validate required files
console.log('📁 [PWA-VALIDATOR] Validating required files...');
requiredFiles.forEach(file => validateFile(file, true));

// 2. Validate recommended files
console.log('\n📁 [PWA-VALIDATOR] Validating recommended files...');
recommendedFiles.forEach(file => validateFile(file, false));

// 3. Validate icons
validateIcons();

// 4. Validate manifest
const manifest = validateManifest();

// 5. Performance analysis
analyzePerformance();

// Summary
console.log('\n📋 [PWA-VALIDATOR] Validation Summary:');
console.log(`   ✅ Validated files: ${validatedFiles.filter(f => f.exists).length}`);
console.log(`   ❌ Errors: ${errors.length}`);
console.log(`   ⚠️  Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ [PWA-VALIDATOR] Errors found:');
  errors.forEach(error => console.log(`   • ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️ [PWA-VALIDATOR] Warnings:');
  warnings.forEach(warning => console.log(`   • ${warning}`));
}

if (errors.length === 0) {
  console.log('\n🎉 [PWA-VALIDATOR] PWA asset validation completed successfully!');
  process.exit(0);
} else {
  console.log('\n💥 [PWA-VALIDATOR] PWA asset validation failed!');
  process.exit(1);
}