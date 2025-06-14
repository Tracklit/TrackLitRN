import sharp from 'sharp';
import fs from 'fs';

async function compressVideoAnalysisImage() {
  const inputPath = 'attached_assets/IMG_4471_1749886795401.jpeg';
  const outputPath = 'public/video-analysis-card-5percent.jpeg';
  
  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error('Input file not found:', inputPath);
      return;
    }

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;
    console.log(`Original file size: ${(originalSize / 1024).toFixed(2)} KB`);

    // Compress the image to 5% quality
    await sharp(inputPath)
      .jpeg({ 
        quality: 5,
        progressive: true,
        mozjpeg: true
      })
      .resize(800, 600, { 
        fit: 'cover',
        position: 'center'
      })
      .toFile(outputPath);

    // Get compressed file size
    const compressedStats = fs.statSync(outputPath);
    const compressedSize = compressedStats.size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Compressed file size: ${(compressedSize / 1024).toFixed(2)} KB`);
    console.log(`Compression ratio: ${compressionRatio}%`);
    console.log(`Video Analysis card image compressed successfully to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error compressing video analysis image:', error);
  }
}

compressVideoAnalysisImage();