const fs = require('fs');
const path = require('path');

// 📌 **Upload File(s)**
exports.uploadFiles = (req, res) => {
  const isSingle = req.headers['upload-type'] === 'single';
  const uploadedFiles = isSingle ? (req.file ? [req.file] : []) : req.files;

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No file uploaded!' });
  }

  const filesData = uploadedFiles.map(file => ({
    fieldname: file.fieldname,
    originalName: file.originalname,
    encoding: file.encoding,
    mimetype: file.mimetype,
    destination: file.destination,
    filename: file.filename,
    path: file.path,
    size: file.size,
    fileUrl: `/uploads/${file.filename}`,
  }));

  res.json({ message: 'File(s) uploaded successfully!', files: filesData });
};

// 📌 **Get Directory Tree**
exports.getDirectoryTree = dirPath => {
  const tree = [];
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        tree.push({
          name: item.name,
          type: 'directory',
          children: module.exports.getDirectoryTree(fullPath), // ✅ Fix recursive call
        });
      } else {
        tree.push({ name: item.name, type: 'file' });
      }
    });
  } catch (error) {
    console.error('Error reading directory:', error.message);
  }
  return tree;
};

// 📌 **List Files**
exports.listFiles = (req, res) => {
  try {
    const directoryTree = module.exports.getDirectoryTree('UPLOAD_DIR');
    res.json({ directoryTree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 **Delete Multiple Files or Directories Using `.map()`**
exports.deleteFiles = (req, res) => {
  const { filePaths } = req.body;

  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return res.status(400).json({ error: 'filePaths should be a non-empty array!' });
  }

  const responses = filePaths.map(relativePath => {
    const absolutePath = path.join(__dirname, '../UPLOAD_DIR', relativePath);

    if (!fs.existsSync(absolutePath)) {
      return { filePath: relativePath, status: 'error', message: 'File or directory not found!' };
    }

    try {
      const stats = fs.statSync(absolutePath);
      if (stats.isDirectory()) {
        fs.rmSync(absolutePath, { recursive: true, force: true });
        return { filePath: relativePath, status: 'success', message: 'Directory deleted successfully!' };
      } else {
        fs.unlinkSync(absolutePath);
        return { filePath: relativePath, status: 'success', message: 'File deleted successfully!' };
      }
    } catch (error) {
      return { filePath: relativePath, status: 'error', message: error.message };
    }
  });

  res.json({ results: responses });
};
