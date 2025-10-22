const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { validateFile, generateFileUrl } = require('../../Utils/fileUtils');
const { sizeLimits } = require('../../Config/Database/Data');
const { deleteFile } = require('../Helpers/fileHelper');

// Save uploads in root/UPLOAD_DIR
const uploadPath = path.join(__dirname, '../../..', 'UPLOAD_DIR');

// Configure storage for application files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(new Error('Failed to create upload directory'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}_${safeFileName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: sizeLimits.large || 50 * 1024 * 1024, // 50MB default
    files: 20, // Maximum 20 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, JPEG, PNG, DOC, DOCX, TXT`));
    }
  },
});

// Middleware for application file uploads (multiple files)
const uploadApplicationMiddleware = (req, res, next) => {
  const uploadHandler = upload.fields([
    { name: 'applicationForm', maxCount: 1 },
    { name: 'documents', maxCount: 15 },
  ]);

  uploadHandler(req, res, err => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: `File too large: ${err.message}. Maximum size is ${sizeLimits.large} bytes.`,
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: `Too many files: ${err.message}`,
        });
      }
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    }

    if (err) {
      return res.status(500).json({ error: `Upload failed: ${err.message}` });
    }

    next();
  });
};

// For single file uploads (existing)
const uploadPublicMiddleware = (req, res, next) => {
  const isSingle = req.headers['upload-type'] === 'single';
  const uploadHandler = isSingle ? upload.single('file') : upload.array('files', 10);

  uploadHandler(req, res, err => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: `Multer error: ${err.message}` });
    if (err) return res.status(500).json({ error: `Upload failed: ${err.message}` });

    const files = isSingle ? (req.file ? [req.file] : []) : req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded.' });

    const validFiles = files.filter(file => validateFile(file, req.headers['upload-category']));
    if (validFiles.length === 0) {
      files.forEach(file => deleteFile(file.path));
      return res.status(400).json({ error: 'No valid files uploaded. Files have been deleted.' });
    }

    req.uploadedFiles = validFiles.map((file, index) => ({
      id: index + 1,
      file,
      url: generateFileUrl(file.filename, 'public'),
    }));

    next();
  });
};

module.exports = {
  uploadPublicMiddleware,
  uploadApplicationMiddleware,
};
