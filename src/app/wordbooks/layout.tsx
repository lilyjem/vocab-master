import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "词库选择",
  description:
    "选择适合你的英语词库：CET-4、CET-6、考研英语、雅思、托福、GRE，共计近 3 万词汇。",
  alternates: { canonical: "/wordbooks" },
};

export default function WordbooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
