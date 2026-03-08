import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "个人中心",
  description: "管理你的学习设置、账户信息和个人偏好。",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
