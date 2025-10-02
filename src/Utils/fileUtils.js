const path = require('path');
const fs = require('fs');
const { fileCategories, sizeLimits } = require('../Config/Database/Data');

const validateFile = (file, category) => {
  if (!file || !file.mimetype || !file.size) return false;
  if (!fileCategories[category]) return false;
  const { mimetype, size } = file;
  if (fileCategories[category].includes(mimetype)) {
    const maxSize = sizeLimits[category] || sizeLimits.large;
    if (size <= maxSize) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};

const getUploadPath = (file, userId) => {
  const baseDir = path.join(process.cwd(), '/UPLOAD_DIR', `${userId}`);

  let categoryDir = 'Others';
  if (fileCategories.images.includes(file.mimetype)) categoryDir = 'Images';
  if (fileCategories.documents.includes(file.mimetype)) categoryDir = 'Documents';
  if (fileCategories.csvFiles.includes(file.mimetype)) categoryDir = 'CSV';
  if (fileCategories.videos.includes(file.mimetype)) categoryDir = 'Videos';

  const finalPath = path.join(baseDir, categoryDir);
  return finalPath;
};

const generateFileUrl = (filename, directory, userId) => `/uploads/${userId}/${directory}/${filename}`;

module.exports = {
  validateFile,
  getUploadPath,
  generateFileUrl,
};
