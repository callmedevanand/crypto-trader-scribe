import { useEffect, useState, useRef, RefObject } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import ExportPDF from "./ExportPDF";
import PerformanceAnalysis from "./PerformanceAnalysis";
import { Trade } from "@/types/trade";

interface AnalyticsChartsProps {
  userId: string;
}

const AnalyticsCharts = ({ userId }: AnalyticsChartsProps) => {
  const chartsRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
  const [equityCurve, setEquityCurve] = useState<any[]>([]);
  const [winLossData, setWinLossData] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

      // Equity Curve - cumulative P&L over time
      let cumulativePnL = 0;
      const equity = trades.map((trade) => {
        cumulativePnL += Number(trade.pnl || 0);
        return {
          date: format(new Date(trade.trade_date), "MMM dd"),
          pnl: Number(cumulativePnL.toFixed(2)),
        };
      });
      setEquityCurve(equity);

      // Win/Loss Distribution
      const wins = trades.filter((t) => (t.pnl || 0) > 0).length;
      const losses = trades.filter((t) => (t.pnl || 0) < 0).length;
      setWinLossData([
        { name: "Wins", value: wins, color: "hsl(var(--success))" },
        { name: "Losses", value: losses, color: "hsl(var(--destructive))" },
      ]);

      setLoading(false);
    };

    fetchAnalytics();
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

  return (
    <div className="space-y-6">
      {/* Export PDF Button */}
      <div className="flex justify-end">
        <ExportPDF userId={userId} trades={trades} chartsRef={chartsRef} />
      </div>

      {/* Performance Analysis */}
      <PerformanceAnalysis trades={trades} />

      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winLossData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
