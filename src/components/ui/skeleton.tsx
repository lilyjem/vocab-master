import { cn } from "@/lib/utils";

/** 骨架屏占位组件 - 用于懒加载时的加载状态 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
