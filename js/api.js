/**
 * API Library - api.js
 * Firestore API Collection Operations, Pagination, Real-Time Subscriptions & CRUD
 */

import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment
} from "./firebase.js";

/**
 * Generate lowercase search keywords for Firestore array-contains search
 */
export function generateSearchKeywords(name, shortDescription, category, tags = []) {
  const combined = `${name || ""} ${shortDescription || ""} ${category || ""} ${(tags || []).join(" ")}`.toLowerCase();
  const words = combined
    .replace(/[^\w\sа-яё]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  return Array.from(new Set(words));
}

/**
 * Build Firestore Query constraints based on active filters and sorting
 */
function buildQueryConstraints({
  category = "All",
  authentication = "All",
  pricing = "All",
  format = "All",
  sortBy = "rating",
  sortOrder = "desc",
  pageSize = 12,
  lastDoc = null,
  searchKeyword = ""
}) {
  const constraints = [];

  // Filter: Category
  if (category && category !== "All") {
    constraints.push(where("category", "==", category));
  }

  // Filter: Authentication
  if (authentication && authentication !== "All") {
    constraints.push(where("authentication", "==", authentication));
  }

  // Filter: Pricing / Free tier
  if (pricing && pricing !== "All") {
    if (pricing === "Free") {
      constraints.push(where("freeTier", "==", true));
    } else if (pricing === "Paid") {
      constraints.push(where("freeTier", "==", false));
    } else if (pricing === "Freemium") {
      constraints.push(where("pricing", "==", "Freemium"));
    }
  }

  // Filter: Data Format
  if (format && format !== "All") {
    constraints.push(where("format", "==", format));
  }

  // Search by keyword using searchKeywords array
  if (searchKeyword && searchKeyword.trim().length >= 2) {
    const term = searchKeyword.trim().toLowerCase();
    constraints.push(where("searchKeywords", "array-contains", term));
  }

  // Sorting
  // In Firestore, if you have a where() equality on one field, you can orderBy other fields.
  // We specify the order field
  const validSortFields = {
    rating: "rating",
    createdAt: "createdAt",
    name: "nameLower",
    popularity: "popularity"
  };

  const sortField = validSortFields[sortBy] || "rating";
  const direction = sortOrder === "asc" ? "asc" : "desc";
  constraints.push(orderBy(sortField, direction));

  // Pagination start cursor
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  // Page limit
  constraints.push(limit(pageSize));

  return constraints;
}

/**
 * Real-time subscription to the first page of APIs matching filters
 * @param {Object} filterParams
 * @param {Function} callback (apis, lastDoc, error)
 * @returns {Function} unsubscribe function
 */
export function subscribeToApis(filterParams, callback) {
  if (!db) {
    callback([], null, new Error("Firebase Firestore не инициализирован."));
    return () => {};
  }

  try {
    // 1. Instantaneous render via Server API (< 50ms)
    (async () => {
      try {
        const params = new URLSearchParams();
        if (filterParams.category && filterParams.category !== "All") params.set("category", filterParams.category);
        if (filterParams.source && filterParams.source !== "All") params.set("source", filterParams.source);
        if (filterParams.authentication && filterParams.authentication !== "All") params.set("auth", filterParams.authentication);
        if (filterParams.pricing && filterParams.pricing !== "All") params.set("pricing", filterParams.pricing);
        if (filterParams.format && filterParams.format !== "All") params.set("format", filterParams.format);
        if (filterParams.sortBy) params.set("sortBy", filterParams.sortBy);
        if (filterParams.searchKeyword) params.set("q", filterParams.searchKeyword);

        const res = await fetch(`/api/apis?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.apis && data.apis.length > 0) {
            callback(data.apis, null, null);
          }
        }
      } catch (_) {}
    })();

    const constraints = buildQueryConstraints(filterParams);
    const q = query(collection(db, "apis"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let apis = [];
        snapshot.forEach((docSnap) => {
          apis.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (filterParams.source && filterParams.source !== "All") {
          if (filterParams.source === "apis.guru") {
            apis = apis.filter(a => a.source === "apis.guru" || a.swaggerUrl);
          } else if (filterParams.source === "verified") {
            apis = apis.filter(a => a.source !== "apis.guru" && !a.swaggerUrl);
          }
        }

        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;
        callback(apis, lastVisible, null);
      },
      async (error) => {
        console.warn("Firestore onSnapshot note:", error.message);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error("Error setting up query:", err);
    callback([], null, err);
    return () => {};
  }
}

/**
 * Fetch the next page of APIs using startAfter (Pagination)
 */
export async function fetchNextPageApis(filterParams, lastVisibleDoc) {
  if (!db || !lastVisibleDoc) return { apis: [], lastDoc: null };

  const constraints = buildQueryConstraints({
    ...filterParams,
    lastDoc: lastVisibleDoc
  });

  const q = query(collection(db, "apis"), ...constraints);
  const snapshot = await getDocs(q);

  let apis = [];
  snapshot.forEach((docSnap) => {
    apis.push({ id: docSnap.id, ...docSnap.data() });
  });

  if (filterParams.source && filterParams.source !== "All") {
    if (filterParams.source === "apis.guru") {
      apis = apis.filter(a => a.source === "apis.guru" || a.swaggerUrl);
    } else if (filterParams.source === "verified") {
      apis = apis.filter(a => a.source !== "apis.guru" && !a.swaggerUrl);
    }
  }

  const nextLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  return { apis, lastDoc: nextLastDoc };
}

/**
 * Get a single API by ID, incrementing popularity view count
 */
export async function getApiById(apiId, incrementView = true) {
  try {
    if (db) {
      const docRef = doc(db, "apis", apiId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        if (incrementView) {
          updateDoc(docRef, { popularity: increment(1) }).catch(() => {});
        }
        return { id: docSnap.id, ...docSnap.data() };
      }
    }
  } catch (err) {
    console.warn("Firestore getDoc failed, attempting Server API:", err.message);
  }

  // Fallback to Server API
  try {
    const res = await fetch(`/api/apis/${encodeURIComponent(apiId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}

  return null;
}

/**
 * Create a new API document (Admin only)
 */
export async function createApi(apiData) {
  if (!db) throw new Error("Firestore не инициализирован");

  const name = apiData.name.trim();
  const searchKeywords = generateSearchKeywords(
    name,
    apiData.shortDescription,
    apiData.category,
    apiData.tags
  );

  const docData = {
    ...apiData,
    name,
    nameLower: name.toLowerCase(),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    rating: apiData.rating || 0,
    ratingCount: apiData.ratingCount || 0,
    popularity: apiData.popularity || 0,
    searchKeywords,
    status: apiData.status || "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "apis"), docData);
  return docRef.id;
}

/**
 * Update an existing API document (Admin only)
 */
export async function updateApi(apiId, apiData) {
  if (!db) throw new Error("Firestore не инициализирован");

  const docRef = doc(db, "apis", apiId);
  const name = apiData.name ? apiData.name.trim() : "";

  const updatePayload = {
    ...apiData,
    updatedAt: serverTimestamp()
  };

  if (name) {
    updatePayload.name = name;
    updatePayload.nameLower = name.toLowerCase();
    updatePayload.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    updatePayload.searchKeywords = generateSearchKeywords(
      name,
      apiData.shortDescription,
      apiData.category,
      apiData.tags
    );
  }

  await updateDoc(docRef, updatePayload);
}

/**
 * Delete an API document (Admin only)
 */
export async function deleteApi(apiId) {
  if (!db) throw new Error("Firestore не инициализирован");
  await deleteDoc(doc(db, "apis", apiId));
}

/**
 * Get aggregated stats for admin dashboard
 */
export async function getAdminStats() {
  if (!db) return { apisCount: 0, usersCount: 0, reviewsCount: 0, categoriesCount: 0 };

  try {
    const [apisSnap, usersSnap, reviewsSnap] = await Promise.all([
      getDocs(collection(db, "apis")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "reviews"))
    ]);

    const categoriesSet = new Set();
    const apisList = [];

    apisSnap.forEach((d) => {
      const data = d.data();
      if (data.category) categoriesSet.add(data.category);
      apisList.push({ id: d.id, ...data });
    });

    // Top APIs by popularity
    apisList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const topApis = apisList.slice(0, 5);

    return {
      apisCount: apisSnap.size,
      usersCount: usersSnap.size,
      reviewsCount: reviewsSnap.size,
      categoriesCount: categoriesSet.size,
      topApis
    };
  } catch (err) {
    console.error("Error fetching stats:", err);
    return { apisCount: 0, usersCount: 0, reviewsCount: 0, categoriesCount: 0, topApis: [] };
  }
}
