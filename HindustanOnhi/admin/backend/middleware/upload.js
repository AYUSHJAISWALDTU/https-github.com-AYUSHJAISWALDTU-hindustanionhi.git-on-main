const multer = require('multer');
const path = require('path');

// Use memory storage — files stay in buffer for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type: "${file.originalname}". Only images (jpeg, jpg, png, webp, gif) are allowed`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 8, // Max 8 files at once
  },
});

// Custom error handler for multer errors
upload.errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per image',
        error: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 8 images at once',
        error: 'TOO_MANY_FILES',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.code,
    });
  }
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: 'INVALID_FILE_TYPE',
    });
  }
  next(err);
};

module.exports = upload;
