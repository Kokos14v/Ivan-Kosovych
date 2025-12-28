
const DB_NAME = 'CoconutStorageV2';
const IMAGE_STORE = 'Images';
const META_STORE = 'Metadata';
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          db.createObjectStore(IMAGE_STORE);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      };
    } catch (e) {
      reject(e);
    }
  });
};

export const saveToStore = async (storeName: string, id: string, data: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data, id);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        // Log but don't crash if storage is full
        console.warn(`Storage Error in ${storeName}:`, request.error);
        resolve(); 
      };
    });
  } catch (e) {
    console.warn("IndexedDB not available or failed:", e);
  }
};

export const getFromStore = async (storeName: string, id: string): Promise<any | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB read failed:", e);
    return null;
  }
};

export const saveImage = (id: string, base64: string) => saveToStore(IMAGE_STORE, id, base64);
export const getImage = (id: string) => getFromStore(IMAGE_STORE, id);

export const saveMeta = (id: string, meta: any) => saveToStore(META_STORE, id, meta);
export const getMeta = (id: string) => getFromStore(META_STORE, id);
