"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisSummary as AnalysisSummaryType } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  MinusCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart2,
} from "lucide-react";

interface AnalysisSummaryProps {
  summary: AnalysisSummaryType | null;
  isLoading?: boolean;
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case "bullish":
      return <TrendingUp className="h-6 w-6 text-green-500" />;
    case "bearish":
      return <TrendingDown className="h-6 w-6 text-red-500" />;
    default:
      return <MinusCircle className="h-6 w-6 text-yellow-500" />;
  }
}

function getSentimentBadge(sentiment: string) {
  switch (sentiment) {
    case "bullish":
      return <Badge variant="success" className="text-base px-4 py-1">OLUMLU</Badge>;
    case "bearish":
      return <Badge variant="destructive" className="text-base px-4 py-1">OLUMSUZ</Badge>;
    default:
      return <Badge variant="outline" className="text-base px-4 py-1">NOTR</Badge>;
  }
}

function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case "bullish":
      return "border-green-500/30 bg-green-500/5";
    case "bearish":
      return "border-red-500/30 bg-red-500/5";
    default:
      return "border-yellow-500/30 bg-yellow-500/5";
  }
}

function getScoreBarColor(score: number) {
  if (score >= 30) return "bg-green-500";
  if (score <= -30) return "bg-red-500";
  return "bg-yellow-500";
}

export function AnalysisSummaryComponent({
  summary,
  isLoading,
}: AnalysisSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Analiz Ozeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Analiz Ozeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Analiz ozeti yuklenemedi
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate score bar position (0-100 from left, where 50 is neutral)
  const scorePosition = ((summary.sentiment_score + 100) / 200) * 100;

  return (
    <Card className={cn("border-2", getSentimentColor(summary.sentiment))}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Analiz Ozeti
          </CardTitle>
          <div className="flex items-center gap-2">
            {getSentimentIcon(summary.sentiment)}
            {getSentimentBadge(summary.sentiment)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment Score Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Olumsuz</span>
            <span>Notr</span>
            <span>Olumlu</span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-green-500/30" />
            {/* Score indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-foreground rounded-full transform -translate-x-1/2"
              style={{ left: `${scorePosition}%` }}
            />
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted-foreground/50" />
          </div>
          <div className="text-center">
            <span className={cn(
              "text-sm font-medium",
              summary.sentiment_score >= 30 && "text-green-500",
              summary.sentiment_score <= -30 && "text-red-500",
              summary.sentiment_score > -30 && summary.sentiment_score < 30 && "text-yellow-500"
            )}>
              Skor: {summary.sentiment_score > 0 ? "+" : ""}{summary.sentiment_score}
            </span>
          </div>
        </div>

        {/* Summary Text */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Ne Anlama Geliyor?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary.summary_text}
          </p>
        </div>

        {/* Key Points */}
        {summary.key_points && summary.key_points.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Onemli Noktalar
            </p>
            <ul className="space-y-1">
              {summary.key_points.map((point, idx) => (
                <li
                  key={idx}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-green-500 mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {summary.warnings && summary.warnings.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Dikkat Edilmesi Gerekenler
            </p>
            <ul className="space-y-1">
              {summary.warnings.map((warning, idx) => (
                <li
                  key={idx}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-yellow-500 mt-0.5">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
