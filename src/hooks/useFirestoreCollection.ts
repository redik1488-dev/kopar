import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFirestoreCollection<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id } as T);
        });
        setData(items);
      },
      (error) => {
        console.error(`Error fetching collection ${collectionName}:`, error);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return data;
}
