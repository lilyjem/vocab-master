/**
 * 收藏夹详情页 - 查看收藏夹中的单词列表
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { playWordAudio } from "@/lib/audio";
import { apiUrl } from "@/lib/utils";
import { useLearningData } from "@/lib/use-learning-data";

interface FolderWord {
  id: string;
  word: string;
  phonetic?: string;
  definition: string;
  partOfSpeech?: string;
  addedAt: string;
}

interface FolderDetail {
  id: string;
  name: string;
  color: string;
  words: FolderWord[];
}

export default function FolderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  const { settings } = useLearningData();

  const [folder, setFolder] = useState<FolderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /** 加载收藏夹详情 */
  const loadFolder = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/folders/${folderId}`), {
        credentials: "include",
      });
      if (res.ok) {
        setFolder(await res.json());
      } else {
        router.push("/favorites");
      }
    } catch {
      router.push("/favorites");
    } finally {
      setLoading(false);
    }
  }, [folderId, router]);

  useEffect(() => {
    loadFolder();
  }, [loadFolder]);

  /** 从收藏夹移除单词 */
  const removeWord = async (wordId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/folders/${folderId}/words`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wordId }),
      });
      if (res.ok && folder) {
        setFolder({
          ...folder,
          words: folder.words.filter((w) => w.id !== wordId),
        });
      }
    } catch {
      // 忽略
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!folder) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push("/favorites")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: folder.color }}
          />
          <h1 className="text-xl font-bold">{folder.name}</h1>
          <span className="text-sm text-muted-foreground">
            ({folder.words.length} 个单词)
          </span>
        </div>
      </div>

      {folder.words.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <p className="text-muted-foreground">这个收藏夹还没有单词</p>
          <p className="text-sm text-muted-foreground">
            在学习时点击星标按钮，将单词添加到收藏夹
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {folder.words.map((word) => (
            <Card key={word.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <button
                  onClick={() => playWordAudio(word.word, settings.pronunciation)}
                  className="shrink-0 rounded-full p-1.5 hover:bg-muted transition-colors"
                  aria-label={`播放 ${word.word}`}
                >
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{word.word}</span>
                    {word.phonetic && (
                      <span className="text-sm text-muted-foreground">{word.phonetic}</span>
                    )}
                    {word.partOfSpeech && (
                      <span className="text-xs text-muted-foreground/70">{word.partOfSpeech}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{word.definition}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive"
                  onClick={() => removeWord(word.id)}
                  aria-label="移除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
