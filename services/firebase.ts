import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBOwsFmuOZiez8yx72GXSiaZiUxq6IEW8c",
  authDomain: "smart-ai-q.firebaseapp.com",
  projectId: "smart-ai-q",
  storageBucket: "smart-ai-q.firebasestorage.app",
  messagingSenderId: "774904156234",
  appId: "1:774904156234:web:2c8b02b2746df14b4e56b3",
  measurementId: "G-958XLK9WQY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics };