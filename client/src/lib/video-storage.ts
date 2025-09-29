// Video storage utilities using IndexedDB for local device storage

export interface SavedVideoMetadata {
  id: string;
  name: string;
  duration: number;
  createdAt: string;
  thumbnail: string;
  size: number;
}

const DB_NAME = 'photoFinishVideos';
const VIDEOS_STORE = 'videos';
const METADATA_STORE = 'metadata';
const DB_VERSION = 1;

// Tier limits for video storage
export const TIER_LIMITS = {
  free: 5,
  pro: 25,
  star: 100,
} as const;

// Initialize IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(VIDEOS_STORE)) {
        db.createObjectStore(VIDEOS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Get tier limit for current user
export function getTierLimit(tier?: string): number {
  if (tier === 'star') return TIER_LIMITS.star;
  if (tier === 'pro') return TIER_LIMITS.pro;
  return TIER_LIMITS.free;
}

// Save video to IndexedDB
export async function saveVideo(
  videoBlob: Blob,
  metadata: SavedVideoMetadata
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIDEOS_STORE, METADATA_STORE], 'readwrite');
    
    // Save video blob
    const videoStore = transaction.objectStore(VIDEOS_STORE);
    videoStore.put({ id: metadata.id, blob: videoBlob });

    // Save metadata
    const metadataStore = transaction.objectStore(METADATA_STORE);
    metadataStore.put(metadata);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

// Get all video metadata
export async function getAllVideoMetadata(): Promise<SavedVideoMetadata[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(METADATA_STORE, 'readonly');
    const store = transaction.objectStore(METADATA_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      db.close();
      // Sort by createdAt descending (newest first)
      const videos = request.result as SavedVideoMetadata[];
      videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(videos);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Get video blob by ID
export async function getVideoBlob(id: string): Promise<Blob | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, 'readonly');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.get(id);

    request.onsuccess = () => {
      db.close();
      const result = request.result;
      resolve(result ? result.blob : null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Delete video by ID
export async function deleteVideo(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([VIDEOS_STORE, METADATA_STORE], 'readwrite');
    
    transaction.objectStore(VIDEOS_STORE).delete(id);
    transaction.objectStore(METADATA_STORE).delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

// Generate thumbnail from video
export async function generateThumbnail(videoBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('loadedmetadata', () => {
      // Seek to 1 second or middle of video
      video.currentTime = Math.min(1, video.duration / 2);
    });

    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      URL.revokeObjectURL(video.src);
      resolve(thumbnail);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video for thumbnail'));
    });
  });
}
