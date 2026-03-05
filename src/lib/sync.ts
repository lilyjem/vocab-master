/**
 * 学习进度云端同步模块
 * 负责本地 Zustand store 与服务端 /api/progress 之间的数据同步
 */
import type { LocalWordProgress } from "@/types";
import { apiUrl } from "@/lib/utils";

/**
 * 单条进度异步上传（fire-and-forget，不阻塞 UI）
 * 每次答题后调用，将该单词的最新进度推送到云端
 */
export function pushSingleWord(wordId: string, progress: LocalWordProgress): void {
  fetch(apiUrl("/api/progress"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wordProgress: { [wordId]: progress },
    }),
  }).catch(() => {
    // 网络失败静默忽略，下次 fullSync 时会补上
  });
}

/**
 * 从云端拉取当前用户的全部学习进度
 * 返回以 wordId 为 key 的进度字典
 */
export async function pullFromCloud(): Promise<Record<string, LocalWordProgress> | null> {
  try {
    const res = await fetch(apiUrl("/api/progress"));
    if (!res.ok) return null;
    const data = await res.json();
    return data as Record<string, LocalWordProgress>;
  } catch {
    return null;
  }
}

/**
 * 合并本地进度与云端进度
 * 冲突策略：updatedAt 时间戳较新的优先
 * 返回合并后的完整进度字典，以及需要推送到云端的差异部分
 */
export function mergeProgress(
  local: Record<string, LocalWordProgress>,
  cloud: Record<string, LocalWordProgress>
): {
  merged: Record<string, LocalWordProgress>;
  toPush: Record<string, LocalWordProgress>;
} {
  const merged: Record<string, LocalWordProgress> = {};
  const toPush: Record<string, LocalWordProgress> = {};
  const allWordIds = new Set([...Object.keys(local), ...Object.keys(cloud)]);

  for (const wordId of allWordIds) {
    const localEntry = local[wordId];
    const cloudEntry = cloud[wordId];

    if (localEntry && !cloudEntry) {
      // 本地有、云端没有 → 保留本地，需要上传
      merged[wordId] = localEntry;
      toPush[wordId] = localEntry;
    } else if (!localEntry && cloudEntry) {
      // 云端有、本地没有 → 写入本地
      merged[wordId] = cloudEntry;
    } else if (localEntry && cloudEntry) {
      // 两边都有 → 比较 updatedAt，取较新的
      const localTime = new Date(localEntry.updatedAt || 0).getTime();
      const cloudTime = new Date(cloudEntry.updatedAt || 0).getTime();

      if (localTime >= cloudTime) {
        merged[wordId] = localEntry;
        // 本地更新，需要推送到云端
        if (localTime > cloudTime) {
          toPush[wordId] = localEntry;
        }
      } else {
        merged[wordId] = cloudEntry;
      }
    }
  }

  return { merged, toPush };
}

/**
 * 批量推送进度差异到云端
 */
async function pushBatch(toPush: Record<string, LocalWordProgress>): Promise<void> {
  const keys = Object.keys(toPush);
  if (keys.length === 0) return;

  try {
    await fetch(apiUrl("/api/progress"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordProgress: toPush }),
    });
  } catch {
    // 静默失败
  }
}

/**
 * 完整同步流程（登录时调用）
 * 1. 拉取云端数据
 * 2. 与本地数据合并
 * 3. 将本地独有/更新的数据推送到云端
 * 4. 返回合并后的数据供 store 使用
 */
export async function fullSync(
  localProgress: Record<string, LocalWordProgress>
): Promise<Record<string, LocalWordProgress> | null> {
  const cloudProgress = await pullFromCloud();
  if (!cloudProgress) return null;

  const { merged, toPush } = mergeProgress(localProgress, cloudProgress);

  // 异步推送差异到云端
  await pushBatch(toPush);

  return merged;
}
