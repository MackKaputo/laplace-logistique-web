import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/backoffice/", "/api/"],
      },
    ],
    sitemap: "https://www.laplacelogistique.com/sitemap.xml",
  }
}
