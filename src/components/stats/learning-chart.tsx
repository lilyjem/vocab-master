/**
 * 学习趋势图表组件 - 使用 Recharts 展示学习数据
 */
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyData {
  date: string;
  wordsLearned: number;
  wordsReviewed: number;
}

interface LearningChartProps {
  data: DailyData[];
  title?: string;
}

/** 学习量面积图 */
export function LearningAreaChart({ data, title = "学习趋势" }: LearningChartProps) {
  // 格式化日期显示（只显示月/日）
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: d.date.slice(5), // "2024-03-05" -> "03-05"
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            暂无学习数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorLearned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReviewed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-card)",
                }}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="wordsLearned"
                name="新学"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorLearned)"
              />
              <Area
                type="monotone"
                dataKey="wordsReviewed"
                name="复习"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorReviewed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/** 学习量柱状图 */
export function LearningBarChart({ data, title = "每日学习量" }: LearningChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: d.date.slice(5),
    total: d.wordsLearned + d.wordsReviewed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            暂无学习数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-card)",
                }}
              />
              <Legend />
              <Bar
                dataKey="wordsLearned"
                name="新学"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="wordsReviewed"
                name="复习"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
