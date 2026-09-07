/**
 * API Library - scripts/seedFirestore.js
 * Automated Seeder: Uploads all curated APIs directly to Google Cloud Firestore
 */

import { DEMO_APIS } from "../js/demoData.js";

const PROJECT_ID = "apilib-f706f";

function generateSearchKeywords(name, shortDescription, category, tags = []) {
  const combined = `${name || ""} ${shortDescription || ""} ${category || ""} ${(tags || []).join(" ")}`.toLowerCase();
  const words = combined
    .replace(/[^\w\sа-яё]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  return Array.from(new Set(words));
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === "id") continue;
    if (typeof val === "string") {
      fields[key] = { stringValue: val };
    } else if (typeof val === "number") {
      fields[key] = Number.isInteger(val)
        ? { integerValue: String(val) }
        : { doubleValue: val };
    } else if (typeof val === "boolean") {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((v) => ({ stringValue: String(v) }))
        }
      };
    }
  }
  return { fields };
}

async function uploadApi(api) {
  const name = api.name.trim();
  const searchKeywords = generateSearchKeywords(
    name,
    api.shortDescription,
    api.category,
    api.tags
  );

  const docData = {
    ...api,
    name,
    nameLower: name.toLowerCase(),
    slug: api.id,
    searchKeywords,
    status: api.status || "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const payload = toFirestoreFields(docData);
  // Using PATCH creates or replaces the document by ID (upsert)
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apis/${api.id}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  return await res.json();
}

async function run() {
  console.log("==================================================");
  console.log(`Запуск импорта ${DEMO_APIS.length} API в Cloud Firestore...`);
  console.log(`Проект: ${PROJECT_ID}`);
  console.log("==================================================");

  let success = 0;
  let errors = 0;

  for (let i = 0; i < DEMO_APIS.length; i++) {
    const api = DEMO_APIS[i];
    try {
      await uploadApi(api);
      success++;
      console.log(`[${i + 1}/${DEMO_APIS.length}] ✓ Загружен: ${api.name} (${api.category})`);
    } catch (err) {
      errors++;
      console.error(`[${i + 1}/${DEMO_APIS.length}] ✗ Ошибка ${api.name}:`, err.message);
    }
    // Small delay to prevent rate limit spikes
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("==================================================");
  console.log(`🎉 Импорт завершен! Успешно: ${success}, Ошибок: ${errors}`);
  console.log("==================================================");
}

run();
