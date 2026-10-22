// Server-side page metadata: link-preview crawlers (WhatsApp, Slack, Facebook,
// X) do not run JavaScript, so titles and Open Graph tags for public pages are
// written into index.html before it is sent.

const SITE_NAME = "Travelo";
const DEFAULT_TITLE = "Travelo | Plan group trips together";
const DEFAULT_DESCRIPTION =
  "Plan group trips together with Travelo: build a shared itinerary, split expenses, pack with checklists and share photos with everyone on the trip.";

// Pages anyone can open; everything else needs an account and is not indexed
export const PUBLIC_PAGES = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  "/explore": {
    title: `Explore trips | ${SITE_NAME}`,
    description:
      "Browse upcoming public group trips on Travelo and ask to join travellers heading where you want to go.",
  },
  "/register": {
    title: `Create an account | ${SITE_NAME}`,
    description:
      "Sign up for Travelo for free and start planning your next group trip.",
  },
  "/login": {
    title: `Sign in | ${SITE_NAME}`,
    description: "Sign in to Travelo to plan and manage your trips.",
  },
};

// Pages listed in the sitemap, with how often their content changes
const SITEMAP_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/explore", changefreq: "daily", priority: "0.8" },
  { path: "/register", changefreq: "monthly", priority: "0.5" },
];

const PRIVATE_PREFIXES = [
  "/trips",
  "/profile",
  "/notifications",
  "/invitations",
  "/join-requests",
  "/destinations",
  "/admin",
];

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Public origin of the site, without a trailing slash. Uses SITE_URL, then the
 * first CLIENT_URL entry, then the request's own host.
 */
export const getSiteUrl = (req) => {
  const configured =
    process.env.SITE_URL || (process.env.CLIENT_URL || "").split(",")[0];
  const url = configured.trim() || `${req.protocol}://${req.get("host")}`;
  return url.replace(/\/+$/, "");
};

const normalizePath = (pathname) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

/**
 * Fill in the page title, description and Open Graph tags of the built
 * index.html for the requested path.
 *
 * @param {string} template - contents of the built index.html
 * @param {string} pathname - request path
 * @param {string} siteUrl - public origin from getSiteUrl
 * @param {{title: string, description: string, noindex?: boolean}} [pageOverride]
 *   metadata for a page looked up per request, such as a shared trip
 */
export const renderIndexHtml = (template, pathname, siteUrl, pageOverride) => {
  const path = normalizePath(pathname);
  const page = pageOverride ?? PUBLIC_PAGES[path];
  const title = escapeHtml(page?.title ?? DEFAULT_TITLE);
  const description = escapeHtml(page?.description ?? DEFAULT_DESCRIPTION);
  const url = escapeHtml(`${siteUrl}${page ? path : "/"}`);

  let extraTags;
  if (!page) {
    // Private pages and unknown paths stay out of search results
    extraTags = `<meta name="robots" content="noindex" />`;
  } else if (page.noindex) {
    // Unlisted pages (shared trips) still get link previews
    extraTags = `<meta property="og:url" content="${url}" />\n    <meta name="robots" content="noindex" />`;
  } else {
    extraTags = `<link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />`;
  }

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
      `$1${title}$2`,
    )
    .replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta\s+property="og:image"\s+content=")\/([^"]*")/,
      `$1${escapeHtml(siteUrl)}/$2`,
    )
    .replace("</head>", `    ${extraTags}\n  </head>`);
};

export const buildSitemap = (siteUrl) => {
  const urls = SITEMAP_PAGES.map(
    ({ path, changefreq, priority }) =>
      `  <url>\n    <loc>${escapeHtml(siteUrl + path)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

export const buildRobotsTxt = (siteUrl) =>
  [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    ...PRIVATE_PREFIXES.map((prefix) => `Disallow: ${prefix}`),
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

const MAX_DESCRIPTION = 200;

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

/**
 * "10–15 Jan 2030", "28 Jan – 3 Feb 2030" or "30 Dec 2030 – 2 Jan 2031".
 * Trip dates are stored as UTC midnight of the chosen day.
 */
export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fmt = (date, options) =>
    date.toLocaleDateString("en-GB", { timeZone: "UTC", ...options });
  const full = { day: "numeric", month: "short", year: "numeric" };

  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return `${fmt(start, full)} – ${fmt(end, full)}`;
  }
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    return `${fmt(start, { day: "numeric", month: "short" })} – ${fmt(end, full)}`;
  }
  if (start.getUTCDate() !== end.getUTCDate()) {
    return `${start.getUTCDate()}–${fmt(end, full)}`;
  }
  return fmt(start, full);
};

/**
 * Link-preview metadata for a shared trip page. Missing or turned-off links
 * get a generic title so the preview doesn't leak the old trip name.
 *
 * @param {{trip: Object, activities: Array}|null} shared - from getSharedTrip
 */
export const sharedTripPage = (shared) => {
  if (!shared) {
    return {
      title: `Shared trip | ${SITE_NAME}`,
      description: "This shared trip link is no longer available.",
      noindex: true,
    };
  }

  const { trip, activities } = shared;
  const places = [
    ...new Set(activities.map((activity) => activity.location?.name).filter(Boolean)),
  ];
  const stops = activities.length;
  const summary = [
    formatDateRange(trip.startDate, trip.endDate),
    stops > 0 &&
      `${stops} ${stops === 1 ? "stop" : "stops"}${
        places.length ? `: ${places.slice(0, 4).join(", ")}${places.length > 4 ? " and more" : ""}` : ""
      }`,
  ]
    .filter(Boolean)
    .join(" · ");
  const description = [summary, trip.description?.trim()]
    .filter(Boolean)
    .join(". ");

  return {
    title: `${trip.title} | ${SITE_NAME}`,
    description: truncate(description, MAX_DESCRIPTION),
    noindex: true,
  };
};
