/**
 * robots.txt 生成器 - 控制搜索引擎爬虫的访问范围
 * 允许爬取公开页面，禁止爬取 API 和需要登录的页面
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/learn/",
          "/profile/",
          "/stats/",
          "/favorites/",
        ],
      },
    ],
    sitemap: "https://bairihuizhan.online/vocab/sitemap.xml",
  };
}
