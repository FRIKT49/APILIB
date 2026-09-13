/**
 * API Library - server.js
 * Express Server & Server-Side Firestore Proxy
 * 
 * Решает проблему с блокировщиками рекламы (AdBlock / uBlock):
 * Браузер общается только с http://localhost:3000 (один домен, Same-Origin).
 * Запросы к Firestore выполняет сервер через Node.js.
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { DEMO_APIS } from "./js/demoData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ID = "apilib-f706f";

app.use(cors());
app.use(express.json());

// Отдаем статические файлы фронтенда
app.use(express.static(__dirname));

// Локальное in-memory хранилище на случай, если база данных еще создается в консоли
let localApis = [...DEMO_APIS];
let localReviews = [];

/**
 * Преобразование формата Firestore REST в стандартный JavaScript объект
 */
function parseFirestoreDoc(doc) {
  const id = doc.name.split("/").pop();
  const fields = doc.fields || {};
  const obj = { id };

  for (const [key, val] of Object.entries(fields)) {
    if ("stringValue" in val) obj[key] = val.stringValue;
    else if ("integerValue" in val) obj[key] = Number(val.integerValue);
    else if ("doubleValue" in val) obj[key] = Number(val.doubleValue);
    else if ("booleanValue" in val) obj[key] = Boolean(val.booleanValue);
    else if ("arrayValue" in val) {
      obj[key] = (val.arrayValue.values || []).map((v) => v.stringValue || v.integerValue || v);
    } else {
      obj[key] = Object.values(val)[0];
    }
  }
  return obj;
}

/**
 * Преобразование JS объекта в поля Firestore REST
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === "id") continue;
    if (typeof val === "string") fields[key] = { stringValue: val };
    else if (typeof val === "number") fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === "boolean") fields[key] = { booleanValue: val };
    else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((v) => ({ stringValue: String(v) }))
        }
      };
    }
  }
  return { fields };
}

// =============================================================================
// API ROUTES
// =============================================================================

// GET /api/apis — Получить список API с фильтрацией
app.get("/api/apis", async (req, res) => {
  const { category, auth: authFilter, pricing, format, q, sortBy, source } = req.query;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apis?pageSize=300`;
    const response = await fetch(url);
    const data = await response.json();

    let apis = [];
    if (data.documents && data.documents.length > 0) {
      apis = data.documents.map(parseFirestoreDoc);
    } else {
      // Использовать встроенные данные, если база пуста или создается
      apis = localApis;
    }

    // Фильтрация
    if (category && category !== "All") {
      apis = apis.filter((a) => a.category === category);
    }
    if (source && source !== "All") {
      if (source === "apis.guru") {
        apis = apis.filter((a) => a.source === "apis.guru" || a.swaggerUrl);
      } else if (source === "verified") {
        apis = apis.filter((a) => a.source !== "apis.guru" && !a.swaggerUrl);
      }
    }
    if (authFilter && authFilter !== "All") {
      apis = apis.filter((a) => a.authentication === authFilter);
    }
    if (format && format !== "All") {
      apis = apis.filter((a) => a.format === format);
    }
    if (pricing && pricing !== "All") {
      if (pricing === "Free") apis = apis.filter((a) => a.freeTier === true);
      else if (pricing === "Paid") apis = apis.filter((a) => a.freeTier === false);
      else if (pricing === "Freemium") apis = apis.filter((a) => a.pricing === "Freemium");
    }
    if (q && q.trim().length >= 2) {
      const search = q.trim().toLowerCase();
      apis = apis.filter(
        (a) =>
          (a.name && a.name.toLowerCase().includes(search)) ||
          (a.shortDescription && a.shortDescription.toLowerCase().includes(search)) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(search)))
      );
    }

    // Сортировка
    if (sortBy === "rating") apis.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === "popularity") apis.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    else if (sortBy === "name") apis.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    res.json({ apis, total: apis.length });
  } catch (err) {
    // Бесперебойный fallback
    res.json({ apis: localApis, total: localApis.length });
  }
});

// GET /api/apis/:id — Получить конкретный API
app.get("/api/apis/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apis/${id}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const api = parseFirestoreDoc(data);
      res.json(api);
      return;
    }
  } catch (_) {}

  // Fallback к локальным данным
  const found = localApis.find((a) => a.id === id || a.slug === id);
  if (found) {
    found.popularity = (found.popularity || 0) + 1;
    res.json(found);
  } else {
    res.status(404).json({ error: "API not found" });
  }
});

// POST /api/apis — Создать новый API
app.post("/api/apis", async (req, res) => {
  const apiData = req.body;
  const id = apiData.id || apiData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  apiData.id = id;
  apiData.rating = apiData.rating || 0;
  apiData.ratingCount = apiData.ratingCount || 0;
  apiData.popularity = 1;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apis?documentId=${id}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toFirestoreFields(apiData))
    });
  } catch (_) {}

  localApis.unshift(apiData);
  res.json({ success: true, id });
});

// DELETE /api/apis/:id — Удалить API
app.delete("/api/apis/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apis/${id}`;
    await fetch(url, { method: "DELETE" });
  } catch (_) {}

  localApis = localApis.filter((a) => a.id !== id && a.slug !== id);
  res.json({ success: true });
});

// GET /api/reviews — Получить отзывы для API
app.get("/api/reviews", (req, res) => {
  const { apiId } = req.query;
  const reviews = localReviews.filter((r) => !apiId || r.apiId === apiId);
  res.json(reviews);
});

// POST /api/reviews — Добавить отзыв и пересчитать рейтинг
app.post("/api/reviews", (req, res) => {
  const review = {
    id: "rev_" + Date.now(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  localReviews.unshift(review);

  // Пересчитываем рейтинг в API
  const api = localApis.find((a) => a.id === review.apiId);
  if (api) {
    const apiReviews = localReviews.filter((r) => r.apiId === review.apiId);
    const sum = apiReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    api.rating = Number((sum / apiReviews.length).toFixed(1));
    api.ratingCount = apiReviews.length;
  }

  res.json({ success: true, review });
});

// GET /api/stats — Статистика для админ-панели
app.get("/api/stats", (req, res) => {
  const categories = new Set(localApis.map((a) => a.category).filter(Boolean));
  res.json({
    apisCount: localApis.length,
    usersCount: 1,
    reviewsCount: localReviews.length,
    categoriesCount: categories.size,
    topApis: [...localApis].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5)
  });
});

// POST /api/seed — Загрузить 18 демо-API в базу
app.post("/api/seed", async (req, res) => {
  localApis = [...DEMO_APIS];
  for (const api of DEMO_APIS) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apis?documentId=${api.id}`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toFirestoreFields(api))
      });
    } catch (_) {}
  }
  res.json({ success: true, count: DEMO_APIS.length });
});

// POST /api/sync-sources — Запустить синхронизацию из APIs.guru в каталог
app.post("/api/sync-sources", (req, res) => {
  const limit = parseInt(req.body?.limit, 10) || 30;
  const scriptPath = path.join(__dirname, "scripts", "syncApisGuru.js");

  exec(`node "${scriptPath}" --limit ${limit}`, (error, stdout, stderr) => {
    if (error) {
      console.error("APIs.guru sync error:", error);
      return res.status(500).json({ success: false, error: error.message, details: stderr });
    }
    console.log("APIs.guru sync output:\n", stdout);
    res.json({
      success: true,
      message: `Синхронизация ${limit} API из APIs.guru успешно выполнена`,
      output: stdout
    });
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🚀 API Library Server запущен!`);
  console.log(`👉 Откройте в браузере: http://localhost:${PORT}`);
  console.log(`🛡️  Блокировка AdBlock полностью устранена!`);
  console.log("==================================================");
});
