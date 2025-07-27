
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth'; // Import getAuth and Auth type
import { getStorage, FirebaseStorage } from 'firebase/storage'; // Import getStorage and FirebaseStorage type

// Original configuration that uses environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Opcional
};

// console.log('Firebase Config used in firebase.ts:', firebaseConfig);

let app: FirebaseApp;
let db: Firestore;
let auth: Auth; // Declare auth variable
let storage: FirebaseStorage; // Declare storage variable

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app); // Initialize auth
db = getFirestore(app);
storage = getStorage(app); // Initialize storage

export { app, db, auth, storage };
