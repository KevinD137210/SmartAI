import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, app 
} from "./firebase";
import { Transaction, Invoice, Client, Project, CalendarEvent } from "../types";

const db = getFirestore(app);
const localEvents = new EventTarget();

// Generic Real-time Listener with Offline Fallback
// Uses <T,> to avoid TSX parsing ambiguity
export const subscribeToCollection = <T,>(
  userId: string, 
  collectionName: string, 
  callback: (data: T[]) => void
) => {
  // Offline Mode: Use LocalStorage
  if (userId === 'offline') {
    const load = () => {
       try {
         const raw = localStorage.getItem(`smartqx_${collectionName}`);
         const data = raw ? JSON.parse(raw) : [];
         callback(data);
       } catch (e) {
         console.error("Local load error", e);
         callback([]);
       }
    };
    // Initial Load
    load();

    // Listen for custom local updates (within same tab)
    const handler = (e: any) => {
        if (e.detail?.collectionName === collectionName) {
            load();
        }
    };
    localEvents.addEventListener('local-update', handler);
    return () => localEvents.removeEventListener('local-update', handler);
  }

  // Online Mode: Use Firestore
  try {
    const q = query(
        collection(db, `users/${userId}/${collectionName}`) 
    );

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc: any) => doc.data() as T);
        callback(data);
    }, (error) => {
        console.warn(`Error listening to ${collectionName}, failing gracefully to empty array:`, error);
        // We could also fallback to local storage here if we wanted hybrid sync
    });
  } catch (e) {
    console.error("Firestore init error", e);
    return () => {};
  }
};

// Generic Save Function (Create or Update)
export const saveData = async (userId: string, collectionName: string, docId: string, data: any) => {
  // Offline Mode
  if (userId === 'offline') {
      const key = `smartqx_${collectionName}`;
      const raw = localStorage.getItem(key);
      let items = raw ? JSON.parse(raw) : [];
      const index = items.findIndex((i: any) => i.id === docId);
      
      const dataWithUser = { ...data, userId: 'offline', updatedAt: new Date().toISOString() };
      
      if (index >= 0) {
          items[index] = { ...items[index], ...dataWithUser };
      } else {
          items.push(dataWithUser);
      }
      
      localStorage.setItem(key, JSON.stringify(items));
      localEvents.dispatchEvent(new CustomEvent('local-update', { detail: { collectionName } }));
      return;
  }

  // Online Mode
  try {
    const path = `users/${userId}/${collectionName}`;
    const dataWithUser = { ...data, userId: userId }; 
    await setDoc(doc(db, path, docId), dataWithUser, { merge: true });
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    throw error;
  }
};

// Generic Delete Function
export const deleteData = async (userId: string, collectionName: string, docId: string) => {
  // Offline Mode
  if (userId === 'offline') {
      const key = `smartqx_${collectionName}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      
      let items = raw ? JSON.parse(raw) : [];
      items = items.filter((i: any) => i.id !== docId);
      localStorage.setItem(key, JSON.stringify(items));
      localEvents.dispatchEvent(new CustomEvent('local-update', { detail: { collectionName } }));
      return;
  }

  // Online Mode
  try {
    const path = `users/${userId}/${collectionName}`;
    await deleteDoc(doc(db, path, docId));
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    throw error;
  }
};