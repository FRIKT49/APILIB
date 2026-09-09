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

function updateThemeButtons(theme) {
  const buttons = document.querySelectorAll(".theme-toggle-btn");
  buttons.forEach((btn) => {
    btn.innerHTML = theme === "dark" ? "☀" : "☾";
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
