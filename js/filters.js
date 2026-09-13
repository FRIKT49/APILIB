/**
 * API Library - filters.js
 * Filter and Sorting State Coordinator
 */

export const CATEGORIES = [
  "All",
  "AI",
  "Weather",
  "Maps",
  "Finance",
  "Games",
  "Movies",
  "Music",
  "Social",
  "News",
  "Development",
  "E-commerce",
  "Other"
];

export const AUTH_TYPES = [
  "All",
  "None",
  "API Key",
  "OAuth 2.0",
  "Bearer Token",
  "Basic Auth",
  "Other"
];

export const PRICING_TYPES = [
  "All",
  "Free",
  "Freemium",
  "Paid"
];

export const FORMAT_TYPES = [
  "All",
  "JSON",
  "XML",
  "GraphQL",
  "Other"
];

export const SOURCE_TYPES = [
  "All",
  "apis.guru",
  "verified"
];

export class FilterManager {
  constructor(onChangeCallback) {
    this.onChange = onChangeCallback;
    this.state = {
      category: "All",
      source: "All",
      authentication: "All",
      pricing: "All",
      format: "All",
      sortBy: "rating",
      sortOrder: "desc",
      searchQuery: ""
    };
    this.readFromUrl();
  }

  readFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("category") && CATEGORIES.includes(params.get("category"))) {
      this.state.category = params.get("category");
    }
    if (params.has("auth") && AUTH_TYPES.includes(params.get("auth"))) {
      this.state.authentication = params.get("auth");
    }
    if (params.has("pricing") && PRICING_TYPES.includes(params.get("pricing"))) {
      this.state.pricing = params.get("pricing");
    }
    if (params.has("format") && FORMAT_TYPES.includes(params.get("format"))) {
      this.state.format = params.get("format");
    }
    if (params.has("source") && SOURCE_TYPES.includes(params.get("source"))) {
      this.state.source = params.get("source");
    }
    if (params.has("sort")) {
      this.state.sortBy = params.get("sort");
    }
    if (params.has("q")) {
      this.state.searchQuery = params.get("q");
    }
  }

  syncToUrl() {
    const params = new URLSearchParams();
    if (this.state.category !== "All") params.set("category", this.state.category);
    if (this.state.source !== "All") params.set("source", this.state.source);
    if (this.state.authentication !== "All") params.set("auth", this.state.authentication);
    if (this.state.pricing !== "All") params.set("pricing", this.state.pricing);
    if (this.state.format !== "All") params.set("format", this.state.format);
    if (this.state.sortBy !== "rating") params.set("sort", this.state.sortBy);
    if (this.state.searchQuery) params.set("q", this.state.searchQuery);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }

  setCategory(category) {
    this.state.category = category;
    this.syncToUrl();
    if (this.onChange) this.onChange(this.state);
  }

  setFilter(key, value) {
    this.state[key] = value;
    this.syncToUrl();
    if (this.onChange) this.onChange(this.state);
  }

  setSearchQuery(q) {
    this.state.searchQuery = q;
    this.syncToUrl();
    if (this.onChange) this.onChange(this.state);
  }

  reset() {
    this.state = {
      category: "All",
      source: "All",
      authentication: "All",
      pricing: "All",
      format: "All",
      sortBy: "rating",
      sortOrder: "desc",
      searchQuery: ""
    };
    this.syncToUrl();
    if (this.onChange) this.onChange(this.state);
  }

  getState() {
    return { ...this.state };
  }
}
