import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isFirebaseConfigured = Boolean(apiKey && !apiKey.includes('YOUR_FIREBASE') && !apiKey.includes('AIzaSyDemoKey'));

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyPlaceholderForTesting123456",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-voting-app.firebaseapp.com",
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demo-voting-app-default-rtdb.firebaseio.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-voting-app",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-voting-app.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
