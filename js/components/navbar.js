/**
 * API Library - navbar.js
 * Navbar Component with Auth State, Theme Switcher & Mobile Menu
 */

import { onAuthChange, logoutUser, getCachedAuthUser, isSuperAdminEmail } from "../auth.js";
import { isConfigPlaceholder } from "../firebase.js";
import { toast } from "./toast.js";
import { initBgDotsCanvas } from "../bgDotsCanvas.js";
import { renderFooter } from "./footer.js";

export function renderNavbar(activePage = "") {
  initBgDotsCanvas();
  renderFooter();

  const navContainer = document.getElementById("navbarContainer");
  if (!navContainer) return;

  const currentTheme = localStorage.getItem("api_library_theme") || "dark";
  const themeIcon = currentTheme === "dark" ? "☀" : "☾";

  // Check if authenticated user session is already cached in localStorage
  const cachedUser = getCachedAuthUser();
  const isCachedAdmin = cachedUser && (cachedUser.role === "admin" || isSuperAdminEmail(cachedUser.email));

  navContainer.innerHTML = `
    <nav class="navbar" id="mainNavbar">
      ${
        isConfigPlaceholder
          ? `<div style="background: var(--warning-bg); border-bottom: 1px solid var(--warning); color: var(--text-primary); font-size: 0.8125rem; padding: 6px 16px; text-align: center;">
              ⚠️ <strong>Firebase не настроен</strong>: Укажите ваши ключи в <code>js/firebase.js</code> для полной работы базы данных.
            </div>`
          : ""
      }
      <div class="container navbar-inner">
        <!-- Brand Logo -->
        <a href="index.html" class="nav-brand">
          <span class="brand-triangle" style="color: #3b82f6; font-size: 1.15rem; transform: translateY(-1px);">▲</span>
          <span>API Library</span>
        </a>

        <!-- Desktop Navigation Links -->
        <ul class="nav-links">
          <li>
            <a href="catalog.html" class="nav-link ${activePage === "catalog" ? "active" : ""}">
              Catalog
            </a>
          </li>
          
          <!-- Dropdown: Categories -->
          <li class="nav-item-dropdown" id="navCategoriesDropdown">
            <a href="catalog.html#categories" class="nav-link nav-dropdown-trigger" id="categoriesTriggerBtn" aria-expanded="false" aria-haspopup="true">
              <span>Categories</span>
              <svg class="nav-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 1L5 5L9 1"/>
              </svg>
            </a>

            <!-- Megamenu Panel matching antigravity.google -->
            <div class="nav-megamenu" id="navMegamenuPanel" role="menu">
              <div class="nav-megamenu-inner">
                <!-- Left Overview Column -->
                <div class="nav-megamenu-left">
                  <div>
                    <div class="nav-megamenu-kicker">API CATALOG</div>
                    <h3 class="nav-megamenu-title">
                      The Complete API Ecosystem<br>by Domain
                    </h3>
                    <p class="nav-megamenu-desc">
                      Over 100 verified developer tools for web apps, microservices, and autonomous AI systems.
                    </p>
                  </div>
                  <a href="catalog.html" class="nav-megamenu-btn">
                    All Categories &rarr;
                  </a>
                </div>

                <!-- Vertical Divider -->
                <div class="nav-megamenu-divider"></div>

                <!-- Right Categories Columns -->
                <div class="nav-megamenu-right">
                  <div class="nav-megamenu-col">
                    <a href="catalog.html?category=AI" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">Artificial Intelligence</span>
                      <span class="megamenu-tag">AI & LLM</span>
                    </a>
                    <a href="catalog.html?category=Weather" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">Weather & Climate</span>
                      <span class="megamenu-tag">Forecasts & Radar</span>
                    </a>
                    <a href="catalog.html?category=Maps" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">Maps & Geodata</span>
                      <span class="megamenu-tag">Routes & Tiles</span>
                    </a>
                    <a href="catalog.html?category=Finance" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">Finance & Payments</span>
                      <span class="megamenu-tag">Crypto & Forex</span>
                    </a>
                  </div>

                  <div class="nav-megamenu-col">
                    <a href="catalog.html?category=Development" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">Development & DevOps</span>
                      <span class="megamenu-tag">CI/CD & Cloud</span>
                    </a>
                    <a href="catalog.html?category=Social" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">Social & Messaging</span>
                      <span class="megamenu-tag">Bots & Channels</span>
                    </a>
                    <a href="catalog.html?category=News" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">News & Media</span>
                      <span class="megamenu-tag">Feeds & Articles</span>
                    </a>
                    <a href="catalog.html?category=E-commerce" class="megamenu-link" role="menuitem">
                      <span class="megamenu-name">E-commerce & Stores</span>
                      <span class="megamenu-tag">Catalog & Tracking</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </li>

          <li>
            <a href="index.html#about" class="nav-link" id="navAboutLink">
              About
            </a>
          </li>
          <li>
            <a href="https://developer.mozilla.org/en-US/docs/Web/API" target="_blank" rel="noopener" class="nav-link">
              Documentation
            </a>
          </li>
          <li id="adminNavLink" style="display: ${isCachedAdmin ? "block" : "none"};">
            <a href="admin.html" class="nav-link ${activePage === "admin" ? "active" : ""}">
              Admin
            </a>
          </li>
        </ul>

        <!-- Minimalist Actions -->
        <div class="nav-actions">
          <!-- Auth Dynamic Area (instant initial hydration from localStorage) -->
          <div id="navAuthArea">
            ${getDesktopAuthMarkup(cachedUser, cachedUser)}
          </div>

          <!-- Mobile Hamburger -->
          <button class="mobile-menu-toggle" id="mobileMenuBtn" aria-label="Menu">
            ☰
          </button>
        </div>
      </div>
    </nav>

    <!-- Floating Corner Theme Toggle -->
    <button class="theme-toggle-btn floating-theme-toggle" id="floatingThemeToggle" aria-label="Toggle theme" title="Toggle theme">
      ${themeIcon}
    </button>

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
          <li><a href="catalog.html" class="nav-link">Catalog</a></li>
          <li><a href="catalog.html#categories" class="nav-link">Categories</a></li>
          <li><a href="index.html#about" class="nav-link" id="mobileAboutLink">About</a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/API" target="_blank" rel="noopener" class="nav-link">Documentation</a></li>
          <li id="mobileAdminLink" style="display: ${isCachedAdmin ? "block" : "none"};"><a href="admin.html" class="nav-link">Admin</a></li>
          <li id="mobileProfileLink" style="display: ${cachedUser ? "block" : "none"};"><a href="profile.html" class="nav-link">Profile</a></li>
        </ul>

        <div class="mobile-nav-actions" id="mobileAuthArea">
          ${getMobileAuthMarkup(cachedUser, cachedUser)}
        </div>
      </div>
    </div>
  `;

  // Attach auth button/dropdown event listeners immediately for frame 0 interaction
  bindAuthEvents();

  // Watch scroll to add/remove subtle glass backdrop when scrolled
  const mainNavbar = document.getElementById("mainNavbar");
  if (mainNavbar && navContainer) {
    navContainer.style.minHeight = `${mainNavbar.offsetHeight || 56}px`;
  }
  const onScroll = () => {
    if (window.scrollY > 15) {
      mainNavbar?.classList.add("scrolled");
    } else {
      mainNavbar?.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Categories Megamenu Dropdown Controller
  const categoriesDropdown = document.getElementById("navCategoriesDropdown");
  const triggerBtn = document.getElementById("categoriesTriggerBtn");
  let closeTimer = null;
  let isMouseOutsideWindow = false;

  const isPointerLeavingWindow = (e) => {
    if (!e) return false;
    // If relatedTarget is null, the cursor has left the DOM / browser window
    if (!e.relatedTarget) return true;
    // Check viewport boundary coordinates
    const y = e.clientY;
    const x = e.clientX;
    if (y <= 0 || x <= 0 || x >= window.innerWidth || y >= window.innerHeight) {
      return true;
    }
    return false;
  };

  const openDropdown = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    categoriesDropdown?.classList.add("is-open");
    mainNavbar?.classList.add("megamenu-open");
    triggerBtn?.setAttribute("aria-expanded", "true");
  };

  const closeDropdown = (force = false) => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (force) {
      categoriesDropdown?.classList.remove("is-open");
      mainNavbar?.classList.remove("megamenu-open");
      triggerBtn?.setAttribute("aria-expanded", "false");
      return;
    }
    closeTimer = setTimeout(() => {
      // If mouse is currently outside the website window (e.g. on URL bar, bookmarks, tabs), DO NOT CLOSE!
      if (isMouseOutsideWindow) {
        return;
      }
      categoriesDropdown?.classList.remove("is-open");
      mainNavbar?.classList.remove("megamenu-open");
      triggerBtn?.setAttribute("aria-expanded", "false");
    }, 150);
  };

  if (categoriesDropdown) {
    categoriesDropdown.addEventListener("mouseenter", () => {
      isMouseOutsideWindow = false;
      openDropdown();
    });

    categoriesDropdown.addEventListener("mouseleave", (e) => {
      // If cursor left the website bounds (e.g. moved up onto the URL bar, tabs, or outside window),
      // DO NOT close the dropdown!
      if (isPointerLeavingWindow(e)) {
        isMouseOutsideWindow = true;
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        return;
      }
      closeDropdown();
    });

    // Detect when cursor leaves the browser window (e.g. moving up into URL bar, tabs, bookmarks, or outside screen)
    document.addEventListener("mouseleave", (e) => {
      isMouseOutsideWindow = true;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    });

    // Detect when cursor re-enters the browser window
    document.addEventListener("mouseenter", () => {
      isMouseOutsideWindow = false;
    });

    window.addEventListener("mouseout", (e) => {
      if (isPointerLeavingWindow(e)) {
        isMouseOutsideWindow = true;
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
      }
    });

    // When cursor is inside the window, track element hovers
    document.addEventListener("mouseover", (e) => {
      isMouseOutsideWindow = false;
      if (!categoriesDropdown.classList.contains("is-open")) return;
      if (categoriesDropdown.contains(e.target)) {
        if (closeTimer) {
          clearTimeout(closeTimer);
          closeTimer = null;
        }
        return;
      }
      closeDropdown();
    });

    triggerBtn?.addEventListener("click", (e) => {
      if (window.innerWidth > 992) {
        e.preventDefault();
        const isOpen = categoriesDropdown.classList.contains("is-open");
        if (isOpen) {
          closeDropdown(true);
        } else {
          openDropdown();
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDropdown(true);
      }
    });

    document.addEventListener("click", (e) => {
      if (!categoriesDropdown.contains(e.target)) {
        closeDropdown(true);
      }
    });

    // When clicking any link inside the megamenu, close it immediately
    categoriesDropdown.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeDropdown(true);
      });
    });
  }

  // Search trigger button & global Ctrl+K
  const navSearch = document.getElementById("navSearchTrigger");
  if (navSearch) {
    navSearch.addEventListener("click", () => {
      const searchInput = document.getElementById("mainSearchInput");
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.location.href = "catalog.html?search=true";
      }
    });
  }

  if (!window._ctrlKInitialized) {
    window._ctrlKInitialized = true;
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("mainSearchInput");
        if (searchInput) {
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          window.location.href = "catalog.html?search=true";
        }
      }
    });
  }

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

  // Smooth scroll for About links if #about exists on page (without mutating hash)
  [document.getElementById("navAboutLink"), document.getElementById("mobileAboutLink")].forEach((link) => {
    if (!link) return;
    link.addEventListener("click", (e) => {
      const aboutSec = document.getElementById("about");
      if (aboutSec) {
        e.preventDefault();
        overlay?.classList.remove("open");
        aboutSec.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Subscribe to Auth State
  onAuthChange((user, profile) => {
    updateNavAuthState(user, profile);
  });

  // Keep cross-tab auth state in sync
  if (!window._storageAuthListenerBound) {
    window._storageAuthListenerBound = true;
    window.addEventListener("storage", (e) => {
      if (e.key === "api_library_auth_user") {
        const u = getCachedAuthUser();
        updateNavAuthState(u, u);
      }
    });
  }
}

function getDesktopAuthMarkup(user, profile) {
  if (user) {
    const displayName = profile?.displayName || user.displayName || user.email.split("@")[0];
    const initial = (displayName[0] || "U").toUpperCase();
    const photoURL = profile?.photoURL || user.photoURL;
    const isAdmin = (profile && profile.role === "admin") || (user && user.role === "admin") || isSuperAdminEmail(user?.email);

    return `
      <div class="user-menu-wrapper">
        <button class="user-avatar-btn" id="userMenuToggle" aria-haspopup="true" aria-expanded="false" title="${escapeHtml(displayName)}">
          ${
            photoURL
              ? `<img src="${escapeHtml(photoURL)}" alt="${escapeHtml(displayName)}" class="user-avatar-img" />`
              : `<div class="user-avatar">${initial}</div>`
          }
        </button>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <div style="font-weight: 600; font-size: 0.9375rem; color: var(--text-primary);">${escapeHtml(displayName)}</div>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(user.email)}</div>
            ${
              isAdmin
                ? `<span class="badge badge-primary" style="margin-top: 6px;">Administrator</span>`
                : ""
            }
          </div>
          <a href="profile.html" class="user-dropdown-item">👤 Profile</a>
          ${
            isAdmin
              ? `<a href="admin.html" class="user-dropdown-item">⚙️ Admin Dashboard</a>`
              : ""
          }
          <div class="divider" style="margin: 4px 0;"></div>
          <button class="user-dropdown-item danger" id="btnLogout">🚪 Log out</button>
        </div>
      </div>
    `;
  } else {
    return `
      <a href="login.html" class="btn-pill btn-pill-secondary" style="padding: 7px 16px; font-size: 0.85rem; margin-right: 6px;">Sign in</a>
      <a href="register.html" class="btn-pill btn-pill-primary" style="padding: 7px 18px; font-size: 0.85rem;">Get started</a>
    `;
  }
}

function getMobileAuthMarkup(user, profile) {
  if (user) {
    const displayName = profile?.displayName || user.displayName || user.email.split("@")[0];
    return `
      <div style="padding: 10px 0; border-top: 1px solid var(--border-color); margin-top: 10px;">
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">${escapeHtml(displayName)}</div>
        <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 12px;">${escapeHtml(user.email)}</div>
        <button class="btn btn-secondary btn-sm" id="mobileBtnLogout" style="width: 100%;">Log out</button>
      </div>
    `;
  } else {
    return `
      <a href="login.html" class="btn-pill btn-pill-secondary" style="width: 100%; justify-content: center; margin-bottom: 8px;">Sign in</a>
      <a href="register.html" class="btn-pill btn-pill-primary" style="width: 100%; justify-content: center;">Get started</a>
    `;
  }
}

function bindAuthEvents() {
  const toggleBtn = document.getElementById("userMenuToggle");
  const dropdown = document.getElementById("userDropdown");
  if (toggleBtn && dropdown) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle("show");
      toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    if (!window._authDropdownDocClickBound) {
      window._authDropdownDocClickBound = true;
      document.addEventListener("click", () => {
        const dd = document.getElementById("userDropdown");
        const btn = document.getElementById("userMenuToggle");
        if (dd && btn) {
          dd.classList.remove("show");
          btn.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      try {
        await logoutUser();
        toast.info("You have signed out");
        window.location.reload();
      } catch (err) {
        toast.error("Logout error: " + err.message);
      }
    };
  }

  const mobLogoutBtn = document.getElementById("mobileBtnLogout");
  if (mobLogoutBtn) {
    mobLogoutBtn.onclick = async () => {
      try {
        await logoutUser();
        window.location.reload();
      } catch (err) {
        toast.error("Logout error: " + err.message);
      }
    };
  }
}

function updateNavAuthState(user, profile) {
  window.__updateNavAuthState = updateNavAuthState;
  const desktopAuth = document.getElementById("navAuthArea");
  const mobileAuth = document.getElementById("mobileAuthArea");
  const adminNav = document.getElementById("adminNavLink");
  const mobileAdmin = document.getElementById("mobileAdminLink");
  const mobileProfile = document.getElementById("mobileProfileLink");

  const isAdmin = (profile && profile.role === "admin") || (user && user.role === "admin") || isSuperAdminEmail(user?.email);

  if (adminNav) adminNav.style.display = isAdmin ? "block" : "none";
  if (mobileAdmin) mobileAdmin.style.display = isAdmin ? "block" : "none";
  if (mobileProfile) mobileProfile.style.display = user ? "block" : "none";

  if (desktopAuth) {
    desktopAuth.innerHTML = getDesktopAuthMarkup(user, profile);
  }
  if (mobileAuth) {
    mobileAuth.innerHTML = getMobileAuthMarkup(user, profile);
  }

  bindAuthEvents();
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
