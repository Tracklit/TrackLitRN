import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'stkvnx2h6p44qw4';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';

// Container names for different content types
export enum BlobContainer {
  PROFILE_IMAGES = 'profile-images',
  VIDEO_ANALYSIS = 'video-analysis',
  PHOTO_FINISH = 'photo-finish',
  EXERCISE_LIBRARY = 'exercise-library',
  MESSAGES = 'messages',
  PROGRAMS = 'programs'
}

let blobServiceClient: BlobServiceClient | null = null;

/**
 * Initialize Azure Blob Storage client
 */
export function initializeBlobStorage() {
  if (!accountName || !accountKey) {
    console.warn('⚠️  Azure Storage credentials not configured. Files will be stored locally (not persistent across restarts).');
    return null;
  }

  try {
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
    console.log('✅ Azure Blob Storage initialized successfully');
    return blobServiceClient;
  } catch (error) {
    console.error('❌ Failed to initialize Azure Blob Storage:', error);
    return null;
  }
}

/**
 * Upload a file buffer to Azure Blob Storage with user-specific path structure
 * @param buffer File buffer to upload
 * @param userId User ID for folder organization
 * @param container Container type (profile-images, video-analysis, etc.)
 * @param originalName Original filename
 * @param contentType MIME type
 * @returns Public URL of the uploaded blob
 */
export async function uploadToBlob(
  buffer: Buffer,
  userId: number,
  container: BlobContainer,
  originalName: string,
  contentType: string
): Promise<string> {
  if (!blobServiceClient) {
    throw new Error('Blob storage not initialized. Check Azure Storage credentials.');
  }

  try {
    // Get or create container
    const containerClient = blobServiceClient.getContainerClient(container);
    await containerClient.createIfNotExists({
      access: 'blob', // Public read access
    });

    // Generate unique filename with user folder structure: user-{userId}/{functionality}/{uuid}.ext
    const ext = originalName.split('.').pop();
    const timestamp = Date.now();
    const blobName = `user-${userId}/${container}/${timestamp}-${uuidv4()}.${ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the file
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    console.log(`✅ Uploaded ${blobName} to ${container}`);
    
    // Return the public URL
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading to blob storage:', error);
    throw error;
  }
}

/**
 * Delete a blob from Azure Blob Storage
 * @param blobUrl Full URL of the blob to delete
 */
export async function deleteBlob(blobUrl: string): Promise<void> {
  if (!blobServiceClient || !blobUrl) return;

  try {
    // Extract container and blob name from URL
    // URL format: https://{account}.blob.core.windows.net/{container}/{blobName}
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/').filter(p => p); // Remove empty strings
    
    if (pathParts.length < 2) {
      console.error('Invalid blob URL format:', blobUrl);
      return;
    }
    
    const containerName = pathParts[0];
    const blobName = pathParts.slice(1).join('/'); // Handle nested paths

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
    console.log(`🗑️  Deleted blob: ${blobName} from ${containerName}`);
  } catch (error) {
    console.error('Error deleting blob:', error);
  }
}

/**
 * List all blobs for a specific user in a container
 * @param userId User ID
 * @param container Container type
 * @returns Array of blob URLs
 */
export async function listUserBlobs(userId: number, container: BlobContainer): Promise<string[]> {
  if (!blobServiceClient) {
    throw new Error('Blob storage not initialized');
  }

  try {
    const containerClient = blobServiceClient.getContainerClient(container);
    const prefix = `user-${userId}/${container}/`;
    const blobUrls: string[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      const blobClient = containerClient.getBlobClient(blob.name);
      blobUrls.push(blobClient.url);
    }

    return blobUrls;
  } catch (error) {
    console.error('Error listing blobs:', error);
    return [];
  }
}

/**
 * Check if Azure Blob Storage is available
 */
export function isBlobStorageAvailable(): boolean {
  return blobServiceClient !== null;
}
