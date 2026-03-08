/**
 * 通用加载动画组件 - 替代各页面中重复的 spinner 代码
 */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={className ?? "flex items-center justify-center py-20"}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
