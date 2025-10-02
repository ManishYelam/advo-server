const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

module.exports = {
  // Resize an image
  resizeImage: async (inputPath, outputPath, width, height) => {
    try {
      await sharp(inputPath).resize(width, height).toFile(outputPath);
      console.log(`Image resized successfully and saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error resizing image: ${error.message}`);
      throw error;
    }
  },

  // Convert an image to a different format (JPEG, PNG, WebP, etc.)
  convertImageFormat: async (inputPath, outputPath, format) => {
    try {
      await sharp(inputPath).toFormat(format).toFile(outputPath);
      console.log(`Image converted to ${format} and saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error converting image format: ${error.message}`);
      throw error;
    }
  },

  // Compress an image
  compressImage: async (inputPath, outputPath, quality) => {
    try {
      await sharp(inputPath)
        .jpeg({ quality }) // Compression quality for JPEG images
        .toFile(outputPath);
      console.log(`Image compressed successfully and saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error compressing image: ${error.message}`);
      throw error;
    }
  },

  // Generate a thumbnail from an image
  createThumbnail: async (inputPath, outputPath, size) => {
    try {
      await sharp(inputPath).resize(size, size).toFile(outputPath);
      console.log(`Thumbnail created and saved to ${outputPath}`);
    } catch (error) {
      console.error(`Error creating thumbnail: ${error.message}`);
      throw error;
    }
  },

  // Get image metadata (dimensions, format, etc.)
  getImageMetadata: async inputPath => {
    try {
      const metadata = await sharp(inputPath).metadata();
      console.log(`Image metadata:`, metadata);
      return metadata;
    } catch (error) {
      console.error(`Error fetching image metadata: ${error.message}`);
      throw error;
    }
  },

  // Convert an image to a Base64 string
  convertImageToBase64: async inputPath => {
    try {
      const imageBuffer = await sharp(inputPath).toBuffer();
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error(`Error converting image to Base64: ${error.message}`);
      throw error;
    }
  },

  // Save a Base64 string as an image
  saveBase64AsImage: async (base64String, outputPath) => {
    try {
      const imageBuffer = Buffer.from(base64String, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`Base64 string saved as image to ${outputPath}`);
    } catch (error) {
      console.error(`Error saving Base64 string as image: ${error.message}`);
      throw error;
    }
  },
};
