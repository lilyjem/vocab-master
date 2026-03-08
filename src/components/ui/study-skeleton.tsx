/**
 * 学习页面通用骨架屏
 * 模拟卡片学习界面的加载占位，替代 spinner 提升感知速度
 */

export function StudySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 返回按钮占位 */}
      <div className="h-9 w-32 bg-muted rounded" />

      {/* 进度条区域 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
        <div className="h-2 w-full bg-muted rounded-full" />
      </div>

      {/* 卡片主体 */}
      <div className="rounded-xl border p-8 space-y-4">
        <div className="flex justify-center">
          <div className="h-8 w-48 bg-muted rounded" />
        </div>
        <div className="flex justify-center">
          <div className="h-5 w-36 bg-muted rounded" />
        </div>
        <div className="h-px w-full bg-muted" />
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-16 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
