/**
 * API Library - search.js
 * Firestore Search Service with Debounce and Keyword / Prefix Query Strategies
 *
 * NOTE ON FIRESTORE SEARCH ARCHITECTURE:
 * Cloud Firestore is a NoSQL document database that does not provide native full-text
 * search (such as SQL LIKE '%term%' or Elasticsearch regex search).
 * To achieve fast, cheap and index-backed search without downloading the whole collection:
 * 1. Each API document maintains an array of lowercase search tokens: `searchKeywords`.
 * 2. Prefix queries use range conditions: `nameLower >= q && nameLower <= q + '\uf8ff'`.
 * 3. Array-contains queries search tokens: `where("searchKeywords", "array-contains", token)`.
 * 4. User input is debounced (350ms) to prevent unnecessary reads.
 */

import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "./firebase.js";

/**
 * Execute optimized Firestore search by title prefix or search tokens
 * @param {string} searchTerm
 * @param {number} maxResults
 * @returns {Promise<Array>} List of matching API objects
 */
export async function searchApis(searchTerm, maxResults = 15) {
  if (!db || !searchTerm || searchTerm.trim().length < 2) {
    return [];
  }

  const cleanTerm = searchTerm.trim().toLowerCase();
  const resultsMap = new Map();

  try {
    // Strategy 1: Prefix query on nameLower (e.g. "openw" -> "OpenWeather")
    const prefixQuery = query(
      collection(db, "apis"),
      where("nameLower", ">=", cleanTerm),
      where("nameLower", "<=", cleanTerm + "\uf8ff"),
      limit(maxResults)
    );

    const prefixSnap = await getDocs(prefixQuery);
    prefixSnap.forEach((doc) => {
      resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Strategy 2: If prefix yielded fewer results, try array-contains on searchKeywords
    if (resultsMap.size < maxResults) {
      const keywordQuery = query(
        collection(db, "apis"),
        where("searchKeywords", "array-contains", cleanTerm),
        limit(maxResults)
      );

      const keywordSnap = await getDocs(keywordQuery);
      keywordSnap.forEach((doc) => {
        if (!resultsMap.has(doc.id)) {
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    }

    return Array.from(resultsMap.values());
  } catch (error) {
    console.error("Firestore search query failed:", error);
    return [];
  }
}

/**
 * Utility debounce function for search input handling
 */
export function debounce(func, delay = 350) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
