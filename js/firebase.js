/**
 * API Library - firebase.js
 * Firebase v10 Modular SDK Initialization & Service Exports
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =============================================================================
// FIREBASE CONFIGURATION
// Замените значения ниже на данные вашего проекта из Firebase Console:
// Project Settings -> General -> Your apps -> Web app -> Config
// =============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCH_cNZcLONkdiqKfGALni_l54-JeJBcHY",
  authDomain: "apilib-f706f.firebaseapp.com",
  projectId: "apilib-f706f",
  storageBucket: "apilib-f706f.firebasestorage.app",
  messagingSenderId: "738663311714",
  appId: "1:738663311714:web:7b6efb1a254f52487d243b",
  measurementId: "G-QTLB6ZWR4D",
};

// Check if placeholder config is present
export const isConfigPlaceholder =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.includes("YOUR_API_KEY") ||
  firebaseConfig.projectId.includes("demo");

// Initialize Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (error) {
  console.warn("Firebase initialization notice:", error.message);
}

export {
  app,
  auth,
  db,
  // Auth exports
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  // Firestore exports
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  writeBatch,
};
