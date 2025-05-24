import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create directory for program covers if it doesn't exist
const programCoversDir = path.join(uploadsDir, 'program-covers');
if (!fs.existsSync(programCoversDir)) {
  fs.mkdirSync(programCoversDir, { recursive: true });
}

// Configure storage for program cover images
const programCoverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, programCoversDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'cover-' + uniqueSuffix + ext);
  }
});

export const programCoverUpload = multer({
  storage: programCoverStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any, false);
    }
  }
});