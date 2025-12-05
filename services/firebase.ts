// Mock Firebase implementation to support Offline Mode
// preventing "Module not found" errors in environments without Firebase SDK.

export interface User {
  uid: string;
  isAnonymous: boolean;
}

export const app = {};
export const auth = {};

// Auth Mocks
export const getAuth = (app: any) => ({});
export const signInAnonymously = async (auth: any) => {
  return { user: { uid: 'offline', isAnonymous: true } };
};
export const onAuthStateChanged = (auth: any, cb: (user: User | null) => void, err?: (e: any) => void) => {
  // Trigger offline user immediately
  setTimeout(() => cb({ uid: 'offline', isAnonymous: true }), 0);
  return () => {};
};

// Firestore Mocks
export const getFirestore = (app: any) => ({});
export const collection = (db: any, path: string) => ({});
export const doc = (db: any, path: string, ...segments: string[]) => ({});
export const setDoc = async (ref: any, data: any, options?: any) => {};
export const deleteDoc = async (ref: any) => {};
export const onSnapshot = (query: any, onNext: (snap: any) => void, onError?: (error: any) => void) => {
  return () => {};
};
export const query = (query: any, ...constraints: any[]) => ({});

// Default config (unused)
const firebaseConfig = {
  apiKey: "AIzaSyDUMMY",
  authDomain: "dummy.firebaseapp.com",
  projectId: "dummy",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000"
};