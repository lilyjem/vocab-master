/**
 * 登录数据迁移 Provider
 * 用户首次登录时，将本地 localStorage 中的学习数据迁移到服务器
 * 迁移完成后清除本地数据，后续所有操作直接读写服务器
 * 必须放在 SessionProvider 内部使用
 */
"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useLearningStore } from "@/lib/store";
import { apiUrl } from "@/lib/utils";

/** 迁移标记的 localStorage key */
const MIGRATION_KEY = "vocab-master-migrated";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const prevStatusRef = useRef<string>(status);
  const isMigratingRef = useRef(false);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // 检测用户刚登录
    const justLoggedIn =
      (prevStatus === "unauthenticated" || prevStatus === "loading") &&
      status === "authenticated";

    if (!justLoggedIn || !session?.user || isMigratingRef.current) return;

    // 检查是否已经迁移过
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
    if (alreadyMigrated) return;

    isMigratingRef.current = true;

    const doMigration = async () => {
      try {
        const store = useLearningStore.getState();
        const hasLocalData =
          Object.keys(store.wordProgress).length > 0 ||
          Object.keys(store.dailyStats).length > 0 ||
          store.currentBookId !== null;

        if (!hasLocalData) {
          // 没有本地数据，直接标记为已迁移
          localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
          return;
        }

        // 并行迁移所有本地数据到服务器
        const promises: Promise<unknown>[] = [];

        // 迁移单词进度
        if (Object.keys(store.wordProgress).length > 0) {
          promises.push(
            fetch(apiUrl("/api/progress"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wordProgress: store.wordProgress }),
            })
          );
        }

        // 迁移每日统计
        if (Object.keys(store.dailyStats).length > 0) {
          promises.push(
            fetch(apiUrl("/api/daily-stats"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dailyStats: store.dailyStats }),
            })
          );
        }

        // 迁移用户设置
        const { settings } = store;
        promises.push(
          fetch(apiUrl("/api/user/settings"), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
          })
        );

        // 迁移当前词库
        if (store.currentBookId) {
          promises.push(
            fetch(apiUrl("/api/user/current-book"), {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookId: store.currentBookId }),
            })
          );
        }

        await Promise.allSettled(promises);

        // 迁移完成，清除本地学习数据
        store.clearAllData();

        // 标记已迁移
        localStorage.setItem(MIGRATION_KEY, new Date().toISOString());

        console.log("本地数据已迁移到服务器");
      } catch (e) {
        console.error("数据迁移失败:", e);
      } finally {
        isMigratingRef.current = false;
      }
    };

    doMigration();
  }, [status, session]);

  return <>{children}</>;
}
