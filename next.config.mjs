/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // 生产环境子路径部署：所有路由和静态资源以 /vocab 为前缀
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
