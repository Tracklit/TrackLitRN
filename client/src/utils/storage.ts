import { SavedVideo } from '@shared/schema';

export class VBTStorage {
  private dbName = 'VBTAnalysis';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store for saved videos
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
          videoStore.createIndex('timestamp', 'timestamp', { unique: false });
          videoStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  async saveVideo(video: SavedVideo): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const request = store.put(video);

      request.onsuccess = () => {
        console.log('✅ Video saved to IndexedDB:', video.name);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save video'));
      };
    });
  }

  async getAllVideos(): Promise<SavedVideo[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videos'], 'readonly');
      const store = transaction.objectStore('videos');
      const request = store.getAll();

      request.onsuccess = () => {
        const videos = request.result || [];
        console.log(`📋 Retrieved ${videos.length} saved videos from IndexedDB`);
        resolve(videos);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve videos'));
      };
    });
  }

  async deleteVideo(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ Video deleted from IndexedDB:', id);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete video'));
      };
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['videos'], 'readwrite');
      const store = transaction.objectStore('videos');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🧹 All videos cleared from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear videos'));
      };
    });
  }
}

// Export singleton instance
export const vbtStorage = new VBTStorage();