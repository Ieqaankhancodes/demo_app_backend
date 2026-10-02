import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
export const isFirebaseConfigured = Boolean(apiKey && !apiKey.includes('YOUR_FIREBASE') && !apiKey.includes('AIzaSyDemoKey'));

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyPlaceholderForTesting123456",
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-voting-app.firebaseapp.com",
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://demo-voting-app-default-rtdb.firebaseio.com",
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-voting-app",
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-voting-app.appspot.com",
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
