import sharp from 'sharp';

export const processImageToWebp = async (buffer) => {
  return sharp(buffer)
    .resize({ 
      width: 2000,  // Increased from 1200
      height: 2000, // Increased from 1200
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .webp({ 
      quality: 92,  // Increased from 82 for better quality
      effort: 6     // Better compression without quality loss
    })
    .toBuffer();
};

export const bufferToDataUri = (buffer, mimeType = 'image/webp') =>
  `data:${mimeType};base64,${buffer.toString('base64')}`;
