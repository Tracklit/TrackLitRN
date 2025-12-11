/**
 * Multer Azure Blob Storage Engine
 * 
 * Custom multer storage engine for uploading files directly to Azure Blob Storage.
 * Integrates with Express multer middleware for file uploads.
 * 
 * Usage:
 * ```typescript
 * import multer from 'multer';
 * import { azureBlobStorageEngine } from './multerAzureStorage';
 * import { StorageContainer } from './objectStorage';
 * 
 * const upload = multer({
 *   storage: azureBlobStorageEngine({
 *     container: StorageContainer.UPLOADS,
 *     blobName: (req, file) => `${Date.now()}-${file.originalname}`,
 *   }),
 *   limits: {
 *     fileSize: 50 * 1024 * 1024, // 50MB
 *   },
 * });
 * 
 * app.post('/upload', upload.single('file'), (req, res) => {
 *   res.json({ url: req.file.url });
 * });
 * ```
 */

import { Request } from 'express';
import { StorageEngine } from 'multer';
import { storageService, StorageContainer, UploadResult } from './objectStorage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * File information with Azure Blob Storage metadata
 */
export interface AzureBlobFile extends Express.Multer.File {
  url: string;
  blobName: string;
  containerName: string;
}

/**
 * Options for Azure Blob Storage engine
 */
export interface AzureBlobStorageOptions {
  /**
   * Container to upload files to (default: UPLOADS)
   */
  container?: StorageContainer;

  /**
   * Function to generate blob name
   * Default: UUID + original extension
   */
  blobName?: (req: Request, file: Express.Multer.File) => string | Promise<string>;

  /**
   * Function to determine content type
   * Default: Uses file.mimetype
   */
  contentType?: (req: Request, file: Express.Multer.File) => string | Promise<string>;

  /**
   * Metadata to attach to blob
   */
  metadata?: (req: Request, file: Express.Multer.File) => Record<string, string> | Promise<Record<string, string>>;
}

/**
 * Create a multer storage engine that uploads to Azure Blob Storage
 */
export function azureBlobStorageEngine(options: AzureBlobStorageOptions = {}): StorageEngine {
  const {
    container = StorageContainer.UPLOADS,
    blobName = defaultBlobName,
    contentType = defaultContentType,
  } = options;

  return {
    async _handleFile(
      req: Request,
      file: Express.Multer.File,
      callback: (error?: any, info?: Partial<AzureBlobFile>) => void
    ): Promise<void> {
      try {
        // Ensure storage is initialized
        if (!storageService.isConnected()) {
          await storageService.initialize();
        }

        // Generate blob name
        const generatedBlobName = await blobName(req, file);

        // Determine content type
        const generatedContentType = await contentType(req, file);

        // Collect file data from stream
        const chunks: Buffer[] = [];
        
        file.stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.stream.on('error', (error: Error) => {
          callback(error);
        });

        file.stream.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            
            // Upload to Azure Blob Storage
            const result: UploadResult = await storageService.uploadFile(
              buffer,
              generatedBlobName,
              container,
              generatedContentType
            );

            if (!result.success) {
              return callback(new Error(result.error || 'Upload failed'));
            }

            // Return file info
            const fileInfo: Partial<AzureBlobFile> = {
              url: result.url,
              blobName: result.blobName,
              containerName: result.containerName,
              size: buffer.length,
              mimetype: generatedContentType,
              filename: generatedBlobName,
              originalname: file.originalname,
              encoding: file.encoding,
              fieldname: file.fieldname,
            };

            callback(null, fileInfo);
          } catch (error) {
            callback(error);
          }
        });
      } catch (error) {
        callback(error);
      }
    },

    async _removeFile(
      req: Request,
      file: AzureBlobFile,
      callback: (error: Error | null) => void
    ): Promise<void> {
      try {
        await storageService.deleteFile(file.blobName, container);
        callback(null);
      } catch (error) {
        callback(error as Error);
      }
    },
  };
}

/**
 * Default blob name generator: UUID + original extension
 */
function defaultBlobName(req: Request, file: Express.Multer.File): string {
  const ext = path.extname(file.originalname);
  const basename = path.basename(file.originalname, ext);
  const uuid = uuidv4();
  return `${Date.now()}-${uuid}${ext}`;
}

/**
 * Default content type: Use file's mimetype
 */
function defaultContentType(req: Request, file: Express.Multer.File): string {
  return file.mimetype || 'application/octet-stream';
}

/**
 * Helper: Create multer instance with Azure Blob Storage
 * 
 * @param container - Storage container to use
 * @param options - Additional multer options
 */
export function createMulterAzureStorage(
  container: StorageContainer = StorageContainer.UPLOADS,
  options: {
    fileSize?: number;
    files?: number;
    fileFilter?: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => void;
    blobName?: (req: Request, file: Express.Multer.File) => string | Promise<string>;
  } = {}
) {
  const multer = require('multer');

  return multer({
    storage: azureBlobStorageEngine({
      container,
      blobName: options.blobName,
    }),
    limits: {
      fileSize: options.fileSize || 50 * 1024 * 1024, // 50MB default
      files: options.files || 10,
    },
    fileFilter: options.fileFilter,
  });
}

/**
 * Common file filters
 */
export const fileFilters = {
  /**
   * Accept only image files
   */
  images: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Only image files are allowed'), false);
    }
  },

  /**
   * Accept only video files
   */
  videos: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Only video files are allowed'), false);
    }
  },

  /**
   * Accept only document files
   */
  documents: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Only document files are allowed'), false);
    }
  },
};

/**
 * Example usage in Express routes
 */

// Example 1: Single file upload
/*
import express from 'express';
import { createMulterAzureStorage } from './multerAzureStorage';
import { StorageContainer } from './objectStorage';
import { fileFilters } from './multerAzureStorage';

const app = express();

const uploadProfile = createMulterAzureStorage(StorageContainer.PROFILES, {
  fileSize: 5 * 1024 * 1024, // 5MB
  fileFilter: fileFilters.images,
});

app.post('/api/profile/upload', uploadProfile.single('avatar'), (req, res) => {
  const file = req.file as AzureBlobFile;
  res.json({
    success: true,
    url: file.url,
    filename: file.blobName,
  });
});
*/

// Example 2: Multiple files upload
/*
const uploadVideos = createMulterAzureStorage(StorageContainer.VIDEOS, {
  fileSize: 100 * 1024 * 1024, // 100MB
  files: 5,
  fileFilter: fileFilters.videos,
});

app.post('/api/videos/upload', uploadVideos.array('videos', 5), (req, res) => {
  const files = req.files as AzureBlobFile[];
  res.json({
    success: true,
    files: files.map(f => ({
      url: f.url,
      filename: f.blobName,
      size: f.size,
    })),
  });
});
*/

// Example 3: Multiple fields
/*
const uploadMixed = createMulterAzureStorage(StorageContainer.UPLOADS);

app.post('/api/submit', uploadMixed.fields([
  { name: 'document', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]), (req, res) => {
  const files = req.files as { [fieldname: string]: AzureBlobFile[] };
  res.json({
    success: true,
    document: files.document?.[0]?.url,
    images: files.images?.map(f => f.url),
  });
});
*/

// Example 4: Custom blob name
/*
const uploadCustom = createMulterAzureStorage(StorageContainer.UPLOADS, {
  blobName: (req, file) => {
    const userId = req.user?.id || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    return `${userId}/${timestamp}${ext}`;
  },
});

app.post('/api/custom/upload', uploadCustom.single('file'), (req, res) => {
  const file = req.file as AzureBlobFile;
  res.json({
    success: true,
    url: file.url,
  });
});
*/
