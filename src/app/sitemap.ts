import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site/config";

const publicRoutes = [
  "/",
  "/studio",
  "/library",
  "/learning",
  "/skills",
  "/context",
  "/integrations",
  "/data",
  "/improve",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
