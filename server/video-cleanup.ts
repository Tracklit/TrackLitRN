import fs from 'fs';
import path from 'path';
import { storage } from './storage';

const UPLOADS_DIR = './uploads/video-analysis';

export class VideoCleanupService {
  /**
   * Clean up orphaned video files that are no longer referenced in the database
   */
  static async cleanupOrphanedFiles(): Promise<void> {
    try {
      console.log('Starting cleanup of orphaned video files...');
      
      if (!fs.existsSync(UPLOADS_DIR)) {
        console.log('Video uploads directory does not exist');
        return;
      }

      // Get all video files in the uploads directory
      const files = fs.readdirSync(UPLOADS_DIR).filter(file => {
        const filePath = path.join(UPLOADS_DIR, file);
        const stat = fs.statSync(filePath);
        return stat.isFile() && !file.startsWith('temp_frames_');
      });

      console.log(`Found ${files.length} files in uploads directory`);

      // Get all video analysis records from database
      const videoRecords = await storage.getAllVideoAnalysis();
      const activeFileUrls = new Set(
        videoRecords
          .map((record: any) => record.fileUrl)
          .filter((url: any) => url && url.startsWith('/uploads/video-analysis/'))
          .map((url: any) => path.basename(url))
      );

      console.log(`Found ${activeFileUrls.size} active video references in database`);

      // Delete orphaned files
      let deletedCount = 0;
      for (const file of files) {
        if (!activeFileUrls.has(file)) {
          try {
            const filePath = path.join(UPLOADS_DIR, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted orphaned file: ${file}`);
            deletedCount++;
          } catch (error) {
            console.warn(`Failed to delete file ${file}:`, error);
          }
        }
      }

      console.log(`Cleanup completed. Deleted ${deletedCount} orphaned files.`);
    } catch (error) {
      console.error('Error during video file cleanup:', error);
    }
  }

  /**
   * Clean up old temporary frame directories
   */
  static async cleanupTempFrames(): Promise<void> {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        return;
      }

      const entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });
      const tempDirs = entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('temp_frames_'))
        .map(entry => entry.name);

      console.log(`Found ${tempDirs.length} temporary frame directories`);

      for (const tempDir of tempDirs) {
        try {
          const dirPath = path.join(UPLOADS_DIR, tempDir);
          
          // Delete all files in the temp directory
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            fs.unlinkSync(path.join(dirPath, file));
          }
          
          // Delete the directory itself
          fs.rmdirSync(dirPath);
          console.log(`Deleted temp directory: ${tempDir}`);
        } catch (error) {
          console.warn(`Failed to delete temp directory ${tempDir}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during temp frames cleanup:', error);
    }
  }

  /**
   * Run full cleanup routine
   */
  static async runFullCleanup(): Promise<void> {
    console.log('Starting full video cleanup routine...');
    await this.cleanupTempFrames();
    await this.cleanupOrphanedFiles();
    console.log('Full video cleanup routine completed');
  }

  /**
   * Schedule periodic cleanup (called on server start)
   */
  static schedulePeriodicCleanup(): void {
    // Run cleanup immediately on server start
    this.runFullCleanup();

    // Schedule cleanup every 6 hours
    setInterval(() => {
      this.runFullCleanup();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

    console.log('Video cleanup scheduled to run every 6 hours');
  }
}