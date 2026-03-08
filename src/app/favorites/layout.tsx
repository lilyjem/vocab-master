import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "收藏夹",
  description: "管理你的单词收藏夹，将难词分组整理，集中复习。",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
