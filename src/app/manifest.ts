/**
 * Web App Manifest - PWA 基础配置
 * 支持添加到主屏幕、定义应用名称和主题色
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VocabMaster - 智能英语词汇学习",
    short_name: "VocabMaster",
    description: "基于 SM-2 间隔重复算法的智能英语词汇学习平台",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
