/**
 * API Library - apiCard.js
 * API Card Template & Skeleton Loader
 */

/**
 * Render a single API card HTML
 * @param {Object} api API object with id
 * @param {boolean} isFavorite Whether current user has favorited this API
 */
export function createApiCardElement(api, isFavorite = false) {
  const card = document.createElement("div");
  card.className = "api-card";
  card.dataset.id = api.id;

  // Format rating
  const ratingVal = api.rating ? Number(api.rating).toFixed(1) : "—";
  const ratingCount = api.ratingCount || 0;

  // Pricing badge
  let pricingBadge = "";
  if (api.freeTier) {
    pricingBadge = `<span class="badge badge-success">Free Tier</span>`;
  } else if (api.pricing === "Free") {
    pricingBadge = `<span class="badge badge-success">Free</span>`;
  } else if (api.pricing === "Paid") {
    pricingBadge = `<span class="badge badge-warning">Paid</span>`;
  } else {
    pricingBadge = `<span class="badge badge-neutral">Freemium</span>`;
  }

  // Source badge: APIs.guru or Verified
  let sourceBadge = "";
  if (api.source === "apis.guru" || api.swaggerUrl) {
    sourceBadge = `<span class="badge" style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.28);" title="Импортировано из глобального каталога APIs.guru (OpenAPI)">🌐 APIs.guru</span>`;
  } else {
    sourceBadge = `<span class="badge" style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.28);" title="Проверенное официальное API платформы">⚡ Verified</span>`;
  }

  // Tags HTML (first 3)
  const tagsHtml = (api.tags || [])
    .slice(0, 3)
    .map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`)
    .join("");

  // Logo: image URL or emoji/letter fallback
  const logoHtml = api.logo && api.logo.startsWith("http")
    ? `<img src="${escapeHtml(api.logo)}" alt="${escapeHtml(api.name)}" class="api-logo" loading="lazy" onerror="this.onerror=null;this.textContent='🔌';">`
    : `<div class="api-logo">${api.logo || "⚡"}</div>`;

  card.innerHTML = `
    <div class="api-card-header">
      <div class="api-card-brand">
        ${logoHtml}
        <div class="api-title-group">
          <h3 class="api-card-title" title="${escapeHtml(api.name)}">${escapeHtml(api.name)}</h3>
          <div class="api-card-category" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="status-dot"></span><span>${escapeHtml(api.category || "General")}</span>
            ${sourceBadge}
          </div>
        </div>
      </div>
      <button class="btn-favorite-card ${isFavorite ? "active" : ""}" 
              data-favorite-btn="${api.id}" 
              title="${isFavorite ? "Удалить из избранного" : "Добавить в избранное"}"
              aria-label="В избранное">
        ${isFavorite ? "★" : "☆"}
      </button>
    </div>

    <p class="api-card-desc">${escapeHtml(api.shortDescription || api.description || "Описание отсутствует.")}</p>

    ${tagsHtml ? `<div class="api-card-tags">${tagsHtml}</div>` : ""}

    <div class="api-card-meta">
      <div class="api-meta-item">
        <span>Формат:</span>
        <strong>${escapeHtml(api.format || "JSON")}</strong>
      </div>
      <span>·</span>
      <div class="api-meta-item">
        <span>Авторизация:</span>
        <strong>${escapeHtml(api.authentication || "None")}</strong>
      </div>
      <span>·</span>
      <div class="api-meta-item">
        ${pricingBadge}
      </div>
    </div>

    <div class="api-card-footer">
      <div class="api-rating" title="Рейтинг: ${ratingVal} на основе ${ratingCount} оценок">
        <span>★</span>
        <span>${ratingVal}</span>
        <span class="api-rating-count">(${ratingCount})</span>
      </div>

      <a href="api.html?id=${encodeURIComponent(api.id)}" class="btn btn-secondary btn-sm">
        Подробнее →
      </a>
    </div>
  `;

  return card;
}

/**
 * Render skeleton card for loading state
 */
export function createSkeletonCardElement() {
  const skeleton = document.createElement("div");
  skeleton.className = "api-card api-card-skeleton";
  skeleton.innerHTML = `
    <div class="api-card-header">
      <div class="api-card-brand">
        <div class="skeleton skeleton-logo"></div>
        <div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-category"></div>
        </div>
      </div>
    </div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text"></div>
    <div style="margin-top: 16px; display: flex; gap: 6px;">
      <div class="skeleton" style="width: 50px; height: 18px; border-radius: 99px;"></div>
      <div class="skeleton" style="width: 60px; height: 18px; border-radius: 99px;"></div>
    </div>
    <div class="api-card-footer" style="margin-top: 24px;">
      <div class="skeleton" style="width: 50px; height: 20px;"></div>
      <div class="skeleton" style="width: 85px; height: 32px; border-radius: 6px;"></div>
    </div>
  `;
  return skeleton;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
