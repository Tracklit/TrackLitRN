import { Request, Response } from "express";
import OpenAI from "openai";
import multer from "multer";
import fs from "fs";
import path from "path";

// Set up storage for audio files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/audio";
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure multer for audio uploads
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept only audio files
    const allowedMimeTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.') as any);
    }
  }
});

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

// Transcribe audio route handler
export async function transcribeAudioHandler(req: Request, res: Response) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        message: "Transcription service is not configured. Please contact support." 
      });
    }

    // Check for premium user status
    if (!req.user || !req.user.isPremium) {
      return res.status(403).json({ 
        message: "Voice transcription is only available for premium users." 
      });
    }

    // The file is available in req.file thanks to multer
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    // Read file from disk
    const fileBuffer = fs.readFileSync(req.file.path);
    
    try {
      // Create a form for the OpenAI API
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: req.file.mimetype });
      const file = new File([blob], req.file.filename, { type: req.file.mimetype });
      
      formData.append("file", file);
      formData.append("model", "whisper-1");
      
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }
      
      const transcription = await response.json();
      
      // Delete the temp file after successful transcription
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
      
      return res.status(200).json({
        text: transcription.text,
        success: true
      });
    } catch (error) {
      console.error("Transcription error:", error);
      
      // Delete the temp file in case of error
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
      
      return res.status(500).json({ 
        message: "Failed to transcribe audio",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      message: "Server error processing audio",
      error: error.message
    });
  }
}