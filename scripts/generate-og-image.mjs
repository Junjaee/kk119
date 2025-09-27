import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

console.log('🎨 [OG-IMAGE] Generating Open Graph image...');

// Create SVG for Open Graph image
const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FB923C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>

  <!-- Decorative elements -->
  <circle cx="100" cy="100" r="80" fill="rgba(255,255,255,0.1)"/>
  <circle cx="1100" cy="530" r="60" fill="rgba(255,255,255,0.1)"/>
  <rect x="900" y="50" width="200" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
  <rect x="900" y="70" width="150" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
  <rect x="900" y="90" width="180" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>

  <!-- Logo/Shield Icon -->
  <g transform="translate(150, 200)">
    <!-- Shield shape -->
    <path d="M80 40 L120 60 L120 140 Q120 200 80 220 Q40 200 40 140 L40 60 Z"
          fill="url(#logoGradient)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>

    <!-- Book icon inside shield -->
    <rect x="65" y="90" width="30" height="40" rx="2" fill="#FB923C" opacity="0.8"/>
    <rect x="67" y="95" width="26" height="2" fill="white"/>
    <rect x="67" y="100" width="26" height="2" fill="white"/>
    <rect x="67" y="105" width="26" height="2" fill="white"/>
    <rect x="67" y="110" width="20" height="2" fill="white"/>

    <!-- "119" text in shield -->
    <text x="80" y="160" font-family="Arial, sans-serif" font-size="24" font-weight="bold"
          text-anchor="middle" fill="#FB923C">119</text>
  </g>

  <!-- Main title -->
  <text x="350" y="280" font-family="Arial, sans-serif" font-size="72" font-weight="bold"
        fill="white" text-anchor="start">교권119</text>

  <!-- Subtitle -->
  <text x="350" y="330" font-family="Arial, sans-serif" font-size="32" font-weight="normal"
        fill="rgba(255,255,255,0.9)" text-anchor="start">교사의 권리, 우리가 지킵니다</text>

  <!-- Description -->
  <text x="350" y="380" font-family="Arial, sans-serif" font-size="24" font-weight="normal"
        fill="rgba(255,255,255,0.8)" text-anchor="start">교권 보호를 위한 신고 및 법률 상담 시스템</text>

  <!-- Features -->
  <g transform="translate(350, 420)">
    <circle cx="10" cy="10" r="4" fill="white"/>
    <text x="25" y="15" font-family="Arial, sans-serif" font-size="18" fill="white">교권침해 신고</text>

    <circle cx="10" cy="35" r="4" fill="white"/>
    <text x="25" y="40" font-family="Arial, sans-serif" font-size="18" fill="white">법률 상담 서비스</text>

    <circle cx="10" cy="60" r="4" fill="white"/>
    <text x="25" y="65" font-family="Arial, sans-serif" font-size="18" fill="white">교육 자료 공유</text>
  </g>

  <!-- Website URL -->
  <text x="1050" y="580" font-family="Arial, sans-serif" font-size="16" font-weight="normal"
        fill="rgba(255,255,255,0.7)" text-anchor="end">kyokwon119.com</text>
</svg>
`;

async function generateOGImage() {
  try {
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Convert SVG to PNG
    const ogImagePath = path.join(publicDir, 'og-image.png');

    await sharp(Buffer.from(ogSvg))
      .png({
        quality: 95,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toFile(ogImagePath);

    const stats = fs.statSync(ogImagePath);
    const sizeKB = Math.round(stats.size / 1024);

    console.log(`✅ [OG-IMAGE] Open Graph image generated successfully!`);
    console.log(`   📁 Path: ${ogImagePath}`);
    console.log(`   📊 Size: ${sizeKB} KB`);
    console.log(`   📐 Dimensions: 1200x630px`);

    // Also create a Twitter card version (different aspect ratio)
    const twitterImagePath = path.join(publicDir, 'twitter-image.png');

    await sharp(Buffer.from(ogSvg))
      .resize(1200, 600, {
        fit: 'cover',
        position: 'center'
      })
      .png({
        quality: 95,
        compressionLevel: 9
      })
      .toFile(twitterImagePath);

    const twitterStats = fs.statSync(twitterImagePath);
    const twitterSizeKB = Math.round(twitterStats.size / 1024);

    console.log(`✅ [OG-IMAGE] Twitter card image generated!`);
    console.log(`   📁 Path: ${twitterImagePath}`);
    console.log(`   📊 Size: ${twitterSizeKB} KB`);

  } catch (error) {
    console.error(`❌ [OG-IMAGE] Failed to generate Open Graph image:`, error);
    process.exit(1);
  }
}

generateOGImage();