/**
 * API Library - seed.js
 * Comprehensive Seed Data with 18+ Real Developer APIs
 */

import { db, doc, setDoc, serverTimestamp } from "./firebase.js";
import { generateSearchKeywords } from "./api.js";

export const DEMO_APIS = [
  {
    id: "openai-api",
    name: "OpenAI API",
    category: "AI",
    shortDescription: "Передовые модели искусственного интеллекта (GPT-4o, DALL·E 3, Whisper, Embeddings).",
    description: "OpenAI API предоставляет доступ к мощным языковым моделям нового поколения. Разработчики могут использовать API для генерации текста, суммаризации, программного кода, синтеза и распознавания речи, генерации изображений и семантического поиска через векторные эмбеддинги.",
    tags: ["ai", "gpt4", "llm", "nlp", "vision", "speech"],
    logo: "🤖",
    websiteUrl: "https://openai.com",
    documentationUrl: "https://platform.openai.com/docs",
    githubUrl: "https://github.com/openai/openai-node",
    authentication: "Bearer Token",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: false,
    rateLimit: "3500 requests/min",
    rating: 4.9,
    ratingCount: 342,
    popularity: 1420,
    status: "active",
    features: [
      "Генерация связного текста и структурированного JSON",
      "Мультимодальный анализ изображений и аудио",
      "Function calling для интеграции с внешними инструментами",
      "Векторные эмбеддинги высокой размерности",
      "Потоковый вывод ответов (Server-Sent Events)"
    ]
  },
  {
    id: "anthropic-claude-api",
    name: "Anthropic Claude API",
    category: "AI",
    shortDescription: "Безопасные и точные большие языковые модели Claude 3.5 Sonnet с контекстным окном 200k токенов.",
    description: "Claude API от компании Anthropic предлагает передовые модели искусственного интеллекта для сложного кодинга, математического анализа и глубокой работы с текстами. Отличается высокой безопасностью (Constitutional AI), минимальным уровнем галлюцинаций и поддержкой огромного контекста.",
    tags: ["ai", "claude", "llm", "analysis", "coding"],
    logo: "🧠",
    websiteUrl: "https://www.anthropic.com",
    documentationUrl: "https://docs.anthropic.com",
    githubUrl: "https://github.com/anthropics/anthropic-sdk-typescript",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: false,
    rateLimit: "1000 requests/min",
    rating: 4.8,
    ratingCount: 198,
    popularity: 1100,
    status: "active",
    features: [
      "Контекстное окно до 200 000 токенов",
      "Высочайшая точность в генерации кода",
      "Анализ PDF-документов и изображений",
      "Поддержка инструментов (Tool use / Function calling)"
    ]
  },
  {
    id: "openweather-api",
    name: "OpenWeather API",
    category: "Weather",
    shortDescription: "Глобальные данные о текущей погоде, прогнозах на 16 дней и исторических климатических данных.",
    description: "OpenWeather — один из самых популярных погодных сервисов среди разработчиков. Собирает данные со спутников, метеостанций и радаров. Предоставляет информацию о температуре, осадках, ветре, давлении, индексе UV и качестве воздуха для любой точки планеты по координатам или названию города.",
    tags: ["weather", "forecast", "climate", "atmosphere", "geolocation"],
    logo: "🌦️",
    websiteUrl: "https://openweathermap.org",
    documentationUrl: "https://openweathermap.org/api",
    githubUrl: "https://github.com/openweathermap",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "60 requests/min (Free)",
    rating: 4.7,
    ratingCount: 260,
    popularity: 980,
    status: "active",
    features: [
      "Текущая погода для более чем 200 000 городов",
      "Почасовой и 16-дневный подробный прогноз",
      "Метеорологические карты и радарные слои",
      "Индекс качества воздуха (Air Pollution API)",
      "Бесплатный тариф с 1 000 000 вызовов в месяц"
    ]
  },
  {
    id: "weatherapi",
    name: "WeatherAPI",
    category: "Weather",
    shortDescription: "Быстрый API погоды, астрономии, качества воздуха и спортивных погодных событий.",
    description: "WeatherAPI обеспечивает разработчиков точными прогнозами погоды с низким временем отклика (CDN-кеширование). Включает геокодирование, астрономические данные (восход/закат луны и солнца), предупреждения о стихийных бедствиях и морские прогнозы.",
    tags: ["weather", "astronomy", "forecast", "sports", "marine"],
    logo: "☀️",
    websiteUrl: "https://www.weatherapi.com",
    documentationUrl: "https://www.weatherapi.com/docs/",
    githubUrl: "https://github.com/weatherapi",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "1000000 req/month (Free)",
    rating: 4.6,
    ratingCount: 145,
    popularity: 640,
    status: "active",
    features: [
      "Прогноз погоды до 14 дней вперед",
      "Астрономические расчеты фаз луны и солнца",
      "Данные по качеству воздуха и пыльце",
      "Встроенный автокомплит поиска городов"
    ]
  },
  {
    id: "google-maps-api",
    name: "Google Maps Platform",
    category: "Maps",
    shortDescription: "Индустриальный стандарт карт, геокодирования, маршрутизации и мест по всему миру.",
    description: "Google Maps Platform включает Maps SDK, Places API, Directions API, Distance Matrix и Geocoding. Позволяет отображать интерактивные векторные и спутниковые карты, рассчитывать оптимальные маршруты с учетом пробок в реальном времени и находить адреса и организации.",
    tags: ["maps", "places", "routing", "gis", "geolocation", "directions"],
    logo: "🗺️",
    websiteUrl: "https://mapsplatform.google.com",
    documentationUrl: "https://developers.google.com/maps/documentation",
    githubUrl: "https://github.com/googlemaps",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "Неограничен (с квотами)",
    rating: 4.8,
    ratingCount: 512,
    popularity: 2100,
    status: "active",
    features: [
      "Карты более 200 стран с высокой степенью детализации",
      "База из более 200 миллионов заведений и точек интереса",
      "Маршрутизация для автомобилей, пешеходов и велотранспорта",
      "Ежемесячный бесплатный кредит $200 на аккаунт"
    ]
  },
  {
    id: "mapbox-api",
    name: "Mapbox",
    category: "Maps",
    shortDescription: "Настраиваемые векторные карты, навигация и пространственный анализ для веб и мобильных приложений.",
    description: "Mapbox дает полный контроль над визуальным стилем карт через Mapbox Studio. Предоставляет высокопроизводительные векторные тайлы на базе WebGL, изохроны доступности, матрицу дистанций и SDK для iOS, Android, Unity и веба.",
    tags: ["maps", "webgl", "tiles", "navigation", "studio", "vector"],
    logo: "🧭",
    websiteUrl: "https://www.mapbox.com",
    documentationUrl: "https://docs.mapbox.com",
    githubUrl: "https://github.com/mapbox",
    authentication: "Bearer Token",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "50,000 загрузок карт/мес (Free)",
    rating: 4.7,
    ratingCount: 180,
    popularity: 870,
    status: "active",
    features: [
      "Кастомизация стилей карт в визуальном редакторе",
      "Рендеринг 3D-зданий и рельефа местности",
      "Маршрутизация с учетом дорожной обстановки",
      "Щедрый бесплатный тарифный план"
    ]
  },
  {
    id: "stripe-api",
    name: "Stripe API",
    category: "Finance",
    shortDescription: "Эталонная платежная инфраструктура для интернет-бизнеса, подписок и мультивалютных транзакций.",
    description: "Stripe API — золотой стандарт документации и архитектуры REST API. Позволяет принимать платежи по банковским картам, через Apple Pay, Google Pay, оформлять подписки, выставлять счета, управлять маркетплейсами и бороться с мошенничеством через Stripe Radar.",
    tags: ["finance", "payments", "billing", "subscriptions", "ecommerce"],
    logo: "💳",
    websiteUrl: "https://stripe.com",
    documentationUrl: "https://docs.stripe.com/api",
    githubUrl: "https://github.com/stripe/stripe-node",
    authentication: "Bearer Token",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "100 read / 100 write req/sec",
    rating: 4.9,
    ratingCount: 420,
    popularity: 1890,
    status: "active",
    features: [
      "Прием платежей в 135+ валютах мира",
      "Управление регулярными подписками и тарифами",
      "Песочница (Test mode) без использования реальных денег",
      "Подробные вебхуки (Webhooks) обо всех событиях",
      "Идемпотентность запросов"
    ]
  },
  {
    id: "coingecko-api",
    name: "CoinGecko API",
    category: "Finance",
    shortDescription: "Крупнейшая база криптовалютных цен, объемов торгов, рыночной капитализации и метаданных монет.",
    description: "CoinGecko API отслеживает более 14 000 криптовалют на 1000+ децентрализованных и централизованных биржах. Предоставляет исторические графики цен, объемы заблокированных средств (TVL), курсы обмена и ончейн-данные без необходимости регистрации на бесплатном тарифе.",
    tags: ["finance", "crypto", "bitcoin", "ethereum", "defi", "market"],
    logo: "🦎",
    websiteUrl: "https://www.coingecko.com",
    documentationUrl: "https://www.coingecko.com/en/api/documentation",
    githubUrl: "https://github.com/coingecko",
    authentication: "None",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "30 requests/min (Public Demo)",
    rating: 4.6,
    ratingCount: 165,
    popularity: 780,
    status: "active",
    features: [
      "Цены в реальном времени для 14 000+ токенов",
      "Исторические свечи (OHLC) и объемы торгов",
      "Данные по NFT-коллекциям и биржам",
      "Публичный доступ без обязательного API-ключа"
    ]
  },
  {
    id: "rawg-games-api",
    name: "RAWG Video Games Database",
    category: "Games",
    shortDescription: "База данных 500,000+ видеоигр для 50 платформ с скриншотами, трейлерами и оценками.",
    description: "RAWG — это крупнейшая база знаний об играх. API предоставляет метаданные о релизах, разработчиках, издателях, системных требованиях для ПК, жанрах, метках, ссылках на цифровые магазины (Steam, PlayStation Store, Xbox) и обложках в высоком разрешении.",
    tags: ["games", "gaming", "steam", "playstation", "database"],
    logo: "🎮",
    websiteUrl: "https://rawg.io",
    documentationUrl: "https://api.rawg.io/docs/",
    githubUrl: "https://github.com/rawg-io",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "20,000 requests/month (Free)",
    rating: 4.7,
    ratingCount: 130,
    popularity: 620,
    status: "active",
    features: [
      "Каталог из 500 000+ игр для всех консолей и ПК",
      "Рейтинги Metacritic и пользовательские обзоры",
      "Скриншоты и ссылки на геймплейные трейлеры",
      "Поиск по тегам, датам выхода и платформам"
    ]
  },
  {
    id: "pokeapi",
    name: "PokéAPI",
    category: "Games",
    shortDescription: "Бесплатный открытый RESTful API обо всех покемонах, их способностях, типах, характеристиках и эволюциях.",
    description: "PokéAPI — это классический учебный API с богатой документацией, ставший эталоном RESTful сервисов в сообществе разработчиков. Полностью бесплатный, без необходимости авторизации, с поддержкой GraphQL и огромным объемом взаимосвязанных данных.",
    tags: ["games", "pokemon", "anime", "rest", "graphql", "free"],
    logo: "⚡",
    websiteUrl: "https://pokeapi.co",
    documentationUrl: "https://pokeapi.co/docs/v2",
    githubUrl: "https://github.com/PokeAPI/pokeapi",
    authentication: "None",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "100 requests/min",
    rating: 4.9,
    ratingCount: 380,
    popularity: 1350,
    status: "active",
    features: [
      "100% бесплатный без API ключей и регистрации",
      "Все поколения покемонов, предметов и локаций",
      "Спрайты, официальные арты и аудио-крики",
      "Связи эволюционных цепочек и механики атак"
    ]
  },
  {
    id: "tmdb-api",
    name: "The Movie Database (TMDB)",
    category: "Movies",
    shortDescription: "Популярный API фильмов, сериалов, актеров, съемочных групп, постеров и трейлеров.",
    description: "TMDB API — один из самых мощных источников данных о киноиндустрии. Содержит информацию о миллионах фильмов и сериалов, переводы на десятки языков, официальные постеры, кадры, трейлеры YouTube, рекомендации похожих фильмов и списки провайдеров стриминга (Netflix, Apple TV, Disney+).",
    tags: ["movies", "cinema", "tv", "actors", "posters", "trailers"],
    logo: "🎬",
    websiteUrl: "https://www.themoviedb.org",
    documentationUrl: "https://developer.themoviedb.org/docs",
    githubUrl: "https://github.com/themoviedb",
    authentication: "Bearer Token",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "40 requests / 10 sec",
    rating: 4.8,
    ratingCount: 310,
    popularity: 1280,
    status: "active",
    features: [
      "Исчерпывающая фильтрация по жанрам, годам и странам",
      "Информация о касте, режиссерах и наградах",
      "Провайдеры онлайн-просмотра (Watch Providers)",
      "Высокоскоростной CDN для постеров и фонов"
    ]
  },
  {
    id: "spotify-web-api",
    name: "Spotify Web API",
    category: "Music",
    shortDescription: "Управление воспроизведением, плейлистами, каталогом треков, аудиоанализом и профилями пользователей.",
    description: "Spotify Web API открывает доступ к гигантскому музыкальному каталогу Spotify. Позволяет получать метаданные альбомов, артистов и треков, аудио-характеристики (энергичность, танцевальность, тональность), создавать персональные плейлисты и дистанционно управлять текущим воспроизведением на устройствах.",
    tags: ["music", "audio", "spotify", "streaming", "playlists"],
    logo: "🎵",
    websiteUrl: "https://spotify.com",
    documentationUrl: "https://developer.spotify.com/documentation/web-api",
    githubUrl: "https://github.com/spotify/web-api",
    authentication: "OAuth 2.0",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "Варьируется по квотам приложения",
    rating: 4.7,
    ratingCount: 295,
    popularity: 1540,
    status: "active",
    features: [
      "Каталог из 100+ миллионов треков и подкастов",
      "Углубленный аудио-анализ (tempo, key, acousticness)",
      "OAuth 2.0 авторизация с гибкими scope-разрешениями",
      "Управление воспроизведением через Spotify Connect"
    ]
  },
  {
    id: "deezer-api",
    name: "Deezer API",
    category: "Music",
    shortDescription: "Бесплатный доступ к музыкальному каталогу, чартам, 30-секундным превью треков и радиостанциям.",
    description: "Deezer API предоставляет удобный доступ к трекам, чартам по странам, исполнителям и жанрам. Главным преимуществом для фронтенд-разработчиков является наличие доступных без авторизации аудио-превью (mp3 previews) длительностью 30 секунд для создания аудиоплееров.",
    tags: ["music", "audio", "previews", "charts", "radio"],
    logo: "🎧",
    websiteUrl: "https://www.deezer.com",
    documentationUrl: "https://developers.deezer.com/api",
    githubUrl: "https://github.com/deezer",
    authentication: "OAuth 2.0",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "50 requests / 5 sec",
    rating: 4.5,
    ratingCount: 110,
    popularity: 510,
    status: "active",
    features: [
      "Прямые ссылки на 30-секундные MP3 превью песен",
      "Глобальные и национальные чарты популярности",
      "Поддержка JSONP и CORS для браузерных приложений",
      "Открытый доступ к базовому поиску без токенов"
    ]
  },
  {
    id: "newsapi",
    name: "NewsAPI",
    category: "News",
    shortDescription: "Поиск и получение актуальных новостных статей из 80,000 мировых источников и блогов.",
    description: "NewsAPI собирает новости в режиме реального времени от ведущих информационных агентств (BBC, CNN, Reuters, Bloomberg, TechCrunch). Позволяет фильтровать материалы по языку, стране, ключевым словам, дате публикации и категориям (бизнес, технологии, спорт, наука).",
    tags: ["news", "articles", "press", "media", "journalism"],
    logo: "📰",
    websiteUrl: "https://newsapi.org",
    documentationUrl: "https://newsapi.org/docs",
    githubUrl: "https://github.com/newsapi",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "100 requests/day (Developer Free)",
    rating: 4.5,
    ratingCount: 140,
    popularity: 720,
    status: "active",
    features: [
      "Агрегация из более 80 000 изданий по всему миру",
      "Полнотекстовый поиск по архиву за последние 30 дней",
      "Разбиение по тематическим рубрикам",
      "Простой REST API с ответами в формате JSON"
    ]
  },
  {
    id: "github-rest-api",
    name: "GitHub REST API",
    category: "Development",
    shortDescription: "Управление репозиториями, коммитами, пулл-реквестами, релизами, пользователями и GitHub Actions.",
    description: "GitHub REST API позволяет автоматизировать любые рабочие процессы разработки: чтение содержимого файлов, управление ветками, создание Issue и Pull Request, мониторинг запусков CI/CD GitHub Actions, управление правами доступа в организациях и просмотр профилей контрибьюторов.",
    tags: ["git", "github", "vcs", "code", "devops", "ci-cd"],
    logo: "🐙",
    websiteUrl: "https://github.com",
    documentationUrl: "https://docs.github.com/en/rest",
    githubUrl: "https://github.com/octokit/core.js",
    authentication: "Bearer Token",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "5000 requests/hour (Authenticated)",
    rating: 4.9,
    ratingCount: 460,
    popularity: 2300,
    status: "active",
    features: [
      "Полный контроль над кодовой базой и историей коммитов",
      "Управление задачами, майлстоунами и pull request",
      "Вебхуки на десятки событий жизненного цикла проекта",
      "Официальные библиотеки Octokit для JS, Go, Python"
    ]
  },
  {
    id: "unsplash-api",
    name: "Unsplash API",
    category: "Development",
    shortDescription: "Бесплатная библиотека из 5+ миллионов профессиональных фотографий в высоком разрешении.",
    description: "Unsplash API — самый популярный сервис интеграции качественного фотоконтента. Предоставляет доступ к фотографиям профессиональных авторов со свободным коммерческим и некоммерческим использованием. Включает динамическое масштабирование изображений на лету через CDN (Imgix параметры).",
    tags: ["photos", "images", "media", "wallpaper", "stock"],
    logo: "📷",
    websiteUrl: "https://unsplash.com",
    documentationUrl: "https://unsplash.com/documentation",
    githubUrl: "https://github.com/unsplash/unsplash-js",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "50 requests/hour (Demo)",
    rating: 4.8,
    ratingCount: 220,
    popularity: 910,
    status: "active",
    features: [
      "Более 5 000 000 бесплатных авторских фотографий",
      "URL-параметры для изменения ширины, высоты и формата (WebP, JPG)",
      "Поиск по цветовой гамме и ориентации кадра",
      "Тематические коллекции и списки трендов"
    ]
  },
  {
    id: "shopify-storefront-api",
    name: "Shopify Storefront API",
    category: "E-commerce",
    shortDescription: "Headless E-commerce API для создания нестандартных интернет-магазинов, корзин и оформления заказов.",
    description: "Shopify Storefront API на базе GraphQL позволяет разработчикам создавать полностью кастомные фронтенды интернет-магазинов на любом стеке (JAMstack, мобильные приложения, интерактивные киоски). Предоставляет доступ к товарам, коллекциям, ценам, корзине покупателя и безопасной оплате.",
    tags: ["ecommerce", "shopify", "shop", "graphql", "headless", "store"],
    logo: "🛍️",
    websiteUrl: "https://www.shopify.com",
    documentationUrl: "https://shopify.dev/docs/api/storefront",
    githubUrl: "https://github.com/Shopify/storefront-api-examples",
    authentication: "API Key",
    format: "GraphQL",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "Time-based Leaky Bucket",
    rating: 4.7,
    ratingCount: 175,
    popularity: 840,
    status: "active",
    features: [
      "Быстрый GraphQL-интерфейс с точной выборкой нужных полей",
      "Управление корзиной покупателя без авторизации",
      "Поддержка мультивалютности и международных рынков",
      "Готовые шаблоны и компоненты для кастомных витрин"
    ]
  },
  {
    id: "supabase-api",
    name: "Supabase REST & Realtime API",
    category: "Development",
    shortDescription: "Open-source альтернатива Firebase на базе PostgreSQL со мгновенным REST и Realtime WebSocket API.",
    description: "Supabase автоматически генерирует производительный REST API (через PostgREST) поверх базы данных PostgreSQL. Включает встроенную авторизацию (Auth), поддержку Row Level Security (RLS), векторных эмбеддингов (pgvector), объектного хранилища (Storage) и Edge Functions.",
    tags: ["database", "postgres", "backend", "baas", "realtime", "sql"],
    logo: "⚡",
    websiteUrl: "https://supabase.com",
    documentationUrl: "https://supabase.com/docs",
    githubUrl: "https://github.com/supabase/supabase-js",
    authentication: "API Key",
    format: "JSON",
    https: true,
    cors: true,
    freeTier: true,
    rateLimit: "В рамках бесплатных ресурсов инстанса",
    rating: 4.8,
    ratingCount: 330,
    popularity: 1470,
    status: "active",
    features: [
      "Автоматический RESTful и GraphQL API для таблиц PostgreSQL",
      "Трансляция изменений базы данных через WebSockets",
      "Строгое разграничение доступа через Row Level Security",
      "Поддержка векторов для ИИ-поиска (pgvector)"
    ]
  }
];

/**
 * Seed Firestore with demo APIs
 * @param {Function} onProgress Progress callback with (current, total, name)
 */
export async function seedDatabase(onProgress) {
  if (!db) throw new Error("Firestore не инициализирован. Проверьте js/firebase.js");

  let count = 0;
  for (const api of DEMO_APIS) {
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, docData, { merge: true });
    count++;
    if (onProgress) onProgress(count, DEMO_APIS.length, api.name);
  }

  return count;
}
