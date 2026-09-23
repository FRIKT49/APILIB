/**
 * API Library - profile.js
 * User Profile Logic: Profile Updates, Favorites Subcollection & User's Reviews
 */

import {
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp
} from "./firebase.js";
import { getUserReviews, deleteReview } from "./reviews.js";
import { updateUserDisplayName, isSuperAdminEmail } from "./auth.js";
import { createApiCardElement } from "./components/apiCard.js";
import { toast } from "./components/toast.js";
import { showConfirmDialog } from "./components/modal.js";

/**
 * Check if a specific API is saved in user's favorites
 */
export async function isApiFavorite(userId, apiId) {
  if (!db || !userId || !apiId) return false;
  try {
    const favRef = doc(db, "users", userId, "favorites", apiId);
    const snap = await getDoc(favRef);
    return snap.exists();
  } catch (err) {
    console.warn("isApiFavorite check error:", err.message);
    return false;
  }
}

/**
 * Toggle favorite status for an API for current authenticated user
 * @returns {Promise<boolean>} True if now favorited, false if unfavorited
 */
export async function toggleFavorite(apiId) {
  if (!auth || !auth.currentUser) {
    throw new Error("Необходимо авторизоваться, чтобы добавлять в избранное");
  }

  const userId = auth.currentUser.uid;
  const favRef = doc(db, "users", userId, "favorites", apiId);
  const snap = await getDoc(favRef);

  if (snap.exists()) {
    await deleteDoc(favRef);
    return false;
  } else {
    await setDoc(favRef, {
      apiId,
      createdAt: serverTimestamp()
    });
    return true;
  }
}

/**
 * Get all favorite APIs for user with their API documents
 */
export async function getUserFavoriteApis(userId) {
  if (!db || !userId) return [];

  const favCol = collection(db, "users", userId, "favorites");
  const snap = await getDocs(favCol);

  const apiIds = [];
  snap.forEach((d) => apiIds.push(d.id));

  if (apiIds.length === 0) return [];

  const apis = [];
  for (const apiId of apiIds) {
    try {
      const apiDoc = await getDoc(doc(db, "apis", apiId));
      if (apiDoc.exists()) {
        apis.push({ id: apiDoc.id, ...apiDoc.data() });
      }
    } catch (err) {
      console.warn(`Could not load favorite API ${apiId}:`, err.message);
    }
  }

  return apis;
}

/**
 * Render profile page data (favorites and reviews tabs)
 */
export async function loadProfileData(user, profile) {
  // Update user badge and meta
  const nameDisplay = document.getElementById("profileDisplayName");
  const emailDisplay = document.getElementById("profileEmail");
  const roleDisplay = document.getElementById("profileRole");
  const dateDisplay = document.getElementById("profileCreatedDate");
  const avatarElem = document.getElementById("profileAvatar");
  const nameInput = document.getElementById("editDisplayNameInput");

  const displayName = profile?.displayName || user.displayName || user.email.split("@")[0];
  const initial = (displayName[0] || "U").toUpperCase();

  const isAdmin = profile?.role === "admin" || user?.role === "admin" || isSuperAdminEmail(user.email);

  if (nameDisplay) nameDisplay.textContent = displayName;
  if (emailDisplay) emailDisplay.textContent = user.email;
  if (roleDisplay) {
    roleDisplay.textContent = isAdmin ? "Администратор" : "Пользователь";
    roleDisplay.className = `badge ${isAdmin ? "badge-primary" : "badge-neutral"}`;
  }
  if (avatarElem) avatarElem.textContent = initial;
  if (nameInput) nameInput.value = displayName;

  const btnAdmin = document.getElementById("btnAdminPanelProfile");
  if (btnAdmin) {
    btnAdmin.style.display = isAdmin ? "inline-flex" : "none";
  }

  if (dateDisplay && profile?.createdAt) {
    const d = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
    dateDisplay.textContent = d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
  }

  // Load Favorites
  await loadFavoritesTab(user.uid);

  // Load User's Reviews
  await loadReviewsTab(user.uid);
}

async function loadFavoritesTab(userId) {
  const container = document.getElementById("favoritesList");
  if (!container) return;

  container.innerHTML = `<div class="empty-state"><p>Загрузка избранного...</p></div>`;

  try {
    const favorites = await getUserFavoriteApis(userId);
    if (favorites.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <h3 class="empty-state-title">В избранном пока ничего нет</h3>
          <p class="empty-state-text">Вы можете добавлять интересные API в избранное со страницы каталога или из карточки API.</p>
          <a href="index.html" class="btn btn-primary btn-sm">Перейти в каталог</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="api-grid" id="favoritesGrid"></div>`;
    const grid = document.getElementById("favoritesGrid");

    favorites.forEach((api) => {
      const card = createApiCardElement(api, true);
      // Bind favorite button in profile to unfavorite
      const favBtn = card.querySelector(`[data-favorite-btn="${api.id}"]`);
      if (favBtn) {
        favBtn.addEventListener("click", async () => {
          await toggleFavorite(api.id);
          toast.info("Удалено из избранного");
          loadFavoritesTab(userId);
        });
      }
      grid.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">Ошибка загрузки избранного: ${err.message}</p></div>`;
  }
}

async function loadReviewsTab(userId) {
  const container = document.getElementById("myReviewsList");
  if (!container) return;

  container.innerHTML = `<div class="empty-state"><p>Загрузка отзывов...</p></div>`;

  try {
    const reviews = await getUserReviews(userId);
    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <h3 class="empty-state-title">Вы ещё не оставили ни одного отзыва</h3>
          <p class="empty-state-text">Оценивайте используемые API на их страницах, чтобы помочь другим разработчикам.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    reviews.forEach((rev) => {
      const item = document.createElement("div");
      item.className = "review-item";
      item.dataset.id = rev.id;

      const dateStr = rev.createdAt?.toDate
        ? rev.createdAt.toDate().toLocaleDateString("ru-RU")
        : "";

      item.innerHTML = `
        <div class="review-item-header">
          <div>
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">
              <a href="api.html?id=${encodeURIComponent(rev.apiId)}" class="text-accent" style="text-decoration: underline;">
                API ID: ${escapeHtml(rev.apiId)}
              </a>
            </div>
            <div class="api-rating" style="font-size: 0.875rem;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${rev.rating} / 5</span>
            </div>
          </div>
          <div class="review-actions">
            <span class="review-date">${dateStr}</span>
            <button class="btn btn-secondary btn-sm btn-delete-my-review" style="color: var(--danger);" title="Удалить отзыв">
              Удалить
            </button>
          </div>
        </div>
        <p style="margin-top: 10px; color: var(--text-secondary); font-size: 0.9375rem;">${escapeHtml(rev.text)}</p>
      `;

      // Delete action
      const deleteBtn = item.querySelector(".btn-delete-my-review");
      deleteBtn.addEventListener("click", async () => {
        const confirmed = await showConfirmDialog({
          title: "Удаление отзыва",
          message: "Вы действительно хотите удалить этот отзыв?",
          confirmText: "Удалить",
          isDanger: true
        });

        if (confirmed) {
          try {
            await deleteReview(rev.id, rev.apiId);
            toast.success("Отзыв удален");
            loadReviewsTab(userId);
          } catch (err) {
            toast.error("Ошибка удаления: " + err.message);
          }
        }
      });

      container.appendChild(item);
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p class="text-danger">Ошибка загрузки отзывов: ${err.message}</p></div>`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
