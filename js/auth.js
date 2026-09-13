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

// LocalStorage key for persistent user session caching
export const AUTH_USER_KEY = "api_library_auth_user";

// Permanent Super Admin accounts list
export const SUPER_ADMIN_EMAILS = [
  "romankravshenko7@gmail.com"
];

// Helper to verify if an email belongs to super admins
export function isSuperAdminEmail(email) {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

// Cached profile in memory (initialized from localStorage if available)
let currentUserProfile = getCachedAuthUser();

/**
 * Get cached user session from localStorage
 */
export function getCachedAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.uid && data.email) {
      if (isSuperAdminEmail(data.email)) {
        data.role = "admin";
      }
      return data;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Save user session to localStorage
 */
export function setCachedAuthUser(user, profile) {
  try {
    if (!user) {
      clearCachedAuthUser();
      return;
    }
    const isAdmin = isSuperAdminEmail(user.email) || profile?.role === "admin" || user.role === "admin";
    const sessionData = {
      uid: user.uid,
      email: user.email,
      displayName: profile?.displayName || user.displayName || user.email.split("@")[0],
      photoURL: profile?.photoURL || user.photoURL || null,
      role: isAdmin ? "admin" : (profile?.role || "user"),
      cachedAt: Date.now()
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionData));
    currentUserProfile = profile || sessionData;
    if (currentUserProfile && isAdmin) {
      currentUserProfile.role = "admin";
    }
  } catch (e) {
    console.error("Failed to save auth session to localStorage:", e);
  }
}

/**
 * Clear user session from localStorage
 */
export function clearCachedAuthUser() {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (e) {}
  currentUserProfile = null;
}

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
  setCachedAuthUser(user, currentUserProfile);
  return user;
}

/**
 * Sign in existing user with email and password
 */
export async function loginUser(email, password) {
  if (!auth) throw new Error("Firebase Auth не инициализирован. Проверьте js/firebase.js");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  currentUserProfile = await fetchUserProfile(credential.user.uid);
  setCachedAuthUser(credential.user, currentUserProfile);
  return credential.user;
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  clearCachedAuthUser();
  if (!auth) return;
  await signOut(auth);
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
      const data = userSnap.data();
      if (isSuperAdminEmail(data.email)) {
        data.role = "admin";
      }
      return data;
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
  const cached = getCachedAuthUser();
  if (cached) {
    cached.displayName = newName;
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(cached));
    } catch (e) {}
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
  // 1. Immediately notify callback with cached session if present to avoid any flash on reload
  const cached = getCachedAuthUser();
  if (cached) {
    try {
      callback(cached, cached);
    } catch (err) {
      console.error("Error in onAuthChange cached handler:", err);
    }
  }

  if (!auth) {
    if (!cached) callback(null, null);
    return () => {};
  }

  // 2. Listen to Firebase Auth state
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUserProfile = await fetchUserProfile(user.uid);
      setCachedAuthUser(user, currentUserProfile);
      callback(user, currentUserProfile);
    } else {
      clearCachedAuthUser();
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
