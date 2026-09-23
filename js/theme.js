/**
 * API Library - theme.js
 * Dark/Light Theme Switcher with LocalStorage Persistence
 */

const THEME_KEY = "api_library_theme";

export function getPreferredTheme() {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const qTheme = params.get("theme");
    if (qTheme === "dark" || qTheme === "light") {
      return qTheme;
    }
  }
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }
  return "dark";
}

export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButtons(theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

const SUN_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
const MOON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

function updateThemeButtons(theme) {
  const buttons = document.querySelectorAll(".theme-toggle-btn");
  buttons.forEach((btn) => {
    btn.innerHTML = theme === "dark" ? SUN_SVG : MOON_SVG;
    btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    btn.setAttribute("title", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  });
}

export function initTheme() {
  const initialTheme = getPreferredTheme();
  setTheme(initialTheme);

  // Bind click handlers to theme toggle buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-toggle-btn");
    if (btn) {
      toggleTheme();
    }
  });

  // Listen for OS theme changes if user has not set an explicit override
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(e.matches ? "dark" : "light");
      }
    });
  }
}
