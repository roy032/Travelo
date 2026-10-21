import express from "express";
import { buildRobotsTxt, buildSitemap, getSiteUrl } from "#utils/seo.js";

const router = express.Router();

router.get("/robots.txt", (req, res) => {
  res
    .type("text/plain")
    .set("Cache-Control", "public, max-age=3600")
    .send(buildRobotsTxt(getSiteUrl(req)));
});

router.get("/sitemap.xml", (req, res) => {
  res
    .type("application/xml")
    .set("Cache-Control", "public, max-age=3600")
    .send(buildSitemap(getSiteUrl(req)));
});

export default router;
