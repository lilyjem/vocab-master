/**
 * 学习进度云端同步 Provider
 * 监听 NextAuth session 变化，当用户登录时自动执行 fullSync
 * 同时同步 wordProgress 和 dailyStats
 * 必须放在 SessionProvider 内部使用
 */
"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLearningStore } from "@/lib/store";
import { fullSync, fullSyncDailyStats } from "@/lib/sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  // 记录上一次的认证状态，用于检测「从未登录变为已登录」
  const prevStatusRef = useRef<string>(status);
  // 防止重复同步
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // 当 session 从无到有（用户刚登录）或页面首次加载就有 session 时触发同步
    const justLoggedIn =
      (prevStatus === "unauthenticated" || prevStatus === "loading") &&
      status === "authenticated";

    if (!justLoggedIn || !session?.user || isSyncingRef.current) return;

    isSyncingRef.current = true;

    const doSync = async () => {
      try {
        const store = useLearningStore.getState();

        // 并行同步 wordProgress 和 dailyStats
        const [mergedProgress, mergedStats] = await Promise.all([
          fullSync(store.wordProgress),
          fullSyncDailyStats(store.dailyStats),
        ]);

        if (mergedProgress) {
          useLearningStore.getState().mergeCloudProgress(mergedProgress);
        }
        if (mergedStats) {
          useLearningStore.getState().mergeCloudDailyStats(mergedStats);
        }
      } catch (e) {
        console.error("云端同步失败:", e);
      } finally {
        isSyncingRef.current = false;
      }
    };

    doSync();
  }, [status, session]);

  return <>{children}</>;
}
