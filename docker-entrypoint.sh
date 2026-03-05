#!/bin/sh
# VocabMaster 容器启动脚本
# 1. 等待数据库就绪
# 2. 执行 Prisma schema 推送
# 3. 导入词库数据（如果数据库为空）
# 4. 启动 Next.js 应用

set -e

echo "⏳ 等待数据库就绪..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if node -e "
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    p.\$connect().then(() => { p.\$disconnect(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "✅ 数据库已就绪"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "  重试 $RETRY_COUNT/$MAX_RETRIES..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ 数据库连接超时"
  exit 1
fi

echo "📋 同步数据库 schema..."
node node_modules/prisma/build/index.js db push --skip-generate 2>&1 || true

# 检查是否需要导入种子数据（WordBook 表为空时导入）
NEED_SEED=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.wordBook.count().then(c => { console.log(c === 0 ? 'yes' : 'no'); p.\$disconnect(); }).catch(() => { console.log('yes'); p.\$disconnect(); });
" 2>/dev/null)

if [ "$NEED_SEED" = "yes" ]; then
  echo "🌱 首次启动，导入词库数据..."
  node prisma/seed/index.js 2>&1
else
  echo "📚 词库数据已存在，跳过导入"
fi

echo "🚀 启动应用..."
exec node server.js
