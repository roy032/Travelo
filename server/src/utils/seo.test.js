import { describe, it, expect } from "vitest";
import { renderIndexHtml, buildSitemap, buildRobotsTxt } from "./seo.js";

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
