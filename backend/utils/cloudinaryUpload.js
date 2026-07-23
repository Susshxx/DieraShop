import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';

export const processImageToWebp = async (buffer) => {
  return sharp(buffer)
    .resize({
      width: 2000,
      height: 2000,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: 92,
      effort: 6,
    })
    .toBuffer();
};

export const uploadBufferToCloudinary = async (buffer, folder = 'dierashop', publicId = undefined) => {
  const processed = await processImageToWebp(buffer);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      }
    );
    stream.end(processed);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};
