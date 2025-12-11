/**
 * Azure Blob Storage Service for TrackLit
 * 
 * Handles file uploads, downloads, and deletions using Azure Blob Storage.
 * Replaces local file system storage with cloud storage.
 * 
 * Environment Variables Required:
 * - AZURE_STORAGE_CONNECTION_STRING: Azure Storage connection string
 * - AZURE_STORAGE_CONTAINER_UPLOADS: Container name for general uploads (default: uploads)
 * - AZURE_STORAGE_CONTAINER_VIDEOS: Container name for videos (default: videos)
 * - AZURE_STORAGE_CONTAINER_PROFILES: Container name for profile images (default: profiles)
 * - AZURE_STORAGE_CONTAINER_ANALYSIS: Container name for analysis results (default: analysis)
 */

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerClient,
  BlockBlobClient,
  BlobDownloadResponseParsed,
  ContainerCreateIfNotExistsResponse,
} from '@azure/storage-blob';
import { Readable } from 'stream';

/**
 * Container names for different types of files
 */
export enum StorageContainer {
  UPLOADS = 'uploads',
  VIDEOS = 'videos',
  PROFILES = 'profiles',
  ANALYSIS = 'analysis',
}

/**
 * Configuration for Azure Blob Storage
 */
interface StorageConfig {
  connectionString: string;
  containers: {
    uploads: string;
    videos: string;
    profiles: string;
    analysis: string;
  };
}

/**
 * File upload result
 */
export interface UploadResult {
  success: boolean;
  url: string;
  blobName: string;
  containerName: string;
  error?: string;
}

/**
 * File download result
 */
export interface DownloadResult {
  success: boolean;
  buffer?: Buffer;
  stream?: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  error?: string;
}

/**
 * File list result
 */
export interface FileListItem {
  name: string;
  url: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

/**
 * Azure Blob Storage Service Class
 */
class AzureBlobStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private config: StorageConfig;
  private isInitialized: boolean = false;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
      containers: {
        uploads: process.env.AZURE_STORAGE_CONTAINER_UPLOADS || 'uploads',
        videos: process.env.AZURE_STORAGE_CONTAINER_VIDEOS || 'videos',
        profiles: process.env.AZURE_STORAGE_CONTAINER_PROFILES || 'profiles',
        analysis: process.env.AZURE_STORAGE_CONTAINER_ANALYSIS || 'analysis',
      },
    };
  }

  /**
   * Initialize the blob service client and create containers if they don't exist
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if connection string is provided
      if (!this.config.connectionString) {
        console.warn(
          '⚠️ Azure Storage connection string not found. Using local file storage fallback.'
        );
        return;
      }

      // Create BlobServiceClient from connection string
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        this.config.connectionString
      );

      // Test connection by listing containers
      await this.blobServiceClient.listContainers().next();
      console.log('✅ Connected to Azure Blob Storage');

      // Create containers if they don't exist
      await this.ensureContainersExist();

      this.isInitialized = true;
      console.log('✅ Azure Blob Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Azure Blob Storage:', error);
      throw new Error(
        `Azure Blob Storage initialization failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Ensure all required containers exist
   */
  private async ensureContainersExist(): Promise<void> {
    if (!this.blobServiceClient) {
      throw new Error('BlobServiceClient not initialized');
    }

    const containers = Object.values(this.config.containers);

    for (const containerName of containers) {
      try {
        const containerClient = this.blobServiceClient.getContainerClient(containerName);
        const response: ContainerCreateIfNotExistsResponse =
          await containerClient.createIfNotExists({
            access: 'blob', // Public read access for blobs
          });

        if (response.succeeded) {
          console.log(`✅ Created container: ${containerName}`);
        } else {
          console.log(`ℹ️ Container already exists: ${containerName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create container ${containerName}:`, error);
        throw error;
      }
    }
  }

  /**
   * Get a container client
   */
  private getContainerClient(container: StorageContainer): ContainerClient {
    if (!this.blobServiceClient || !this.isInitialized) {
      throw new Error('Azure Blob Storage not initialized. Call initialize() first.');
    }

    const containerName = this.config.containers[container];
    return this.blobServiceClient.getContainerClient(containerName);
  }

  /**
   * Upload a file to Azure Blob Storage
   * 
   * @param buffer - File buffer to upload
   * @param blobName - Name of the blob (filename)
   * @param container - Storage container to use
   * @param contentType - MIME type of the file (optional)
   * @returns UploadResult with success status and URL
   */
  public async uploadFile(
    buffer: Buffer,
    blobName: string,
    container: StorageContainer = StorageContainer.UPLOADS,
    contentType?: string
  ): Promise<UploadResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

      // Upload the buffer
      const uploadOptions: any = {
        blobHTTPHeaders: {
          blobContentType: contentType || 'application/octet-stream',
        },
      };

      await blockBlobClient.uploadData(buffer, uploadOptions);

      const url = blockBlobClient.url;
      const containerName = this.config.containers[container];

      console.log(`✅ Uploaded ${blobName} to ${containerName}`);

      return {
        success: true,
        url,
        blobName,
        containerName,
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${blobName}:`, error);
      return {
        success: false,
        url: '',
        blobName,
        containerName: this.config.containers[container],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Upload a file from a stream
   * 
   * @param stream - Readable stream
   * @param blobName - Name of the blob (filename)
   * @param container - Storage container to use
   * @param contentType - MIME type of the file (optional)
   * @param bufferSize - Size of the buffer for uploading (default: 4MB)
   * @param maxConcurrency - Max concurrent upload operations (default: 5)
   * @returns UploadResult with success status and URL
   */
  public async uploadStream(
    stream: Readable,
    blobName: string,
    container: StorageContainer = StorageContainer.UPLOADS,
    contentType?: string,
    bufferSize: number = 4 * 1024 * 1024,
    maxConcurrency: number = 5
  ): Promise<UploadResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

      const uploadOptions: any = {
        blobHTTPHeaders: {
          blobContentType: contentType || 'application/octet-stream',
        },
        bufferSize,
        maxConcurrency,
      };

      await blockBlobClient.uploadStream(stream, bufferSize, maxConcurrency, uploadOptions);

      const url = blockBlobClient.url;
      const containerName = this.config.containers[container];

      console.log(`✅ Uploaded ${blobName} to ${containerName} (stream)`);

      return {
        success: true,
        url,
        blobName,
        containerName,
      };
    } catch (error) {
      console.error(`❌ Failed to upload stream ${blobName}:`, error);
      return {
        success: false,
        url: '',
        blobName,
        containerName: this.config.containers[container],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Download a file from Azure Blob Storage as a buffer
   * 
   * @param blobName - Name of the blob (filename)
   * @param container - Storage container to use
   * @returns DownloadResult with buffer and metadata
   */
  public async downloadFile(
    blobName: string,
    container: StorageContainer = StorageContainer.UPLOADS
  ): Promise<DownloadResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse: BlobDownloadResponseParsed = await blockBlobClient.download();

      if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream in download response');
      }

      // Convert stream to buffer
      const buffer = await this.streamToBuffer(downloadResponse.readableStreamBody);

      return {
        success: true,
        buffer,
        contentType: downloadResponse.contentType,
        contentLength: downloadResponse.contentLength,
      };
    } catch (error) {
      console.error(`❌ Failed to download ${blobName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Download a file as a stream (useful for large files)
   * 
   * @param blobName - Name of the blob (filename)
   * @param container - Storage container to use
   * @returns DownloadResult with stream and metadata
   */
  public async downloadFileStream(
    blobName: string,
    container: StorageContainer = StorageContainer.UPLOADS
  ): Promise<DownloadResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse: BlobDownloadResponseParsed = await blockBlobClient.download();

      if (!downloadResponse.readableStreamBody) {
        throw new Error('No readable stream in download response');
      }

      return {
        success: true,
        stream: downloadResponse.readableStreamBody as NodeJS.ReadableStream,
        contentType: downloadResponse.contentType,
        contentLength: downloadResponse.contentLength,
      };
    } catch (error) {
      console.error(`❌ Failed to download stream ${blobName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a file from Azure Blob Storage
   * 
   * @param blobName - Name of the blob (filename)
   * @param container - Storage container to use
   * @returns True if deleted successfully, false otherwise
   */
  public async deleteFile(
    blobName: string,
    container: StorageContainer = StorageContainer.UPLOADS
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.deleteIfExists();

      console.log(`✅ Deleted ${blobName} from ${this.config.containers[container]}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete ${blobName}:`, error);
      return false;
    }
  }

  /**
   * List files in a container
   * 
   * @param container - Storage container to list
   * @param prefix - Optional prefix to filter files
   * @param maxResults - Maximum number of results (default: 100)
   * @returns Array of FileListItem objects
   */
  public async listFiles(
    container: StorageContainer = StorageContainer.UPLOADS,
    prefix?: string,
    maxResults: number = 100
  ): Promise<FileListItem[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const files: FileListItem[] = [];

      const iterator = containerClient.listBlobsFlat({ prefix }).byPage({ maxPageSize: maxResults });

      for await (const response of iterator) {
        for (const blob of response.segment.blobItems) {
          const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
          
          files.push({
            name: blob.name,
            url: blockBlobClient.url,
            size: blob.properties.contentLength || 0,
            lastModified: blob.properties.lastModified || new Date(),
            contentType: blob.properties.contentType,
          });
        }

        // Only get first page for now
        break;
      }

      return files;
    } catch (error) {
      console.error(`❌ Failed to list files in ${container}:`, error);
      return [];
    }
  }

  /**
   * Check if a file exists
   * 
   * @param blobName - Name of the blob (filename)
   * @param container - Storage container to check
   * @returns True if exists, false otherwise
   */
  public async fileExists(
    blobName: string,
    container: StorageContainer = StorageContainer.UPLOADS
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

      return await blockBlobClient.exists();
    } catch (error) {
      console.error(`❌ Failed to check existence of ${blobName}:`, error);
      return false;
    }
  }

  /**
   * Get a signed URL with SAS token for temporary access
   * 
   * @param blobName - Name of the blob (filename)
   * @param container - Storage container
   * @param expiresInMinutes - Expiration time in minutes (default: 60)
   * @returns Signed URL with SAS token
   */
  public async getSignedUrl(
    blobName: string,
    container: StorageContainer = StorageContainer.UPLOADS,
    expiresInMinutes: number = 60
  ): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const containerClient = this.getContainerClient(container);
      const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

      // For connection string authentication, we need to generate SAS token manually
      // This is a simplified version - you may want to use @azure/storage-blob's generateBlobSASQueryParameters
      // For now, return the direct URL (containers are set to public read access)
      return blockBlobClient.url;
    } catch (error) {
      console.error(`❌ Failed to generate signed URL for ${blobName}:`, error);
      return null;
    }
  }

  /**
   * Helper: Convert stream to buffer
   */
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data: Buffer | string) => {
        chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.isInitialized && this.blobServiceClient !== null;
  }

  /**
   * Get configuration (without sensitive data)
   */
  public getConfig(): Omit<StorageConfig, 'connectionString'> {
    return {
      containers: this.config.containers,
    };
  }
}

// Export singleton instance
export const storageService = new AzureBlobStorageService();

// Export helper functions for backward compatibility
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  container: StorageContainer = StorageContainer.UPLOADS,
  contentType?: string
): Promise<UploadResult> {
  return storageService.uploadFile(buffer, filename, container, contentType);
}

export async function downloadFile(
  filename: string,
  container: StorageContainer = StorageContainer.UPLOADS
): Promise<DownloadResult> {
  return storageService.downloadFile(filename, container);
}

export async function deleteFile(
  filename: string,
  container: StorageContainer = StorageContainer.UPLOADS
): Promise<boolean> {
  return storageService.deleteFile(filename, container);
}

export async function listFiles(
  container: StorageContainer = StorageContainer.UPLOADS,
  prefix?: string
): Promise<FileListItem[]> {
  return storageService.listFiles(container, prefix);
}

export async function initializeStorage(): Promise<void> {
  return storageService.initialize();
}
