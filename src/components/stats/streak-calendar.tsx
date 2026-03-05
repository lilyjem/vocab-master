/**
 * 打卡日历组件 - 类似 GitHub 贡献热力图
 */
"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StreakCalendarProps {
  data: Record<string, { wordsLearned: number; wordsReviewed: number }>;
}

export function StreakCalendar({ data }: StreakCalendarProps) {
  // 生成最近90天的日期
  const days: { date: string; count: number; level: number }[] = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const stat = data[dateStr];
    const count = stat ? stat.wordsLearned + stat.wordsReviewed : 0;

    let level = 0;
    if (count > 0) level = 1;
    if (count >= 10) level = 2;
    if (count >= 30) level = 3;
    if (count >= 50) level = 4;

    days.push({ date: dateStr, count, level });
  }

  const levelColors = [
    "bg-muted",
    "bg-green-200 dark:bg-green-900",
    "bg-green-400 dark:bg-green-700",
    "bg-green-500 dark:bg-green-600",
    "bg-green-600 dark:bg-green-500",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">学习日历（近90天）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {days.map((day) => (
            <div
              key={day.date}
              className={cn(
                "h-3 w-3 rounded-sm transition-colors",
                levelColors[day.level]
              )}
              title={`${day.date}: ${day.count} 个单词`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>少</span>
          {levelColors.map((color, i) => (
            <div
              key={i}
              className={cn("h-3 w-3 rounded-sm", color)}
            />
          ))}
          <span>多</span>
        </div>
      </CardContent>
    </Card>
  );
}
