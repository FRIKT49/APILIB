/**
 * API Library - admin.js
 * Admin Panel Operations: CRUD on APIs, User Management, Review Moderation & Stats
 */

import {
  db,
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "./firebase.js";
import {
  createApi,
  updateApi,
  deleteApi,
  getAdminStats,
  getApiById
} from "./api.js";
import { deleteReview } from "./reviews.js";
import { seedDatabase } from "./seed.js";
import { openModal, closeModal, showConfirmDialog } from "./components/modal.js";
import { toast } from "./components/toast.js";

/**
 * Initialize Admin Dashboard
 */
export async function initAdminDashboard() {
  await loadStats();
  await loadApisTable();
  await loadUsersTable();
  await loadReviewsTable();
  setupEventListeners();
}

/**
 * Load and display metrics
 */
export async function loadStats() {
  const stats = await getAdminStats();
  const statApis = document.getElementById("statTotalApis");
  const statUsers = document.getElementById("statTotalUsers");
  const statReviews = document.getElementById("statTotalReviews");
  const statCats = document.getElementById("statTotalCategories");

  if (statApis) statApis.textContent = stats.apisCount;
  if (statUsers) statUsers.textContent = stats.usersCount;
  if (statReviews) statReviews.textContent = stats.reviewsCount;
  if (statCats) statCats.textContent = stats.categoriesCount;

  // Render top APIs list if container exists
  const topList = document.getElementById("statTopApis");
  if (topList && stats.topApis) {
    topList.innerHTML = stats.topApis
      .map(
        (api) => `
        <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-subtle);">
          <span>${escapeHtml(api.name)}</span>
          <span class="text-muted">👁 ${api.popularity || 0}</span>
        </li>
      `
      )
      .join("");
  }
}

/**
 * Load APIs management table
 */
export async function loadApisTable() {
  const tbody = document.getElementById("adminApisTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px;">Загрузка списка API...</td></tr>`;

  try {
    const q = query(collection(db, "apis"), orderBy("name", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px;">В каталоге пока нет API. Нажмите "Загрузить демо-данные" или добавьте вручную.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    snap.forEach((d) => {
      const api = { id: d.id, ...d.data() };
      const tr = document.createElement("tr");

      const ratingVal = api.rating ? Number(api.rating).toFixed(1) : "—";
      const statusBadge = api.status === "active"
        ? `<span class="badge badge-success">Active</span>`
        : `<span class="badge badge-warning">Deprecated</span>`;

      tr.innerHTML = `
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${api.logo && !api.logo.startsWith("http") ? api.logo : "⚡"}</span>
            <strong>${escapeHtml(api.name)}</strong>
          </div>
        </td>
        <td><span class="badge badge-primary">${escapeHtml(api.category || "General")}</span></td>
        <td>${escapeHtml(api.authentication || "None")}</td>
        <td>${escapeHtml(api.format || "JSON")}</td>
        <td>★ ${ratingVal} (${api.ratingCount || 0})</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-edit-api" data-id="${api.id}" title="Редактировать">✏️</button>
            <button class="btn btn-secondary btn-sm btn-delete-api" data-id="${api.id}" data-name="${escapeHtml(api.name)}" style="color: var(--danger);" title="Удалить">🗑️</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach row events
    tbody.querySelectorAll(".btn-edit-api").forEach((btn) => {
      btn.addEventListener("click", () => handleEditApi(btn.dataset.id));
    });

    tbody.querySelectorAll(".btn-delete-api").forEach((btn) => {
      btn.addEventListener("click", () => handleDeleteApi(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger); text-align: center;">Ошибка: ${err.message}</td></tr>`;
  }
}

/**
 * Load Users table
 */
export async function loadUsersTable() {
  const tbody = document.getElementById("adminUsersTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">Загрузка пользователей...</td></tr>`;

  try {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">Пользователи не найдены.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    snap.forEach((d) => {
      const u = { id: d.id, ...d.data() };
      const tr = document.createElement("tr");

      const dateStr = u.createdAt?.toDate
        ? u.createdAt.toDate().toLocaleDateString("ru-RU")
        : "—";

      const roleBadge = u.role === "admin"
        ? `<span class="badge badge-primary">Admin</span>`
        : `<span class="badge badge-neutral">User</span>`;

      tr.innerHTML = `
        <td><strong>${escapeHtml(u.displayName || "Без имени")}</strong></td>
        <td>${escapeHtml(u.email || "")}</td>
        <td>${roleBadge}</td>
        <td>${dateStr}</td>
        <td>
          <button class="btn btn-secondary btn-sm btn-toggle-role" data-uid="${u.id}" data-role="${u.role || "user"}" data-name="${escapeHtml(u.displayName || u.email)}">
            ${u.role === "admin" ? "Сделать User" : "Сделать Admin"}
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-toggle-role").forEach((btn) => {
      btn.addEventListener("click", () => handleToggleRole(btn.dataset.uid, btn.dataset.role, btn.dataset.name));
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: var(--danger); text-align: center;">Ошибка: ${err.message}</td></tr>`;
  }
}

/**
 * Load Reviews moderation table
 */
export async function loadReviewsTable() {
  const tbody = document.getElementById("adminReviewsTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;">Загрузка отзывов...</td></tr>`;

  try {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;">Отзывов пока нет.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    snap.forEach((d) => {
      const rev = { id: d.id, ...d.data() };
      const tr = document.createElement("tr");

      const dateStr = rev.createdAt?.toDate
        ? rev.createdAt.toDate().toLocaleDateString("ru-RU")
        : "—";

      tr.innerHTML = `
        <td><a href="api.html?id=${encodeURIComponent(rev.apiId)}" class="text-accent" target="_blank">${escapeHtml(rev.apiId)}</a></td>
        <td>${escapeHtml(rev.userName || rev.userEmail || "Аноним")}</td>
        <td>★ ${rev.rating}/5</td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(rev.text)}">
          ${escapeHtml(rev.text)}
        </td>
        <td>${dateStr}</td>
        <td>
          <button class="btn btn-secondary btn-sm btn-delete-review" data-id="${rev.id}" data-api-id="${rev.apiId}" style="color: var(--danger);" title="Удалить отзыв">
            🗑️
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll(".btn-delete-review").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const confirmed = await showConfirmDialog({
          title: "Модерация отзыва",
          message: "Удалить этот отзыв из базы данных?",
          confirmText: "Удалить",
          isDanger: true
        });

        if (confirmed) {
          try {
            await deleteReview(btn.dataset.id, btn.dataset.apiId);
            toast.success("Отзыв удален");
            await loadReviewsTable();
            await loadStats();
          } catch (err) {
            toast.error("Ошибка при удалении: " + err.message);
          }
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: var(--danger); text-align: center;">Ошибка: ${err.message}</td></tr>`;
  }
}

/**
 * Setup modal and action buttons
 */
function setupEventListeners() {
  // Add API button
  const btnAddApi = document.getElementById("btnAddApi");
  if (btnAddApi) {
    btnAddApi.addEventListener("click", () => {
      document.getElementById("apiForm").reset();
      document.getElementById("apiFormId").value = "";
      document.getElementById("apiModalTitle").textContent = "Добавить новый API";
      openModal("apiModal");
    });
  }

  // API Form Submit (Create or Update)
  const apiForm = document.getElementById("apiForm");
  if (apiForm) {
    apiForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("apiFormId").value;
      const featuresRaw = document.getElementById("apiFeatures").value;
      const features = featuresRaw
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const tagsRaw = document.getElementById("apiTags").value;
      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);

      const payload = {
        name: document.getElementById("apiName").value.trim(),
        shortDescription: document.getElementById("apiShortDesc").value.trim(),
        description: document.getElementById("apiFullDesc").value.trim(),
        category: document.getElementById("apiCategory").value,
        tags,
        logo: document.getElementById("apiLogo").value.trim() || "⚡",
        websiteUrl: document.getElementById("apiWebsite").value.trim(),
        documentationUrl: document.getElementById("apiDocs").value.trim(),
        githubUrl: document.getElementById("apiGithub").value.trim(),
        authentication: document.getElementById("apiAuth").value,
        format: document.getElementById("apiFormat").value,
        https: document.getElementById("apiHttps").checked,
        cors: document.getElementById("apiCors").checked,
        freeTier: document.getElementById("apiFreeTier").checked,
        rateLimit: document.getElementById("apiRateLimit").value.trim() || "60 req/min",
        status: document.getElementById("apiStatus").value,
        features
      };

      try {
        if (id) {
          await updateApi(id, payload);
          toast.success("API успешно обновлен");
        } else {
          await createApi(payload);
          toast.success("API успешно создан");
        }
        closeModal("apiModal");
        await loadApisTable();
        await loadStats();
      } catch (err) {
        toast.error("Ошибка сохранения: " + err.message);
      }
    });
  }

  // Seed Demo Data button
  const btnSeed = document.getElementById("btnSeedDatabase");
  if (btnSeed) {
    btnSeed.addEventListener("click", async () => {
      const confirmed = await showConfirmDialog({
        title: "Импорт демонстрационных данных",
        message: "Загрузить 18 готовых реальных API в базу данных Firestore?",
        confirmText: "Загрузить",
        cancelText: "Отмена"
      });

      if (!confirmed) return;

      btnSeed.disabled = true;
      btnSeed.textContent = "Загрузка...";

      try {
        await seedDatabase((current, total, name) => {
          toast.info(`Импорт [${current}/${total}]: ${name}`);
        });

        toast.success("Демо-данные успешно импортированы!");
        await loadStats();
        await loadApisTable();
      } catch (err) {
        toast.error("Ошибка импорта: " + err.message);
      } finally {
        btnSeed.disabled = false;
        btnSeed.textContent = "⚡ Загрузить демо-данные (Seed)";
      }
    });
  }
}

/**
 * Pre-populate and open modal to edit API
 */
async function handleEditApi(apiId) {
  try {
    const api = await getApiById(apiId, false);
    if (!api) {
      toast.error("API не найден");
      return;
    }

    document.getElementById("apiFormId").value = api.id;
    document.getElementById("apiName").value = api.name || "";
    document.getElementById("apiShortDesc").value = api.shortDescription || "";
    document.getElementById("apiFullDesc").value = api.description || "";
    document.getElementById("apiCategory").value = api.category || "Development";
    document.getElementById("apiTags").value = (api.tags || []).join(", ");
    document.getElementById("apiLogo").value = api.logo || "";
    document.getElementById("apiWebsite").value = api.websiteUrl || "";
    document.getElementById("apiDocs").value = api.documentationUrl || "";
    document.getElementById("apiGithub").value = api.githubUrl || "";
    document.getElementById("apiAuth").value = api.authentication || "None";
    document.getElementById("apiFormat").value = api.format || "JSON";
    document.getElementById("apiHttps").checked = Boolean(api.https);
    document.getElementById("apiCors").checked = Boolean(api.cors);
    document.getElementById("apiFreeTier").checked = Boolean(api.freeTier);
    document.getElementById("apiRateLimit").value = api.rateLimit || "";
    document.getElementById("apiStatus").value = api.status || "active";
    document.getElementById("apiFeatures").value = (api.features || []).join("\n");

    document.getElementById("apiModalTitle").textContent = "Редактировать API";
    openModal("apiModal");
  } catch (err) {
    toast.error("Ошибка загрузки данных API: " + err.message);
  }
}

/**
 * Handle API deletion with confirmation
 */
async function handleDeleteApi(apiId, apiName) {
  const confirmed = await showConfirmDialog({
    title: "Удаление API",
    message: `Вы действительно хотите удалить "${apiName}" из каталога? Это действие необратимо.`,
    confirmText: "Удалить",
    isDanger: true
  });

  if (confirmed) {
    try {
      await deleteApi(apiId);
      toast.success(`API "${apiName}" удален`);
      await loadApisTable();
      await loadStats();
    } catch (err) {
      toast.error("Ошибка удаления: " + err.message);
    }
  }
}

/**
 * Handle role toggle (admin <-> user)
 */
async function handleToggleRole(uid, currentRole, name) {
  const nextRole = currentRole === "admin" ? "user" : "admin";

  const confirmed = await showConfirmDialog({
    title: "Изменение роли пользователя",
    message: `Изменить роль пользователя "${name}" на "${nextRole}"?`,
    confirmText: "Изменить"
  });

  if (confirmed) {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { role: nextRole });
      toast.success(`Роль пользователя изменена на ${nextRole}`);
      await loadUsersTable();
    } catch (err) {
      toast.error("Ошибка смены роли: " + err.message);
    }
  }
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
