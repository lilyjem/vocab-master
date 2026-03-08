import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学习统计",
  description: "查看你的学习数据：每日统计、连续打卡、学习趋势和成就进度。",
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
