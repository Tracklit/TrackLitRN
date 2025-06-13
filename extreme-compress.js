import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function extremeCompress() {
  const inputDir = './attached_assets';
  const outputDir = './public';
  
  // Image mappings for extreme compression (10% quality)
  const images = [
    { input: 'IMG_4075.JPG', output: 'track-image-1-extreme.webp' },
    { input: 'IMG_4076.JPG', output: 'track-image-2-extreme.webp' },
    { input: 'IMG_4077.JPG', output: 'track-image-3-extreme.webp' },
    { input: 'IMG_4078.JPG', output: 'track-image-4-extreme.webp' },
    { input: 'IMG_4081.jpeg', output: 'stopwatch-extreme.webp' },
    { input: 'startgun.png', output: 'startgun-extreme.webp' },
    { input: 'programs-card-compressed.jpeg', output: 'programs-card-extreme.webp' },
    { input: 'tools-card-compressed.jpeg', output: 'tools-card-extreme.webp' },
    { input: 'sprinthia-avatar-compressed.jpeg', output: 'sprinthia-avatar-extreme.webp' },
    { input: 'video-analysis-card.jpeg', output: 'video-analysis-card-extreme.webp' }
  ];

  for (const img of images) {
    const inputPath = path.join(inputDir, img.input);
    const outputPath = path.join(outputDir, img.output);
    
    // Try attached_assets first, then public directory
    let actualInputPath = inputPath;
    if (!fs.existsSync(inputPath)) {
      actualInputPath = path.join(outputDir, img.input);
      if (!fs.existsSync(actualInputPath)) {
        console.log(`Skipping ${img.input} - file not found`);
        continue;
      }
    }
    
    try {
      await sharp(actualInputPath)
        .webp({ quality: 10 }) // Extreme compression - 10% quality
        .toFile(outputPath);
      
      const inputStats = fs.statSync(actualInputPath);
      const outputStats = fs.statSync(outputPath);
      const reduction = ((inputStats.size - outputStats.size) / inputStats.size * 100).toFixed(1);
      
      console.log(`${img.output}: ${inputStats.size} → ${outputStats.size} bytes (${reduction}% reduction)`);
    } catch (error) {
      console.error(`Error compressing ${img.input}:`, error.message);
    }
  }
}

extremeCompress().catch(console.error);