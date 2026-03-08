/**
 * 例句组件 - 可折叠展示单词例句
 * 点击「查看例句」获取并显示，目标词高亮
 */
"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, apiUrl } from "@/lib/utils";

interface ExampleSentencesProps {
  word: string;
  className?: string;
  /** 阻止点击冒泡（避免触发卡片翻转） */
  onInteraction?: (e: React.MouseEvent) => void;
}

interface ExampleItem {
  sentence: string;
  translation?: string;
}

/** 在句子中高亮目标单词（不区分大小写） */
function highlightWord(sentence: string, word: string): React.ReactNode {
  const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = sentence.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <mark key={i} className="bg-primary/25 font-semibold rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function ExampleSentences({
  word,
  className,
  onInteraction,
}: ExampleSentencesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [examples, setExamples] = useState<ExampleItem[] | null>(null);
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
        const res = await fetch(apiUrl(`/api/words/examples?word=${encodeURIComponent(word)}`));
        const data = await res.json();
        if (res.ok && Array.isArray(data.examples)) {
          setExamples(data.examples);
        } else {
          setExamples([]);
        }
      } catch {
        setExamples([]);
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
        <FileText className="h-4 w-4 shrink-0" />
        <span>查看例句</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-auto" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-auto" />
        )}
      </Button>

      {isOpen && (
        <div className="mt-2 rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
          {!loading && examples !== null && examples.length === 0 && (
            <p className="text-muted-foreground italic">暂无例句</p>
          )}
          {!loading && examples !== null && examples.length > 0 && (
            <ul className="space-y-2 list-none">
              {examples.slice(0, 5).map((ex, i) => (
                <li key={i} className="text-left">
                  <p className="italic text-foreground">
                    {highlightWord(ex.sentence, word)}
                  </p>
                  {ex.translation && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ex.translation}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
