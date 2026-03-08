import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "账户",
  description: "登录或注册 VocabMaster 账户，开始你的英语词汇学习之旅。",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
