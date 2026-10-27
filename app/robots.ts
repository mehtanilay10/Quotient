import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quotient.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // API routes are internal; every account page under /user is login-gated.
      disallow: ["/api/", "/login", "/user/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
