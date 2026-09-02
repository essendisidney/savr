import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["/", "/sell", "/search", "/account", "/login", "/terms", "/privacy"];
  return paths.map((path) => ({
    url: `https://savr-teal.vercel.app${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "hourly" : "daily",
    priority: path === "/" ? 1 : 0.7,
  }));
}
