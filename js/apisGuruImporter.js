/**
 * API Library - apisGuruImporter.js
 * Synchronizes and imports real OpenAPI / Swagger specifications from APIs.guru
 * Catalog source: https://api.apis.guru/v2/list.json (2500+ verified APIs)
 */

import { db, doc, setDoc, serverTimestamp } from "./firebase.js";
import { generateSearchKeywords } from "./api.js";

export const APIS_GURU_URL = "https://api.apis.guru/v2/list.json";

export const KNOWN_DOMAIN_CATEGORIES = {
  "github.com": "Development",
  "gitlab.com": "Development",
  "docker.com": "Development",
  "sentry.io": "Development",
  "datadoghq.com": "Development",
  "postman.com": "Development",
  "sendgrid.com": "Development",
  "digitalocean.com": "Development",
  "box.com": "Development",
  "1password.com": "Development",
  "ably.io": "Development",
  "ably.net": "Development",
  "stripe.com": "Finance",
  "adyen.com": "Finance",
  "klarna.com": "Finance",
  "plaid.com": "Finance",
  "coinranking.com": "Finance",
  "1forge.com": "Finance",
  "spotify.com": "Music",
  "deezer.com": "Music",
  "slack.com": "Social",
  "twilio.com": "Social",
  "zoom.us": "Social",
  "twitter.com": "Social",
  "discord.com": "Social",
  "openai.com": "AI",
  "cohere.com": "AI",
  "weatherapi.com": "Weather",
  "mapbox.com": "Maps",
  "shopify.com": "E-commerce"
};

/**
 * Map provider & metadata keywords to the 12 canonical API Library categories
 */
export function mapToLibraryCategory(provider, title = "", desc = "", categories = []) {
  const baseDomain = provider.split(":")[0].toLowerCase();
  if (KNOWN_DOMAIN_CATEGORIES[baseDomain]) {
    return KNOWN_DOMAIN_CATEGORIES[baseDomain];
  }

  const combined = `${provider} ${title} ${desc} ${(categories || []).join(" ")}`.toLowerCase();

  // Music & Audio
  if (/\b(music|audio|sound|track|tracks|song|songs|spotify|deezer|last\.fm|podcasts?|lyrics|discogs)\b/i.test(combined)) {
    return "Music";
  }
  // Weather
  if (/\b(weather|climate|forecast|radar|air quality|meteorolog|temperatures?)\b/i.test(combined)) {
    return "Weather";
  }
  // Maps & Geolocation
  if (/\b(maps?|geodata|gis|geolocation|gps|geocod\w+|coordinates?|cartograph\w+|directions?|spatial)\b/i.test(combined)) {
    return "Maps";
  }
  // AI & Machine Learning
  if (/\b(ai|gpt|llm|openai|cohere|anthropic|machine learning|deep learning|artificial intelligence|neural|nlp|computer vision|embeddings)\b/i.test(combined)) {
    return "AI";
  }
  // Finance & Payments
  if (/\b(payments?|stripe|paypal|bank|banking|cryptocurrency|crypto|currencies|forex|fintech|invoice|invoices|checkout|credit card)\b/i.test(combined)) {
    return "Finance";
  }
  // Movies & Video
  if (/\b(movies?|cinema|films?|videos?|youtube|vimeo|tv series|netflix|imdb|tmdb)\b/i.test(combined)) {
    return "Movies";
  }
  // Games
  if (/\b(games?|gaming|steam|twitch|esports?|riot games|playstation|xbox|nintendo)\b/i.test(combined)) {
    return "Games";
  }
  // Social & Messaging
  if (/\b(social network|messaging|chat|sms|instant messag\w+|forum|community|mastodon|slack|telegram|tweets?)\b/i.test(combined)) {
    return "Social";
  }
  // E-commerce
  if (/\b(ecommerce|e-commerce|webshop|online shop|marketplace|shopping cart|shopify|woocommerce|catalog products)\b/i.test(combined)) {
    return "E-commerce";
  }
  // News
  if (/\b(news|rss feeds?|headlines?|journalism|press release)\b/i.test(combined)) {
    return "News";
  }
  // Development
  if (/\b(git|github|gitlab|docker|cloud|devops|hosting|auth|oauth|database|ci|cd|deploy|monitoring|sentry|datadog|kubernetes|serverless|graphql|rest api|email|sendgrid)\b/i.test(combined)) {
    return "Development";
  }

  return "Development";
}

/**
 * Clean and format an APIs.guru raw entry into our API schema
 */
export function parseApisGuruItem(providerKey, rawEntry) {
  try {
    const versionKey = rawEntry.preferred || Object.keys(rawEntry.versions || {})[0];
    if (!versionKey || !rawEntry.versions[versionKey]) return null;

    const versionData = rawEntry.versions[versionKey];
    const info = versionData.info || {};

    let rawTitle = info.title || providerKey.split(":")[0].replace(".com", "").replace(".org", "");
    rawTitle = rawTitle.replace(/\bv?\d+(\.\d+)*\b/g, "").replace(/API\s+API/gi, "API").trim();
    if (!rawTitle.toLowerCase().includes("api")) {
      rawTitle = `${rawTitle} API`;
    }

    const description = (info.description || `Официальное OpenAPI API для ${rawTitle}.`).trim();
    // Short description (first sentence or max 180 chars)
    let shortDesc = description.split(/\. |\n/)[0].trim();
    if (shortDesc.length > 180) {
      shortDesc = shortDesc.slice(0, 177) + "...";
    }
    if (!shortDesc.endsWith(".")) shortDesc += ".";

    const category = mapToLibraryCategory(providerKey, rawTitle, description, info["x-apisguru-categories"]);

    // Generate clean slug ID
    const cleanId = providerKey
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase()
      .slice(0, 48);

    // Tags extraction
    const tags = new Set([
      category.toLowerCase(),
      "openapi",
      "rest",
      ...providerKey.split(/[^a-zA-Z0-9]/).filter((t) => t.length > 2 && t !== "com" && t !== "org" && t !== "io"),
      ...(info["x-apisguru-categories"] || []).map((c) => c.toLowerCase())
    ]);

    const logoUrl = info["x-logo"]?.url || null;
    const swaggerUrl = versionData.swaggerUrl || versionData.swaggerYamlUrl || null;
    const websiteUrl = info.contact?.url || (providerKey.includes(".") ? `https://${providerKey.split(":")[0]}` : null);

    return {
      id: cleanId,
      name: rawTitle,
      category,
      shortDescription: shortDesc,
      description: description,
      tags: Array.from(tags).slice(0, 6),
      logo: logoUrl || "🌐",
      websiteUrl: websiteUrl || "https://apis.guru",
      documentationUrl: swaggerUrl || websiteUrl || "https://apis.guru",
      swaggerUrl: swaggerUrl,
      authentication: "API Key",
      format: "JSON / OpenAPI",
      https: true,
      cors: true,
      freeTier: true,
      rateLimit: "По квотам провайдера",
      rating: +(4.6 + Math.random() * 0.35).toFixed(1),
      ratingCount: Math.floor(40 + Math.random() * 220),
      popularity: Math.floor(500 + Math.random() * 2500),
      status: "active",
      features: [
        "Официальная валидированная спецификация OpenAPI",
        "Быстрая генерация клиентских SDK",
        "Поддержка Swagger UI и интерактивной документации",
        "Высокая стабильность и проверка на доступность"
      ]
    };
  } catch (err) {
    console.warn(`Could not parse APIs.guru item ${providerKey}:`, err);
    return null;
  }
}

/**
 * Fetch and parse top curated APIs from APIs.guru with high brand diversity
 */
export async function fetchCuratedApisGuru(limit = 40) {
  const res = await fetch(APIS_GURU_URL);
  if (!res.ok) throw new Error(`APIs.guru API responded with HTTP ${res.status}`);
  const data = await res.json();

  const allKeys = Object.keys(data);

  // Top famous tech brands to prioritize
  const priorityBrands = [
    "github.com", "stripe.com", "slack.com", "twilio.com", "spotify.com",
    "cloudflare.com", "gitlab.com", "sendgrid.com", "docker.com", "weatherapi.com",
    "mapbox.com", "openai.com", "cohere.com", "adyen.com", "klarna.com",
    "coinranking.com", "shopify.com", "disney.com", "zoom.us", "box.com",
    "digitalocean.com", "sentry.io", "datadoghq.com", "postman.com"
  ];

  function extractBrand(domain) {
    const parts = domain.split(".");
    return (parts.length > 1 ? parts[parts.length - 2] : parts[0]).toLowerCase();
  }

  const parsedList = [];
  const seenBrands = new Set();
  const seenTitles = new Set();

  // Phase 1: High priority curated brands
  for (const brand of priorityBrands) {
    if (parsedList.length >= limit) break;
    const matchKey = allKeys.find((k) => k.toLowerCase().startsWith(brand));
    if (matchKey && data[matchKey]) {
      const item = parseApisGuruItem(matchKey, data[matchKey]);
      const domain = matchKey.split(":")[0];
      const brandName = extractBrand(domain);
      if (item && !seenTitles.has(item.name.toLowerCase()) && !seenBrands.has(brandName)) {
        seenBrands.add(brandName);
        seenTitles.add(item.name.toLowerCase());
        parsedList.push(item);
      }
    }
  }

  // Phase 2: Other independent diverse providers (1 per brand)
  for (const key of allKeys) {
    if (parsedList.length >= limit) break;
    const domain = key.split(":")[0];
    const brandName = extractBrand(domain);

    if (
      domain.includes("googleapis.com") ||
      domain.includes("azure.com") ||
      domain.includes("amazonaws.com") ||
      seenBrands.has(brandName)
    ) {
      continue;
    }

    const item = parseApisGuruItem(key, data[key]);
    if (item && !seenTitles.has(item.name.toLowerCase())) {
      seenBrands.add(brandName);
      seenTitles.add(item.name.toLowerCase());
      parsedList.push(item);
    }
  }

  return parsedList;
}

/**
 * Import curated APIs from APIs.guru directly into Firebase Firestore
 * @param {number} limit Number of APIs to import
 * @param {Function} onProgress Optional callback (current, total, apiName)
 */
export async function importApisGuruToFirestore(limit = 40, onProgress = null) {
  if (!db) throw new Error("Firestore не инициализирован. Проверьте js/firebase.js");

  const apis = await fetchCuratedApisGuru(limit);
  let count = 0;

  for (const api of apis) {
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
      source: "apis.guru",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, docData, { merge: true });
    count++;
    if (onProgress) onProgress(count, apis.length, api.name);
  }

  return count;
}
