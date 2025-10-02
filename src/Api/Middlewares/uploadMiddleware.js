const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getUploadPath, validateFile, generateFileUrl } = require('../../Utils/fileUtils');
const { sizeLimits } = require('../../Config/Database/Data');
const { deleteFile } = require('../Helpers/fileHelper');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.user_info || !req.user_info.id) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unauthorized access! User not authenticated.'));
    }
    const uploadPath = getUploadPath(file, req.user_info.id);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${file.originalname.replace(/[: ]/g, '_')}`;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage, limits: { fileSize: sizeLimits.large } });

const uploadMiddleware = (req, res, next) => {
  const isSingle = req.headers['upload-type'] === 'single';
  const uploadHandler = isSingle ? upload.single('file') : upload.array('files', 10);

  uploadHandler(req, res, err => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(401).json({ error: 'Unauthorized access! User not authenticated.' });
    }
    if (err) {
      return res.status(500).json({ error: `Upload error: ${err.message}` });
    }
    const files = isSingle ? (req.file ? [req.file] : []) : req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const validFiles = files.filter(file => validateFile(file, req.headers['upload-category']));

    if (validFiles.length === 0) {
      files.forEach(file => deleteFile(file.path));
      return res.status(400).json({ error: 'No valid files uploaded. Files have been deleted.' });
    }

    req.uploadedFiles = validFiles.map((file, index) => ({
      id: index + 1,
      file,
      url: generateFileUrl(file.filename, path.basename(getUploadPath(file)), req.user_info.id),
    }));

    next();
  });
};

module.exports = uploadMiddleware;
