import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Required icon sizes from manifest.json
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

const sourceFile = 'public/icons/icon-master.svg';
const outputDir = 'public/icons';

console.log('🎨 [ICON-GENERATOR] Generating PWA icons...');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  // Read the SVG source
  const svgBuffer = fs.readFileSync(sourceFile);

  // Generate each required size
  for (const size of iconSizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

    console.log(`📱 [ICON-GENERATOR] Creating ${size}x${size} icon...`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png({
        quality: 100,
        compressionLevel: 9,
        adaptiveFiltering: true,
        progressive: true
      })
      .toFile(outputFile);

    console.log(`✅ [ICON-GENERATOR] Generated: ${outputFile}`);
  }

  // Generate favicon.ico (32x32)
  console.log('📱 [ICON-GENERATOR] Creating favicon.ico...');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon-32x32.png');

  // Generate apple-touch-icon (180x180)
  console.log('📱 [ICON-GENERATOR] Creating apple-touch-icon...');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  console.log('🎉 [ICON-GENERATOR] All PWA icons generated successfully!');

  // List generated files
  console.log('\n📁 [ICON-GENERATOR] Generated files:');
  const files = fs.readdirSync(outputDir);
  files.forEach(file => {
    if (file.endsWith('.png')) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ${file} (${sizeKB} KB)`);
    }
  });

} catch (error) {
  console.error('❌ [ICON-GENERATOR] Error generating icons:', error);
  process.exit(1);
}