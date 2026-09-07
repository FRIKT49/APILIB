/**
 * API Library - seed.js
 * Database Seeder for Cloud Firestore
 */

import { db, doc, setDoc, serverTimestamp } from "./firebase.js";
import { generateSearchKeywords } from "./api.js";
import { DEMO_APIS } from "./demoData.js";

export { DEMO_APIS };

/**
 * Seed Firestore with demo APIs
 * @param {Function} onProgress Progress callback with (current, total, name)
 */
export async function seedDatabase(onProgress) {
  if (!db) throw new Error("Firestore не инициализирован. Проверьте js/firebase.js");

  let count = 0;
  for (const api of DEMO_APIS) {
    const name = api.name.trim();
    const searchKeywords = generateSearchKeywords(
      name,
      api.shortDescription,
      api.category,
      api.tags
    );

    const docRef = doc(db, "apis", api.id);
    const docData = {
      ...api,
      name,
      nameLower: name.toLowerCase(),
      slug: api.id,
      searchKeywords,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, docData, { merge: true });
    count++;
    if (onProgress) onProgress(count, DEMO_APIS.length, api.name);
  }

  return count;
}
