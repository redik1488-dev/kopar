import { useState, useEffect, useCallback } from 'react';
import type { ImageOverlay } from '@/types';

export function getIDB<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kopar-db', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('store');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('store')) {
        resolve(undefined);
        return;
      }
      const tx = db.transaction('store', 'readonly');
      const store = tx.objectStore('store');
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    req.onerror = () => reject(req.error);
  });
}

function setIDB(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('kopar-db', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('store');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('store')) {
        resolve(); // Should not happen if onupgradeneeded ran
        return;
      }
      const tx = db.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      const putReq = store.put(value, key);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    req.onerror = () => reject(req.error);
  });
}

export function useImageStorage(key: string, initialValue: ImageOverlay[]): [ImageOverlay[], (value: ImageOverlay[] | ((prev: ImageOverlay[]) => ImageOverlay[])) => void] {
  const [storedValue, setStoredValue] = useState<ImageOverlay[]>(initialValue);

  useEffect(() => {
    getIDB<ImageOverlay[]>(key).then((val) => {
      if (val !== undefined) {
        setStoredValue(val);
      }
    }).catch(console.warn);
  }, [key]);

  const setValue = useCallback((value: ImageOverlay[] | ((prev: ImageOverlay[]) => ImageOverlay[])) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      setIDB(key, valueToStore).catch(console.warn);
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}
