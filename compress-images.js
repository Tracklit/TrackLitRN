const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Function to compress images with doubled compression
async function compressImage(inputPath, outputPath, quality = 40) {
  try {
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Compressed ${path.basename(inputPath)}: ${originalSize} → ${compressedSize} bytes (${savings}% reduction)`);
  } catch (error) {
    console.error(`Error compressing ${inputPath}:`, error);
  }
}

// Function to compress track images from attached_assets
async function compressTrackImages() {
  const trackImages = [
    'attached_assets/IMG_4075.JPG',
    'attached_assets/IMG_4076.JPG', 
    'attached_assets/IMG_4077.JPG',
    'attached_assets/IMG_4078.JPG'
  ];
  
  for (let i = 0; i < trackImages.length; i++) {
    const inputPath = trackImages[i];
    const outputPath = `public/track-image-${i + 1}-compressed.webp`;
    
    if (fs.existsSync(inputPath)) {
      await compressImage(inputPath, outputPath, 35); // Very high compression for track images
    } else {
      console.log(`Track image not found: ${inputPath}`);
    }
  }
}

// Function to compress card header images
async function compressCardImages() {
  const cardImages = [
    { input: 'public/programs-card-compressed.jpeg', output: 'public/programs-card-ultra-compressed.webp' },
    { input: 'public/tools-card-compressed.jpeg', output: 'public/tools-card-ultra-compressed.webp' },
    { input: 'public/sprinthia-avatar-compressed.jpeg', output: 'public/sprinthia-avatar-ultra-compressed.webp' },
    { input: 'attached_assets/startgun.png', output: 'public/startgun-compressed.webp' },
    { input: 'attached_assets/IMG_4081.jpeg', output: 'public/stopwatch-compressed.webp' },
    { input: 'attached_assets/video-analysis-card.jpeg', output: 'public/video-analysis-card-compressed.webp' }
  ];
  
  for (const image of cardImages) {
    if (fs.existsSync(image.input)) {
      await compressImage(image.input, image.output, 40);
    } else {
      console.log(`Card image not found: ${image.input}`);
    }
  }
}

// Main compression function
async function main() {
  console.log('Starting image compression with doubled compression rates...');
  
  await compressTrackImages();
  await compressCardImages();
  
  console.log('Image compression completed!');
}

main().catch(console.error);