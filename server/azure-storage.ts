import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'stkvnx2h6p44qw4';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = 'profile-images';

let blobServiceClient: BlobServiceClient | null = null;

/**
 * Initialize Azure Blob Storage client
 */
export function initializeBlobStorage() {
  if (!accountName || !accountKey) {
    console.warn('⚠️  Azure Storage credentials not configured. Profile images will be stored locally (not persistent across restarts).');
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
 * Upload a file buffer to Azure Blob Storage
 * @param buffer File buffer to upload
 * @param originalName Original filename
 * @param contentType MIME type
 * @returns Public URL of the uploaded blob
 */
export async function uploadToBlob(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  if (!blobServiceClient) {
    throw new Error('Blob storage not initialized. Check Azure Storage credentials.');
  }

  try {
    // Create container if it doesn't exist
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({
      access: 'blob', // Public read access
    });

    // Generate unique filename
    const ext = originalName.split('.').pop();
    const blobName = `${uuidv4()}.${ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload the file
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

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
    // Extract blob name from URL
    const url = new URL(blobUrl);
    const pathParts = url.pathname.split('/');
    const blobName = pathParts[pathParts.length - 1];

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();
    console.log(`🗑️  Deleted blob: ${blobName}`);
  } catch (error) {
    console.error('Error deleting blob:', error);
  }
}

/**
 * Check if Azure Blob Storage is available
 */
export function isBlobStorageAvailable(): boolean {
  return blobServiceClient !== null;
}
