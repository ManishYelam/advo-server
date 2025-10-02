const express = require('express');
const multer = require('multer');
const UploadController = require('../Controllers/UploadController');

const uploadRouter = express.Router();
const upload = multer({ dest: 'uploads/' }); // Save files temporarily

uploadRouter
  .post('/upload/cloudinary', upload.single('file'), UploadController.uploadToCloudinary)
  .post('/upload/s3', upload.single('file'), UploadController.uploadToS3)
  .post('/upload/gcs', upload.single('file'), UploadController.uploadToGCS)
  .post('/upload/azure', upload.single('file'), UploadController.uploadToAzure)
  .post('/upload/firebase', upload.single('file'), UploadController.uploadToFirebase)
  .post('/upload/backblaze', upload.single('file'), UploadController.uploadToBackblaze);

module.exports = uploadRouter;
