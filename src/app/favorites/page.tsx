/**
 * 收藏夹页面 - 管理用户的单词收藏夹
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FolderHeart,
  Plus,
  Trash2,
  Pencil,
  BookOpen,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { apiUrl } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  color: string;
  wordCount: number;
  createdAt: string;
}

/** 预设颜色 */
const PRESET_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#64748b",
];

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // 创建收藏夹
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // 编辑收藏夹
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // 删除确认
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /** 加载收藏夹列表 */
  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/folders"), { credentials: "include" });
      if (res.ok) {
        setFolders(await res.json());
      }
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadFolders();
    else setLoading(false);
  }, [session, loadFolders]);

  /** 创建收藏夹 */
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreateError("");
    setCreateLoading(true);
    try {
      const res = await fetch(apiUrl("/api/folders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setNewName("");
        setShowCreate(false);
      } else {
        const data = await res.json();
        setCreateError(data.error || "创建失败");
      }
    } catch {
      setCreateError("创建失败");
    } finally {
      setCreateLoading(false);
    }
  };

  /** 保存编辑 */
  const handleSaveEdit = async (folderId: string) => {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/folders/${folderId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, name: editName.trim() } : f))
        );
        setEditingId(null);
      }
    } catch {
      // 忽略
    } finally {
      setEditLoading(false);
    }
  };

  /** 删除收藏夹 */
  const handleDelete = async (folderId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/folders/${folderId}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        setDeletingId(null);
      }
    } catch {
      // 忽略
    }
  };

  if (status === "loading" || loading) {
    return <LoadingSpinner />;
  }

  // 未登录提示
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <FolderHeart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">登录后使用收藏夹</h2>
        <p className="text-muted-foreground">收藏夹功能需要登录后才能使用</p>
        <Link href="/auth/login">
          <Button>
            <LogIn className="mr-2 h-4 w-4" />
            去登录
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">收藏夹</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          新建
        </Button>
      </div>

      {/* 创建收藏夹表单 */}
      {showCreate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="收藏夹名称"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setShowCreate(false);
              }}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">颜色：</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    newColor === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`选择颜色 ${c}`}
                />
              ))}
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createLoading || !newName.trim()} size="sm">
                {createLoading ? "创建中..." : "创建"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 收藏夹列表 */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <FolderHeart className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">还没有收藏夹</p>
          <p className="text-sm text-muted-foreground">
            在学习时点击星标按钮，将单词添加到收藏夹
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {folders.map((folder) => (
            <Card key={folder.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {editingId === folder.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(folder.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button size="sm" onClick={() => handleSaveEdit(folder.id)} disabled={editLoading}>
                      保存
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      取消
                    </Button>
                  </div>
                ) : deletingId === folder.id ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive font-medium">
                      确定删除「{folder.name}」？收藏的单词不会被删除。
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(folder.id)}>
                        确定删除
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{folder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {folder.wordCount} 个单词
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/favorites/${folder.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="查看单词">
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingId(folder.id);
                          setEditName(folder.name);
                        }}
                        aria-label="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeletingId(folder.id)}
                        aria-label="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
