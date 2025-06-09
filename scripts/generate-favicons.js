import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Paths
const inputLogoPath = './src/shared/assets/quizzard-page-logo.png';
const publicDir = './public';

// Favicon sizes for different devices and platforms
const faviconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 64, name: 'favicon-64x64.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 128, name: 'favicon-128x128.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 256, name: 'android-chrome-256x256.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

async function generateFavicons() {
  try {
    console.log('🎯 Starting favicon generation from your actual logo...');
    
    // Check if input logo exists
    if (!fs.existsSync(inputLogoPath)) {
      throw new Error(`Logo file not found: ${inputLogoPath}`);
    }
    
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    console.log('📸 Using logo:', inputLogoPath);
    
    // Generate all favicon sizes
    console.log('🔧 Generating favicon files...');
    
    for (const { size, name } of faviconSizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(inputLogoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        })
        .png()
        .toFile(outputPath);
        
      console.log(`✅ Generated: ${name} (${size}x${size})`);
    }
    
    // Generate ICO file (multi-size .ico for better browser support)
    console.log('🔧 Generating favicon.ico...');
    
    // Create multiple sizes for the ICO file
    const icoSizes = [16, 32, 48];
    const icoBuffers = [];
    
    for (const size of icoSizes) {
      const buffer = await sharp(inputLogoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toBuffer();
      icoBuffers.push(buffer);
    }
    
    // For now, just use the 32x32 as the main favicon.ico
    // (ICO format creation would require additional library)
    await sharp(inputLogoPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    console.log('✅ Generated: favicon.ico');
    
    // Copy main logo to public directory as well
    const mainLogoPath = path.join(publicDir, 'quizzard-logo.png');
    await sharp(inputLogoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(mainLogoPath);
    
    console.log('✅ Generated: quizzard-logo.png (512x512)');
    
    console.log('\n🎉 All favicons generated successfully!');
    console.log('\n📋 Generated files:');
    faviconSizes.forEach(({ name, size }) => {
      console.log(`   • ${name} (${size}x${size})`);
    });
    console.log('   • favicon.ico (32x32)');
    console.log('   • quizzard-logo.png (512x512)');
    
    console.log('\n⚠️  Next steps:');
    console.log('   1. Check the generated files in the public/ directory');
    console.log('   2. Test locally with npm run dev');
    console.log('   3. Clear browser cache and check favicon');
    console.log('   4. If everything looks good, commit and push');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons(); 