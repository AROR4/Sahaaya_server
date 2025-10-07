const cloudinary = require('../utils/cloudinary');

exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    const result = await cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',   // handles image, pdf, etc.
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Error:', error);
          return res.status(500).json({ message: 'Upload failed' });
        }
        console.log('Upload Result:', result);
        return res.status(200).json({
          success: true,
          url: result.secure_url
        });
      }
    );

    
    require('streamifier').createReadStream(file.buffer).pipe(result);
    
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
