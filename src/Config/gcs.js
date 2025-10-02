const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: process.env.GOOGLE_CLOUD_KEYFILE });
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
module.exports = bucket;
