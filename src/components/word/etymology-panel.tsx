/**
 * 词根分析面板 - 展示词根词缀、词源、相关词
 * 前缀(蓝)、词根(绿)、后缀(橙) 颜色区分
 */
"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, apiUrl } from "@/lib/utils";

interface WordPart {
  part: string;
  meaning: string;
}

interface EtymologyPanelProps {
  word: string;
  className?: string;
  /** 阻止点击冒泡 */
  onInteraction?: (e: React.MouseEvent) => void;
  /** 点击相关词时的回调（可用于切换单词等） */
  onRelatedWordClick?: (word: string) => void;
}

function getPartType(part: string): "prefix" | "root" | "suffix" {
  if (part.endsWith("-") && !part.startsWith("-")) return "prefix";
  if (part.startsWith("-") && !part.endsWith("-")) return "suffix";
  return "root";
}

export function EtymologyPanel({
  word,
  className,
  onInteraction,
  onRelatedWordClick,
}: EtymologyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<{
    roots: WordPart[];
    origin?: string;
    relatedWords: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      onInteraction?.(e);
      if (isOpen) {
        setIsOpen(false);
        return;
      }
      setIsOpen(true);
      if (fetched) return;

      setLoading(true);
      try {
        const res = await fetch(
          apiUrl(`/api/words/etymology?word=${encodeURIComponent(word)}`)
        );
        const json = await res.json();
        if (res.ok) {
          setData({
            roots: json.roots || [],
            origin: json.origin,
            relatedWords: json.relatedWords || [],
          });
        } else {
          setData({ roots: [], relatedWords: [] });
        }
      } catch {
        setData({ roots: [], relatedWords: [] });
      } finally {
        setFetched(true);
        setLoading(false);
      }
    },
    [word, isOpen, fetched, onInteraction]
  );

  return (
    <div className={cn("w-full mt-3", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="h-8 px-2 text-muted-foreground hover:text-foreground w-full justify-start gap-1"
      >
        <BookOpen className="h-4 w-4 shrink-0" />
        <span>词根分析</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-auto" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-auto" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-2 rounded-lg bg-muted/50 p-3 space-y-3 text-sm">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          {!loading && data !== null && (
            <>
              {/* 词根词缀 */}
              {data.roots.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    词根词缀
                  </p>
                  <div className="flex flex-wrap gap-1 items-center">
                    {data.roots.map((r, i) => {
                      const type = getPartType(r.part);
                      return (
                        <span
                          key={i}
                          className={cn(
                            "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium",
                            type === "prefix" && "bg-blue-500/20 text-blue-700 dark:text-blue-300",
                            type === "root" && "bg-green-500/20 text-green-700 dark:text-green-300",
                            type === "suffix" && "bg-orange-500/20 text-orange-700 dark:text-orange-300"
                          )}
                        >
                          {r.part.replace(/-/g, "")}
                          <span className="text-muted-foreground ml-1">
                            ({r.meaning})
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 词源描述 */}
              {data.origin && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">词源</p>
                  <p className="text-foreground/90 italic">{data.origin}</p>
                </div>
              )}

              {/* 相关词 */}
              {data.relatedWords.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    相关词
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {data.relatedWords.map((w) => (
                      <Badge
                        key={w}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs"
                        onClick={(e) => {
                          onInteraction?.(e as unknown as React.MouseEvent);
                          onRelatedWordClick?.(w);
                        }}
                      >
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.roots.length === 0 && !data.origin && data.relatedWords.length === 0 && (
                <p className="text-muted-foreground italic">暂无词源信息</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
