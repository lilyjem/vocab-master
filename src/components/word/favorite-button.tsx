/**
 * 收藏按钮组件 - 将单词添加到收藏夹
 * 点击后弹出收藏夹列表，可选择加入或创建新收藏夹
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Plus, Check, FolderHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, apiUrl } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  color: string;
  wordCount: number;
}

interface FavoriteButtonProps {
  wordId: string;
  className?: string;
}

export function FavoriteButton({ wordId, className }: FavoriteButtonProps) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  // 记录当前单词已加入的收藏夹 ID
  const [addedFolders, setAddedFolders] = useState<Set<string>>(new Set());
  // 创建新收藏夹
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  /** 加载收藏夹列表 */
  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/folders"), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch {
      // 忽略错误
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadFolders();
      setAddedFolders(new Set());
    }
  }, [open, loadFolders]);

  /** 添加单词到收藏夹 */
  const addToFolder = async (folderId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/folders/${folderId}/words`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wordId }),
      });
      if (res.ok) {
        setAddedFolders((prev) => new Set(prev).add(folderId));
      }
    } catch {
      // 忽略错误
    }
  };

  /** 创建新收藏夹并添加单词 */
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch(apiUrl("/api/folders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setNewName("");
        setCreating(false);
        // 自动将单词加入新创建的收藏夹
        await addToFolder(folder.id);
      }
    } catch {
      // 忽略错误
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="rounded-full p-2 hover:bg-muted transition-colors"
        aria-label="收藏单词"
      >
        <Star className={cn("h-5 w-5", addedFolders.size > 0 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
      </button>

      {/* 收藏夹弹出面板 */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border bg-card shadow-lg p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-muted-foreground">
            <FolderHeart className="h-4 w-4" />
            添加到收藏夹
          </div>

          {loading ? (
            <p className="px-2 py-3 text-sm text-muted-foreground text-center">加载中...</p>
          ) : folders.length === 0 && !creating ? (
            <p className="px-2 py-3 text-sm text-muted-foreground text-center">暂无收藏夹</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => addToFolder(folder.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  {addedFolders.has(folder.id) && (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 创建新收藏夹 */}
          {creating ? (
            <div className="flex items-center gap-1 mt-1 px-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="收藏夹名称"
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setCreating(false);
                }}
              />
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCreate}
                disabled={createLoading || !newName.trim()}
              >
                {createLoading ? "..." : "创建"}
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-muted transition-colors mt-1 border-t pt-2"
            >
              <Plus className="h-4 w-4" />
              新建收藏夹
            </button>
          )}

          {/* 关闭按钮 */}
          <button
            onClick={() => setOpen(false)}
            className="w-full text-center text-xs text-muted-foreground mt-1 py-1 hover:text-foreground"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
}
