const fs = require('fs');
const cloudinary = require('../../Config/cloudinary');
const s3 = require('../../Config/aws');
const bucket = require('../../Config/gcs');
const containerClient = require('../../Config/azure');
const firebaseStorage = require('../../Config/firebase');
const { b2, authorizeB2 } = require('../../Config/backblaze');
const path = require('path');

module.exports = {
  // Cloudinary Upload
  uploadToCloudinary: async (req, res) => {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      res.status(200).json({ url: result.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // AWS S3 Upload
  uploadToS3: async (req, res) => {
    try {
      const fileContent = fs.readFileSync(req.file.path);
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: req.file.filename,
        Body: fileContent,
      };
      const data = await s3.upload(params).promise();
      res.status(200).json({ url: data.Location });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Google Cloud Storage Upload
  uploadToGCS: async (req, res) => {
    try {
      await bucket.upload(req.file.path, {
        destination: req.file.filename,
        public: true,
      });
      const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${req.file.filename}`;
      res.status(200).json({ url: publicUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Azure Blob Storage Upload
  uploadToAzure: async (req, res) => {
    try {
      const blobClient = containerClient.getBlockBlobClient(req.file.filename);
      await blobClient.uploadFile(req.file.path);
      res.status(200).json({
        url: `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_CONTAINER_NAME}/${req.file.filename}`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Firebase Storage Upload
  uploadToFirebase: async (req, res) => {
    try {
      const storageRef = ref(firebaseStorage, req.file.filename);
      const snapshot = await uploadBytes(storageRef, fs.readFileSync(req.file.path));
      res.status(200).json({ url: snapshot.metadata.fullPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Backblaze B2 Upload
  uploadToBackblaze: async (req, res) => {
    try {
      await authorizeB2();
      const file = fs.readFileSync(req.file.path);
      const response = await b2.uploadFile({
        bucketId: process.env.B2_BUCKET_ID,
        fileName: req.file.filename,
        data: file,
      });
      res.status(200).json({ url: response.data.fileUrl });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
