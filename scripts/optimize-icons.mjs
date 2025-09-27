import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconDir = 'public/icons';

console.log('🔧 [ICON-OPTIMIZER] Optimizing PWA icons...');

// Get all PNG files in the icons directory
const iconFiles = fs.readdirSync(iconDir)
  .filter(file => file.endsWith('.png'))
  .sort();

console.log(`📁 [ICON-OPTIMIZER] Found ${iconFiles.length} icon files to optimize`);

let totalSizeBefore = 0;
let totalSizeAfter = 0;
const optimizedFiles = [];

for (const file of iconFiles) {
  const filePath = path.join(iconDir, file);
  const backupPath = path.join(iconDir, `${file}.backup`);

  try {
    // Get original file size
    const originalStats = fs.statSync(filePath);
    const originalSize = originalStats.size;
    totalSizeBefore += originalSize;

    // Create backup
    fs.copyFileSync(filePath, backupPath);

    // Optimize the icon
    const buffer = fs.readFileSync(filePath);
    const optimizedBuffer = await sharp(buffer)
      .png({
        quality: 95,
        compressionLevel: 9,
        adaptiveFiltering: true,
        progressive: false, // Better for small icons
        palette: true // Use palette for smaller file size
      })
      .toBuffer();

    // Write optimized file
    fs.writeFileSync(filePath, optimizedBuffer);

    // Get new file size
    const newStats = fs.statSync(filePath);
    const newSize = newStats.size;
    totalSizeAfter += newSize;

    const savings = originalSize - newSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

    console.log(`✅ [ICON-OPTIMIZER] ${file}: ${Math.round(originalSize/1024)}KB → ${Math.round(newSize/1024)}KB (${savingsPercent}% reduction)`);

    optimizedFiles.push({
      file,
      originalSize,
      newSize,
      savings,
      savingsPercent: parseFloat(savingsPercent)
    });

    // Remove backup if optimization was successful
    fs.unlinkSync(backupPath);

  } catch (error) {
    console.error(`❌ [ICON-OPTIMIZER] Error optimizing ${file}:`, error);

    // Restore from backup if optimization failed
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      fs.unlinkSync(backupPath);
    }
  }
}

// Summary
const totalSavings = totalSizeBefore - totalSizeAfter;
const totalSavingsPercent = ((totalSavings / totalSizeBefore) * 100).toFixed(1);

console.log('\n📊 [ICON-OPTIMIZER] Optimization Summary:');
console.log(`   Total size before: ${Math.round(totalSizeBefore/1024)} KB`);
console.log(`   Total size after:  ${Math.round(totalSizeAfter/1024)} KB`);
console.log(`   Total savings:     ${Math.round(totalSavings/1024)} KB (${totalSavingsPercent}%)`);

// Icon analysis
console.log('\n🔍 [ICON-OPTIMIZER] Icon Analysis:');
optimizedFiles.forEach(({ file, newSize }) => {
  const size = path.parse(file).name.match(/(\d+)x\d+/)?.[1];
  const expectedMinSize = Math.pow(parseInt(size) || 100, 2) * 0.01; // Rough estimate
  const efficiency = newSize < expectedMinSize * 1024 ? '🟢 Efficient' : '🟡 Could be smaller';

  console.log(`   ${file}: ${Math.round(newSize/1024)} KB ${efficiency}`);
});

console.log('\n🎉 [ICON-OPTIMIZER] Icon optimization completed!');

// Verify all required icons exist
const requiredSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const missingSizes = requiredSizes.filter(size =>
  !fs.existsSync(path.join(iconDir, `icon-${size}x${size}.png`))
);

if (missingSizes.length > 0) {
  console.log('\n⚠️ [ICON-OPTIMIZER] Missing required icon sizes:', missingSizes);
} else {
  console.log('\n✅ [ICON-OPTIMIZER] All required icon sizes are present!');
}