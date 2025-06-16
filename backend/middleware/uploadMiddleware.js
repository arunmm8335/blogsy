import multer from 'multer';

// Use memory storage because we are uploading to a cloud service (Cloudinary)
const storage = multer.memoryStorage();

// Filter to allow common image and video file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Please upload images or videos.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    // Increase the file size limit to handle larger video files.
    // 50MB is a good starting point. Adjust as needed.
    limits: { fileSize: 50 * 1024 * 1024 } // 50 Megabytes
});

export default upload;