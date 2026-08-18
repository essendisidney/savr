import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = ["/", "/ask", "/basket", "/market", "/prices", "/map", "/fuel", "/rides", "/bundles", "/terms", "/privacy"];
  return paths.map((path) => ({
    url: `https://savr-teal.vercel.app${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "hourly" : "daily",
    priority: path === "/" ? 1 : 0.7,
  }));
}
