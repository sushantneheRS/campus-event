const fs = require('fs').promises;
const path = require('path');

// Simple image processor without Sharp dependency
class SimpleImageProcessor {
  constructor() {
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
  }

  // Check if file is an image
  isImage(file) {
    if (!file || !file.mimetype) return false;
    return file.mimetype.startsWith('image/');
  }

  // Get file extension from mimetype
  getExtension(mimetype) {
    if (mimetype.includes('jpeg') || mimetype.includes('jpg')) return 'jpg';
    if (mimetype.includes('png')) return 'png';
    if (mimetype.includes('gif')) return 'gif';
    if (mimetype.includes('webp')) return 'webp';
    return 'jpg'; // default
  }

  // Save image without processing
  async saveImage(buffer, filepath) {
    try {
      await fs.writeFile(filepath, buffer);
      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  }

  // Create thumbnail path (just copy original for now)
  async createThumbnail(buffer, originalPath, thumbnailPath) {
    try {
      await fs.copyFile(originalPath, thumbnailPath);
      return true;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return false;
    }
  }

  // Validate file size
  validateFileSize(file, maxSize = 5 * 1024 * 1024) { // 5MB default
    return file.size <= maxSize;
  }

  // Get basic file info
  async getFileInfo(filepath) {
    try {
      const stats = await fs.stat(filepath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return null;
    }
  }
}

module.exports = SimpleImageProcessor;
