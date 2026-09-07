/**
 * API Library - auth.js
 * Authentication Service & User State Management
 */

import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "./firebase.js";

// Cached profile in memory
let currentUserProfile = null;

/**
 * Register a new user with email, password, and display name
 */
export async function registerUser(email, password, displayName) {
  if (!auth) throw new Error("Firebase Auth не инициализирован. Проверьте js/firebase.js");

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update Firebase Auth profile
  if (displayName) {
    await updateProfile(user, { displayName });
  }

  // Create user document in Firestore: users/{userId}
  const userRef = doc(db, "users", user.uid);
  const userDocData = {
    uid: user.uid,
    displayName: displayName || email.split("@")[0],
    email: email.toLowerCase(),
    role: "user", // Default role is user
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(userRef, userDocData);

  currentUserProfile = { ...userDocData, createdAt: new Date() };
  return user;
}

/**
 * Sign in existing user with email and password
 */
export async function loginUser(email, password) {
  if (!auth) throw new Error("Firebase Auth не инициализирован. Проверьте js/firebase.js");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  currentUserProfile = await fetchUserProfile(credential.user.uid);
  return credential.user;
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
  currentUserProfile = null;
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!auth) throw new Error("Firebase Auth не инициализирован.");
  return sendPasswordResetEmail(auth, email);
}

/**
 * Fetch user document from Firestore
 */
export async function fetchUserProfile(uid) {
  if (!db || !uid) return null;
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Update user profile display name
 */
export async function updateUserDisplayName(uid, newName) {
  if (!auth || !auth.currentUser) throw new Error("Пользователь не авторизован");

  await updateProfile(auth.currentUser, { displayName: newName });
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    displayName: newName,
    updatedAt: serverTimestamp()
  });

  if (currentUserProfile) {
    currentUserProfile.displayName = newName;
  }
}

/**
 * Get cached profile or null
 */
export function getCurrentUserProfile() {
  return currentUserProfile;
}

/**
 * Subscribe to Auth state changes
 */
export function onAuthChange(callback) {
  if (!auth) {
    callback(null, null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserProfile = await fetchUserProfile(user.uid);
      callback(user, currentUserProfile);
    } else {
      currentUserProfile = null;
      callback(null, null);
    }
  });
}

/**
 * Route guard helper to require authentication or specific role
 */
export function requireAuth(requiredRole = null, redirectUrl = "login.html") {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(window.location.pathname)}`;
        resolve(null);
        return;
      }

      const profile = await fetchUserProfile(user.uid);
      if (requiredRole && (!profile || profile.role !== requiredRole)) {
        window.location.href = "index.html";
        resolve(null);
        return;
      }

      resolve({ user, profile });
    });
  });
}
