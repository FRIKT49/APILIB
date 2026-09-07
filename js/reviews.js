/**
 * API Library - reviews.js
 * Reviews and Ratings Service with Real-Time Firestore Listeners & Denormalized Rating Calculation
 */

import {
  db,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";

/**
 * Subscribe in real-time to reviews for a specific API
 */
export function subscribeToApiReviews(apiId, callback) {
  if (!db || !apiId) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, "reviews"),
      where("apiId", "==", apiId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const reviews = [];
        snapshot.forEach((docSnap) => {
          reviews.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback(reviews);
      },
      (error) => {
        console.error("Reviews onSnapshot error:", error);
        callback([]);
      }
    );
  } catch (err) {
    console.error("Error setting up reviews listener:", err);
    callback([]);
    return () => {};
  }
}

/**
 * Add a new review and recalculate API's average rating
 */
export async function addReview({ apiId, rating, text, user, profile }) {
  if (!db) throw new Error("Firestore не инициализирован");
  if (!user) throw new Error("Необходимо авторизоваться");

  const displayName = profile?.displayName || user.displayName || user.email.split("@")[0];

  const reviewData = {
    apiId,
    userId: user.uid,
    userName: displayName,
    userEmail: user.email,
    rating: Number(rating),
    text: text.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "reviews"), reviewData);

  // Recalculate average rating
  await recalculateApiRating(apiId);

  return docRef.id;
}

/**
 * Update an existing review and recalculate API's average rating
 */
export async function updateReview(reviewId, apiId, rating, text) {
  if (!db) throw new Error("Firestore не инициализирован");

  const reviewRef = doc(db, "reviews", reviewId);
  await updateDoc(reviewRef, {
    rating: Number(rating),
    text: text.trim(),
    updatedAt: serverTimestamp()
  });

  await recalculateApiRating(apiId);
}

/**
 * Delete a review (by owner or admin) and recalculate API's average rating
 */
export async function deleteReview(reviewId, apiId) {
  if (!db) throw new Error("Firestore не инициализирован");

  await deleteDoc(doc(db, "reviews", reviewId));
  await recalculateApiRating(apiId);
}

/**
 * Recalculate and denormalize average rating & review count directly on the API doc
 */
export async function recalculateApiRating(apiId) {
  if (!db || !apiId) return;

  try {
    const q = query(collection(db, "reviews"), where("apiId", "==", apiId));
    const snap = await getDocs(q);

    let totalScore = 0;
    let count = 0;

    snap.forEach((d) => {
      const data = d.data();
      if (typeof data.rating === "number") {
        totalScore += data.rating;
        count++;
      }
    });

    const averageRating = count > 0 ? Number((totalScore / count).toFixed(1)) : 0;

    const apiRef = doc(db, "apis", apiId);
    await updateDoc(apiRef, {
      rating: averageRating,
      ratingCount: count,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Recalculate rating warning:", err.message);
  }
}

/**
 * Fetch reviews written by a specific user (for profile.html)
 */
export async function getUserReviews(userId) {
  if (!db || !userId) return [];

  const q = query(
    collection(db, "reviews"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  const reviews = [];
  snap.forEach((d) => reviews.push({ id: d.id, ...d.data() }));
  return reviews;
}
