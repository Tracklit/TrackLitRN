import { Request, Response } from 'express';
import { storage } from './storage';
import { programCoverUpload } from './upload-config';
import fs from 'fs';
import path from 'path';

// Program cover image upload handler
export async function handleProgramCoverUpload(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const programId = parseInt(req.params.id);
    if (isNaN(programId)) {
      return res.status(400).json({ error: "Invalid program ID" });
    }
    
    // Check if program exists and belongs to user
    const program = await storage.getProgram(programId);
    if (!program || program.userId !== userId) {
      return res.status(404).json({ error: "Program not found or access denied" });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // If there's an existing cover image, delete it
    if (program.coverImageUrl) {
      const oldFilePath = path.join(process.cwd(), program.coverImageUrl);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          console.error("Failed to delete old cover image:", err);
        }
      }
    }
    
    // Create a URL path for the uploaded file
    const filePath = `/uploads/program-covers/${req.file.filename}`;
    
    // Update program with cover image URL
    const updatedProgram = await storage.updateProgram(programId, {
      coverImageUrl: filePath
    });
    
    res.json({
      success: true,
      coverImageUrl: filePath,
      program: updatedProgram
    });
  } catch (error) {
    console.error("Error uploading program cover image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}