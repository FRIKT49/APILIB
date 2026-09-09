/**
 * API Library - footer.js
 * Clean Glassmorphic Footer Component
 */

export function renderFooter() {
  const footerElement = document.querySelector("footer.footer");
  if (!footerElement) return;

  footerElement.innerHTML = `
    <div class="container footer-container">
      <div class="footer-grid">
        <!-- Brand Column -->
        <div class="footer-col-brand">
          <div class="footer-brand">
            <span class="brand-triangle" style="color: #3b82f6; font-size: 1.15rem; transform: translateY(-1px);">▲</span>
            <span class="footer-brand-title">API Library</span>
          </div>
          <p class="footer-tagline">
            The modern directory of production-ready APIs for developers. Fast search, comprehensive specs, and plug-and-play integrations.
          </p>
          <div class="status-indicator">
            <span class="status-dot"></span>
            <span class="status-text">All systems operational</span>
          </div>
        </div>

        <!-- Platform Column -->
        <div class="footer-col">
          <h4 class="footer-col-title">Platform</h4>
          <ul class="footer-col-links">
            <li><a href="catalog.html">API Catalog</a></li>
            <li><a href="catalog.html#categories">Categories</a></li>
            <li><a href="profile.html">Favorites</a></li>
            <li><a href="admin.html">Admin Dashboard</a></li>
          </ul>
        </div>

        <!-- Documentation Column -->
        <div class="footer-col">
          <h4 class="footer-col-title">Documentation</h4>
          <ul class="footer-col-links">
            <li><a href="https://developer.mozilla.org/en-US/docs/Web/API" target="_blank" rel="noopener">Web API Reference</a></li>
            <li><a href="https://modelcontextprotocol.io" target="_blank" rel="noopener">Model Context Protocol</a></li>
            <li><a href="https://firebase.google.com/docs" target="_blank" rel="noopener">Firebase Firestore</a></li>
            <li><a href="catalog.html">Quick Start</a></li>
          </ul>
        </div>

        <!-- Resources Column -->
        <div class="footer-col">
          <h4 class="footer-col-title">Resources</h4>
          <ul class="footer-col-links">
            <li><a href="https://github.com" target="_blank" rel="noopener">GitHub</a></li>
            <li><a href="catalog.html">All Categories</a></li>
            <li><a href="catalog.html">New Services</a></li>
            <li><a href="profile.html">Developer Profile</a></li>
          </ul>
        </div>

        <!-- About Column -->
        <div class="footer-col">
          <h4 class="footer-col-title">About</h4>
          <ul class="footer-col-links">
            <li><a href="index.html#about">About Platform</a></li>
            <li><a href="index.html#about">Architecture</a></li>
            <li><a href="catalog.html">Service Status</a></li>
            <li><a href="profile.html">Feedback</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-bottom-left">
          <span class="footer-copyright">&copy; 2026 API Library &middot; All rights reserved</span>
          <span class="footer-tech-tag">Developer Platform</span>
        </div>
        <div class="footer-bottom-links">
          <a href="index.html#about">Privacy</a>
          <a href="index.html#about">Terms</a>
          <a href="index.html#about">Support</a>
        </div>
      </div>
    </div>
  `;
}
