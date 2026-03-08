/**
 * 学习时间追踪 Hook
 * 精确记录用户在学习页面的活跃时间，支持：
 * - 页面可见性切换时自动暂停/恢复（切换标签页时不计时）
 * - 定时将累计时长刷入 Zustand store
 * - 组件卸载时刷入剩余时长
 * - 返回实时学习秒数，供页面实时显示使用
 */
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useLearningData } from "@/lib/use-learning-data";

/** 刷新间隔：每 30 秒将累计时长同步到 store */
const FLUSH_INTERVAL_MS = 30_000;

/** 最小刷入阈值：累计超过 30 秒才刷入，避免极短时间造成频繁更新 */
const MIN_FLUSH_SECONDS = 30;

/**
 * 学习计时 Hook
 * @returns {{ elapsedSeconds: number, stopTimer: () => number }}
 *   - elapsedSeconds: 实时累计学习秒数（响应式，每秒更新）
 *   - stopTimer: 手动停止计时并刷入剩余时长，返回总秒数
 */
export function useStudyTimer() {
  const { addStudyMinutes } = useLearningData();

  /** 保存 addStudyMinutes 供 cleanup 使用，避免闭包问题 */
  const addStudyMinutesRef = useRef(addStudyMinutes);
  addStudyMinutesRef.current = addStudyMinutes;

  /** 当前活跃段的起始时间戳（ms），为 null 表示暂停中 */
  const activeStartRef = useRef<number | null>(Date.now());

  /** 之前暂停段累计的毫秒数 */
  const accumulatedMsRef = useRef(0);

  /** 已经刷入 store 的总分钟数 */
  const flushedMinutesRef = useRef(0);

  /** 是否已停止（防止重复 flush） */
  const stoppedRef = useRef(false);

  /** 实时显示的累计秒数 */
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  /** 计算当前总累计毫秒数 */
  const getTotalMs = useCallback(() => {
    let total = accumulatedMsRef.current;
    if (activeStartRef.current !== null) {
      total += Date.now() - activeStartRef.current;
    }
    return total;
  }, []);

  /** 将累计时长中尚未刷入的整分钟数写入 store */
  const flush = useCallback(
    (isFinal = false) => {
      if (stoppedRef.current) return;

      const totalMs = getTotalMs();
      const totalSeconds = Math.floor(totalMs / 1000);

      // 非最终 flush 时，累计不足 30 秒不刷入
      if (!isFinal && totalSeconds < MIN_FLUSH_SECONDS) return;

      let totalMinutes: number;
      if (isFinal) {
        // 最终 flush：四舍五入到整分钟（>= 30 秒算 1 分钟）
        totalMinutes = Math.round(totalMs / 60_000);
      } else {
        // 定时 flush：只刷入完整分钟
        totalMinutes = Math.floor(totalMs / 60_000);
      }

      const minutesToAdd = totalMinutes - flushedMinutesRef.current;
      if (minutesToAdd > 0) {
        addStudyMinutes(minutesToAdd);
        flushedMinutesRef.current = totalMinutes;
      }
    },
    [getTotalMs, addStudyMinutes]
  );

  /** 手动停止计时，返回总累计秒数 */
  const stopTimer = useCallback(() => {
    if (stoppedRef.current) return Math.floor(getTotalMs() / 1000);

    // 冻结活跃时间
    if (activeStartRef.current !== null) {
      accumulatedMsRef.current += Date.now() - activeStartRef.current;
      activeStartRef.current = null;
    }

    flush(true);
    stoppedRef.current = true;

    return Math.floor(getTotalMs() / 1000);
  }, [flush, getTotalMs]);

  // 实时更新显示秒数 + 定时 flush
  useEffect(() => {
    // 每秒更新 elapsedSeconds，同时检查是否需要 flush
    let lastFlushTime = Date.now();

    const tickId = setInterval(() => {
      const totalMs = getTotalMs();
      setElapsedSeconds(Math.floor(totalMs / 1000));

      // 每 30 秒执行一次 flush
      if (Date.now() - lastFlushTime >= FLUSH_INTERVAL_MS) {
        flush(false);
        lastFlushTime = Date.now();
      }
    }, 1000);

    return () => clearInterval(tickId);
  }, [getTotalMs, flush]);

  // 处理页面可见性变化：切到后台暂停，切回前台恢复
  useEffect(() => {
    const handleVisibility = () => {
      if (stoppedRef.current) return;

      if (document.hidden) {
        // 页面隐藏：暂停计时，保存当前活跃段时长
        if (activeStartRef.current !== null) {
          accumulatedMsRef.current += Date.now() - activeStartRef.current;
          activeStartRef.current = null;
        }
        flush(false);
      } else {
        // 页面恢复：重新开始活跃段
        activeStartRef.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [flush]);

  // 组件卸载时最终 flush
  useEffect(() => {
    return () => {
      if (!stoppedRef.current) {
        // 冻结活跃时间
        if (activeStartRef.current !== null) {
          accumulatedMsRef.current += Date.now() - activeStartRef.current;
          activeStartRef.current = null;
        }

        const totalMs = accumulatedMsRef.current;
        const totalMinutes = Math.round(totalMs / 60_000);
        const minutesToAdd = totalMinutes - flushedMinutesRef.current;

        if (minutesToAdd > 0) {
          // 使用 ref 保存的 addStudyMinutes，避免 cleanup 闭包问题
          addStudyMinutesRef.current(minutesToAdd);
        }

        stoppedRef.current = true;
      }
    };
  }, []);

  return { elapsedSeconds, stopTimer };
}
