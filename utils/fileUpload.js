const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../middleware/errorHandler');
const SimpleImageProcessor = require('./imageProcessor');

// Try to load sharp, but handle cases where it's not available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('⚠️ Sharp module not available. Image processing will be limited.');
  sharp = null;
}

// Initialize fallback processor
const fallbackProcessor = new SimpleImageProcessor();

// Check if sharp is available
const isSharpAvailable = () => {
  return sharp !== null;
};

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = ['uploads', 'uploads/users', 'uploads/events', 'uploads/temp'];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Initialize upload directories
ensureUploadDirs();

// Multer memory storage
const multerStorage = multer.memoryStorage();

// File filter function
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Multer configuration
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 5
  }
});

// Upload single image
const uploadSingle = (fieldName) => upload.single(fieldName);

// Upload multiple images
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Resize user photo
const resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    const filepath = path.join('uploads', 'users', filename);

    if (isSharpAvailable()) {
      // Use Sharp for image processing if available
      await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(filepath);
    } else {
      // Fallback: save original file without processing
      await fallbackProcessor.saveImage(req.file.buffer, filepath);
      console.log('ℹ️ Image saved without processing (Sharp not available)');
    }

    req.file.filename = filename;
    req.file.path = filepath;

    next();
  } catch (error) {
    console.error('Error processing image:', error);
    return next(new AppError('Error processing image', 500));
  }
};

// Resize event image
const resizeEventImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const filename = `event-${uuidv4()}-${Date.now()}.jpeg`;
    const filepath = path.join('uploads', 'events', filename);

    if (isSharpAvailable()) {
      // Create multiple sizes using Sharp
      const sizes = [
        { width: 1200, height: 600, suffix: 'large' },
        { width: 800, height: 400, suffix: 'medium' },
        { width: 400, height: 200, suffix: 'small' }
      ];

      const resizedImages = {};

      for (const size of sizes) {
        const sizedFilename = `event-${uuidv4()}-${size.suffix}-${Date.now()}.jpeg`;
        const sizedFilepath = path.join('uploads', 'events', sizedFilename);

        await sharp(req.file.buffer)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center'
          })
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(sizedFilepath);

        resizedImages[size.suffix] = {
          filename: sizedFilename,
          path: sizedFilepath,
          url: `/uploads/events/${sizedFilename}`
        };
      }

      req.file.resizedImages = resizedImages;
    } else {
      // Fallback: save original file without processing
      await fallbackProcessor.saveImage(req.file.buffer, filepath);
      console.log('ℹ️ Event image saved without processing (Sharp not available)');
    }

    req.file.filename = filename;

    next();
  } catch (error) {
    console.error('Error processing event image:', error);
    return next(new AppError('Error processing image', 500));
  }
};

// Delete file
const deleteFile = async (filepath) => {
  try {
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Delete multiple files
const deleteFiles = async (filepaths) => {
  const results = await Promise.allSettled(
    filepaths.map(filepath => deleteFile(filepath))
  );
  
  return results.map((result, index) => ({
    filepath: filepaths[index],
    success: result.status === 'fulfilled' && result.value
  }));
};

// Get file info
const getFileInfo = async (filepath) => {
  try {
    const stats = await fs.stat(filepath);
    const ext = path.extname(filepath);
    const name = path.basename(filepath, ext);
    
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: ext,
      name: name,
      fullPath: filepath
    };
  } catch (error) {
    return { exists: false };
  }
};

// Validate image dimensions
const validateImageDimensions = (minWidth = 100, minHeight = 100, maxWidth = 5000, maxHeight = 5000) => {
  return async (req, res, next) => {
    if (!req.file) return next();

    try {
      if (isSharpAvailable()) {
        // Use Sharp for metadata if available
        const metadata = await sharp(req.file.buffer).metadata();
        
        if (metadata.width < minWidth || metadata.height < minHeight) {
          return next(new AppError(`Image must be at least ${minWidth}x${minHeight} pixels`, 400));
        }
        
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
          return next(new AppError(`Image must not exceed ${maxWidth}x${maxHeight} pixels`, 400));
        }
      } else {
        // Skip validation if Sharp is not available
        console.log('ℹ️ Image dimension validation skipped (Sharp not available)');
      }

      next();
    } catch (error) {
      console.error('Error validating image dimensions:', error);
      return next(new AppError('Invalid image file', 400));
    }
  };
};

// Clean up old files (utility function for scheduled cleanup)
const cleanupOldFiles = async (directory, maxAge = 30) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filepath = path.join(directory, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        await deleteFile(filepath);
        deletedCount++;
      }
    }
    
    return { deletedCount, totalFiles: files.length };
  } catch (error) {
    console.error('Error during cleanup:', error);
    return { deletedCount: 0, totalFiles: 0, error: error.message };
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  resizeUserPhoto,
  resizeEventImage,
  deleteFile,
  deleteFiles,
  getFileInfo,
  validateImageDimensions,
  cleanupOldFiles,
  isSharpAvailable
};
