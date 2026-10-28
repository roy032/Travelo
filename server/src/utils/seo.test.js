import { describe, it, expect } from "vitest";
import {
  renderIndexHtml,
  buildSitemap,
  buildRobotsTxt,
  formatDateRange,
  sharedTripPage,
} from "./seo.js";

const template = `<!doctype html>
<html lang="en">
  <head>
    <title>Travelo | Plan group trips together</title>
    <meta
      name="description"
      content="Default description"
    />
    <meta property="og:title" content="Travelo" />
    <meta property="og:description" content="Default description" />
    <meta property="og:image" content="/og-image.jpg" />
  </head>
  <body><div id="root"></div></body>
</html>`;

const site = "https://travelo.example";

describe("renderIndexHtml", () => {
  it("writes the title, description and absolute URLs for public pages", () => {
    const html = renderIndexHtml(template, "/explore/", site);

    expect(html).toContain("<title>Explore trips | Travelo</title>");
    expect(html).toContain(
      '<meta property="og:title" content="Explore trips | Travelo" />',
    );
    expect(html).not.toContain("Default description");
    expect(html).toContain(
      '<meta property="og:image" content="https://travelo.example/og-image.jpg" />',
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://travelo.example/explore" />',
    );
    expect(html).not.toContain("noindex");
  });

  it("marks private pages noindex and keeps the default title", () => {
    const html = renderIndexHtml(template, "/trips/abc", site);

    expect(html).toContain(
      "<title>Travelo | Plan group trips together</title>",
    );
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).not.toContain('rel="canonical"');
  });
});

describe("sitemap and robots.txt", () => {
  it("lists public pages with absolute URLs", () => {
    const xml = buildSitemap(site);
    expect(xml).toContain("<loc>https://travelo.example/</loc>");
    expect(xml).toContain("<loc>https://travelo.example/explore</loc>");
    expect(xml).not.toContain("/trips");
  });

  it("blocks private pages and points to the sitemap", () => {
    const robots = buildRobotsTxt(site);
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Disallow: /trips");
    expect(robots).toContain("Sitemap: https://travelo.example/sitemap.xml");
  });
});

describe("formatDateRange", () => {
  it("shortens ranges inside one month or year", () => {
    expect(formatDateRange("2030-01-10", "2030-01-15")).toBe("10–15 Jan 2030");
    expect(formatDateRange("2030-01-28", "2030-02-03")).toBe(
      "28 Jan – 3 Feb 2030",
    );
    expect(formatDateRange("2030-12-30", "2031-01-02")).toBe(
      "30 Dec 2030 – 2 Jan 2031",
    );
    expect(formatDateRange("2030-01-10", "2030-01-10")).toBe("10 Jan 2030");
  });
});

describe("sharedTripPage", () => {
  const shared = {
    trip: {
      title: "Sylhet <tea> trip",
      description: "Tea gardens and waterfalls",
      startDate: "2030-03-01",
      endDate: "2030-03-04",
    },
    activities: [
      { location: { name: "Ratargul" } },
      { location: { name: "Jaflong" } },
      { location: { name: "Ratargul" } },
    ],
  };

  it("summarises the dates and stops for link previews", () => {
    const page = sharedTripPage(shared);
    expect(page.title).toBe("Sylhet <tea> trip | Travelo");
    expect(page.description).toBe(
      "1–4 Mar 2030 · 3 stops: Ratargul, Jaflong. Tea gardens and waterfalls",
    );
    expect(page.noindex).toBe(true);
  });

  it("keeps long descriptions short", () => {
    const page = sharedTripPage({
      ...shared,
      trip: { ...shared.trip, description: "x".repeat(500) },
    });
    expect(page.description.length).toBe(200);
    expect(page.description.endsWith("…")).toBe(true);
  });

  it("gives a generic page for a link that no longer works", () => {
    expect(sharedTripPage(null).title).toBe("Shared trip | Travelo");
  });

  it("renders escaped preview tags without a canonical link", () => {
    const html = renderIndexHtml(
      template,
      "/share/abc123",
      site,
      sharedTripPage(shared),
    );
    expect(html).toContain("<title>Sylhet &lt;tea&gt; trip | Travelo</title>");
    expect(html).toContain(
      '<meta property="og:description" content="1–4 Mar 2030 · 3 stops: Ratargul, Jaflong. Tea gardens and waterfalls" />',
    );
    expect(html).toContain(
      '<meta property="og:url" content="https://travelo.example/share/abc123" />',
    );
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).not.toContain("canonical");
  });
});
