import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFirestoreDoc<T>(collectionName: string, docId: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [data, setData] = useState<T>(initialValue);

  useEffect(() => {
    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data().value as T);
        } else {
          // Initialize doc if it doesn't exist
          setDoc(docRef, { value: initialValue }).catch(console.error);
        }
      },
      (error) => {
        console.error(`Error fetching document ${collectionName}/${docId}:`, error);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId, initialValue]);

  const setValue = (valOrUpdater: T | ((prev: T) => T)) => {
    setData((prev) => {
      const newValue = typeof valOrUpdater === 'function' ? (valOrUpdater as (prev: T) => T)(prev) : valOrUpdater;
      setDoc(doc(db, collectionName, docId), { value: newValue }).catch(console.error);
      return newValue;
    });
  };

  return [data, setValue];
}
