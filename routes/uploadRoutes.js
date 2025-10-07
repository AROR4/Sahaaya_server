const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadFile } = require('../controllers/uploadController');

router.post('/upload', upload.single('govtId'), uploadFile);

module.exports = router;
