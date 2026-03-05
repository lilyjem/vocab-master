# VocabMaster Dockerfile
# 多阶段构建，优化镜像大小

# ===== 阶段1: 安装依赖 =====
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

# ===== 阶段2: 构建应用 =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* 变量需要在构建时注入（会嵌入到客户端 bundle）
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

RUN npx prisma generate
RUN npm run build

# 预编译 seed 脚本为 JS（生产环境无需 tsx）
RUN npx esbuild prisma/seed/index.ts --bundle --platform=node --outfile=prisma/seed/index.js --external:@prisma/client

# ===== 阶段3: 生产运行 =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Prisma 需要 openssl 来连接 PostgreSQL
RUN apk add --no-cache openssl libc6-compat

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关文件（schema + seed 数据 + 编译后的 seed.js + client）
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# 复制启动脚本
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

USER root
RUN chmod +x ./docker-entrypoint.sh
# 赋予 nextjs 用户对 prisma 引擎目录的写权限（db push 需要）
RUN chown -R nextjs:nodejs node_modules/.prisma node_modules/@prisma node_modules/prisma
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["./docker-entrypoint.sh"]
