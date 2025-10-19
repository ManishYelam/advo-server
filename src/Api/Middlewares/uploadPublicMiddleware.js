const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { validateFile, generateFileUrl } = require('../../Utils/fileUtils');
const { sizeLimits } = require('../../Config/Database/Data');
const { deleteFile } = require('../Helpers/fileHelper');

// Save uploads in root/UPLOAD_DIR
const uploadPath = path.join(__dirname, '../../..', 'UPLOAD_DIR');

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
    const uniqueSuffix = `${Date.now()}_${file.originalname.replace(/[: ]/g, '_')}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: sizeLimits.large },
});

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
      url: generateFileUrl(file.filename, 'public'), // Ensure this maps to /uploads
    }));

    next();
  });
};

module.exports = uploadPublicMiddleware;
