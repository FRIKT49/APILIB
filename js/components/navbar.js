/**
 * API Library - navbar.js
 * Navbar Component with Auth State, Theme Switcher & Mobile Menu
 */

import { onAuthChange, logoutUser } from "../auth.js";
import { isConfigPlaceholder } from "../firebase.js";
import { toast } from "./toast.js";

export function renderNavbar(activePage = "") {
  const navContainer = document.getElementById("navbarContainer");
  if (!navContainer) return;

  const currentTheme = localStorage.getItem("api_library_theme") || "dark";
  const themeIcon = currentTheme === "dark" ? "☀" : "☾";

  navContainer.innerHTML = `
    <nav class="navbar">
      ${
        isConfigPlaceholder
          ? `<div style="background: var(--warning-bg); border-bottom: 1px solid var(--warning); color: var(--text-primary); font-size: 0.8125rem; padding: 6px 16px; text-align: center;">
              ⚠️ <strong>Firebase не настроен</strong>: Укажите ваши ключи в <code>js/firebase.js</code> для полной работы базы данных.
            </div>`
          : ""
      }
      <div class="container navbar-inner">
        <!-- Logo -->
        <a href="index.html" class="nav-brand">
          <span class="brand-triangle" style="color: #3b82f6; font-size: 1.15rem; transform: translateY(-1px);">▲</span>
          <span>API Library</span>
        </a>

        <!-- Desktop Links -->
        <ul class="nav-links">
          <li>
            <a href="index.html" class="nav-link ${activePage === "catalog" ? "active" : ""}">
              Каталог
            </a>
          </li>
          <li>
            <a href="index.html#categories" class="nav-link ${activePage === "categories" ? "active" : ""}">
              Категории
            </a>
          </li>
          <li id="adminNavLink" style="display: none;">
            <a href="admin.html" class="nav-link ${activePage === "admin" ? "active" : ""}">
              Админ-панель
            </a>
          </li>
        </ul>

        <!-- Actions -->
        <div class="nav-actions">
          <!-- Theme Toggle -->
          <button class="theme-toggle-btn" aria-label="Сменить тему" title="Сменить тему">
            ${themeIcon}
          </button>

          <!-- Auth Dynamic Area -->
          <div id="navAuthArea">
            <a href="login.html" class="btn-pill btn-pill-primary" style="padding: 7px 18px; font-size: 0.875rem;">Войти</a>
          </div>

          <!-- Mobile Hamburger -->
          <button class="mobile-menu-toggle" id="mobileMenuBtn" aria-label="Меню">
            ☰
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Drawer Overlay -->
    <div class="mobile-nav-overlay" id="mobileNavOverlay">
      <div class="mobile-nav-drawer">
        <div class="mobile-nav-header">
          <div class="nav-brand">
            <span class="brand-triangle" style="color: #3b82f6; font-size: 1.15rem;">▲</span>
            <span>API Library</span>
          </div>
          <button class="modal-close" id="closeMobileNav">&times;</button>
        </div>

        <ul class="mobile-nav-links">
          <li><a href="index.html" class="nav-link">Каталог</a></li>
          <li><a href="index.html#categories" class="nav-link">Категории</a></li>
          <li id="mobileAdminLink" style="display: none;"><a href="admin.html" class="nav-link">Админ-панель</a></li>
          <li id="mobileProfileLink" style="display: none;"><a href="profile.html" class="nav-link">Личный кабинет</a></li>
        </ul>

        <div class="mobile-nav-actions" id="mobileAuthArea">
          <a href="login.html" class="btn btn-primary">Войти</a>
        </div>
      </div>
    </div>
  `;

  // Attach mobile drawer events
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const overlay = document.getElementById("mobileNavOverlay");
  const closeBtn = document.getElementById("closeMobileNav");

  if (mobileBtn && overlay) {
    mobileBtn.addEventListener("click", () => overlay.classList.add("open"));
    closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  }

  // Subscribe to Auth State
  onAuthChange((user, profile) => {
    updateNavAuthState(user, profile);
  });
}

function updateNavAuthState(user, profile) {
  const desktopAuth = document.getElementById("navAuthArea");
  const mobileAuth = document.getElementById("mobileAuthArea");
  const adminNav = document.getElementById("adminNavLink");
  const mobileAdmin = document.getElementById("mobileAdminLink");
  const mobileProfile = document.getElementById("mobileProfileLink");

  const isAdmin = profile && profile.role === "admin";

  if (adminNav) adminNav.style.display = isAdmin ? "block" : "none";
  if (mobileAdmin) mobileAdmin.style.display = isAdmin ? "block" : "none";
  if (mobileProfile) mobileProfile.style.display = user ? "block" : "none";

  if (!desktopAuth) return;

  if (user) {
    const displayName = profile?.displayName || user.displayName || user.email.split("@")[0];
    const initial = (displayName[0] || "U").toUpperCase();

    desktopAuth.innerHTML = `
      <div class="user-menu-wrapper">
        <button class="user-avatar-btn" id="userMenuToggle" aria-haspopup="true">
          <div class="user-avatar">${initial}</div>
          <span class="user-name-label">${escapeHtml(displayName)}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">▼</span>
        </button>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <div style="font-weight: 600; font-size: 0.9375rem; color: var(--text-primary);">${escapeHtml(displayName)}</div>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(user.email)}</div>
            ${
              isAdmin
                ? `<span class="badge badge-primary" style="margin-top: 6px;">Администратор</span>`
                : ""
            }
          </div>
          <a href="profile.html" class="user-dropdown-item">👤 Личный кабинет</a>
          ${
            isAdmin
              ? `<a href="admin.html" class="user-dropdown-item">⚙️ Админ-панель</a>`
              : ""
          }
          <div class="divider" style="margin: 4px 0;"></div>
          <button class="user-dropdown-item danger" id="btnLogout">🚪 Выйти</button>
        </div>
      </div>
    `;

    // Dropdown toggle
    const toggleBtn = document.getElementById("userMenuToggle");
    const dropdown = document.getElementById("userDropdown");
    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("show");
      });
    }

    // Logout
    const logoutBtn = document.getElementById("btnLogout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await logoutUser();
          toast.info("Вы вышли из системы");
          window.location.reload();
        } catch (err) {
          toast.error("Ошибка при выходе: " + err.message);
        }
      });
    }

    // Mobile auth area
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <div style="padding: 10px 0; border-top: 1px solid var(--border-color); margin-top: 10px;">
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${escapeHtml(displayName)}</div>
          <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 12px;">${escapeHtml(user.email)}</div>
          <button class="btn btn-secondary btn-sm" id="mobileBtnLogout" style="width: 100%;">Выйти</button>
        </div>
      `;
      const mobLogoutBtn = document.getElementById("mobileBtnLogout");
      if (mobLogoutBtn) {
        mobLogoutBtn.addEventListener("click", async () => {
          await logoutUser();
          window.location.reload();
        });
      }
    }
  } else {
    // Unauthenticated
    desktopAuth.innerHTML = `
      <a href="login.html" class="btn-pill btn-pill-secondary" style="padding: 7px 16px; font-size: 0.85rem; margin-right: 6px;">Войти</a>
      <a href="register.html" class="btn-pill btn-pill-primary" style="padding: 7px 18px; font-size: 0.85rem;">Регистрация</a>
    `;
    if (mobileAuth) {
      mobileAuth.innerHTML = `
        <a href="login.html" class="btn-pill btn-pill-secondary" style="width: 100%; justify-content: center; margin-bottom: 8px;">Войти</a>
        <a href="register.html" class="btn-pill btn-pill-primary" style="width: 100%; justify-content: center;">Регистрация</a>
      `;
    }
  }
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
