import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function optimizeBackgroundImages() {
  const images = [
    {
      input: 'public/practice-background.jpeg',
      output: 'public/practice-background-optimized.webp',
      crop: { width: 400, height: 140, top: 0, left: 0 } // Practice card dimensions
    },
    {
      input: 'public/programs-background.jpeg', 
      output: 'public/programs-background-optimized.webp',
      crop: { width: 400, height: 140, top: 70, left: 0 } // Center 50% positioning
    },
    {
      input: 'public/race-background.jpeg',
      output: 'public/race-background-optimized.webp', 
      crop: { width: 400, height: 140, top: 70, left: 0 } // Center 50% positioning
    },
    {
      input: 'public/tools-background.jpeg',
      output: 'public/tools-background-optimized.webp',
      crop: { width: 400, height: 140, top: 70, left: 0 } // Center 50% positioning
    },
    {
      input: 'public/sprinthia-background.jpeg',
      output: 'public/sprinthia-background-optimized.webp',
      crop: { width: 400, height: 140, top: 0, left: 0 } // Top positioning (-100px)
    }
  ];

  for (const img of images) {
    try {
      console.log(`Processing ${img.input}...`);
      
      // Get original image info
      const info = await sharp(img.input).metadata();
      console.log(`Original: ${info.width}x${info.height}, ${Math.round(fs.statSync(img.input).size / 1024)}KB`);
      
      // Calculate crop position based on container positioning
      let cropTop = img.crop.top;
      if (img.input.includes('sprinthia')) {
        // Sprinthia uses "center -100px" so crop from top area
        cropTop = Math.max(0, 100);
      } else if (!img.input.includes('practice')) {
        // Other cards use "center 50%" so crop from middle area  
        cropTop = Math.max(0, Math.round(info.height * 0.3));
      }
      
      const cropHeight = Math.min(img.crop.height, info.height - cropTop);
      const cropWidth = Math.min(img.crop.width, info.width);
      
      await sharp(img.input)
        .extract({
          left: Math.round((info.width - cropWidth) / 2),
          top: cropTop,
          width: cropWidth,
          height: cropHeight
        })
        .resize(400, 140, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ 
          quality: 10, // 90% compression
          effort: 6,
          progressive: true
        })
        .toFile(img.output);
      
      const newSize = fs.statSync(img.output).size;
      const originalSize = fs.statSync(img.input).size;
      const reduction = Math.round((1 - newSize / originalSize) * 100);
      
      console.log(`Optimized: 400x140, ${Math.round(newSize / 1024)}KB (${reduction}% smaller)`);
      
    } catch (error) {
      console.error(`Error processing ${img.input}:`, error.message);
    }
  }
  
  console.log('Background image optimization complete!');
}

optimizeBackgroundImages();