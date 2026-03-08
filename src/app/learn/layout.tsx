import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "学习中心",
  description: "选择学习模式：新词学习、复习巩固、拼写测试、选择题测验。",
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
