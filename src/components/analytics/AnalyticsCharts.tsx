import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExportPDF from "./ExportPDF";
import PerformanceAnalysis from "./PerformanceAnalysis";
import { Trade } from "@/types/trade";

interface AnalyticsChartsProps {
  userId: string;
}

type TimePeriod = "total" | "custom";

const AnalyticsCharts = ({ userId }: AnalyticsChartsProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<TimePeriod>("total");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: trades, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "closed")
        .order("trade_date", { ascending: true });

      if (error) {
        console.error("Error fetching trades:", error);
        setLoading(false);
        return;
      }

      setTrades(trades || []);
      setLoading(false);
    };

    fetchAnalytics();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getFilteredTrades = () => {
    if (period === "total") {
      return trades;
    }

    if (period === "custom") {
      if (!customStartDate || !customEndDate) return [];
      const customStart = new Date(customStartDate);
      customStart.setHours(0, 0, 0, 0);
      const customEnd = new Date(customEndDate);
      customEnd.setHours(23, 59, 59, 999);
      return trades.filter(trade => {
        const tradeDate = new Date(trade.trade_date);
        return tradeDate >= customStart && tradeDate <= customEnd;
      });
    }

    return trades;
  };

  const filteredTrades = getFilteredTrades();

  return (
    <div className="space-y-6">
      {/* Export PDF Button */}
      <div className="flex justify-end">
        <ExportPDF 
          userId={userId} 
          trades={filteredTrades} 
          period={period}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      </div>

      {/* Performance Analysis */}
      <PerformanceAnalysis 
        trades={trades} 
        period={period}
        setPeriod={setPeriod}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        filteredTrades={filteredTrades}
      />
    </div>
  );
};

export default AnalyticsCharts;
