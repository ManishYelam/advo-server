const express = require('express');
const uploadMiddleware = require('../Middlewares/uploadMiddleware');
const fileController = require('../Controllers/fileController');
const fileRouter = express.Router();

// **Routes**
fileRouter.post('/upload', uploadMiddleware, fileController.uploadFiles);
fileRouter.get('/files', fileController.listFiles);
fileRouter.delete('/delete', fileController.deleteFiles);

module.exports = fileRouter;
