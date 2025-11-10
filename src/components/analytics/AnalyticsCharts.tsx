import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface AnalyticsChartsProps {
  userId: string;
}

const AnalyticsCharts = ({ userId }: AnalyticsChartsProps) => {
  const [equityCurve, setEquityCurve] = useState<any[]>([]);
  const [strategyPerformance, setStrategyPerformance] = useState<any[]>([]);
  const [exchangePerformance, setExchangePerformance] = useState<any[]>([]);
  const [winLossData, setWinLossData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Strategy Performance
      const strategyMap: { [key: string]: { wins: number; losses: number; totalPnL: number } } = {};
      trades.forEach((trade) => {
        const strategy = trade.strategy_tag || "No Strategy";
        if (!strategyMap[strategy]) {
          strategyMap[strategy] = { wins: 0, losses: 0, totalPnL: 0 };
        }
        const pnl = Number(trade.pnl || 0);
        strategyMap[strategy].totalPnL += pnl;
        if (pnl > 0) strategyMap[strategy].wins++;
        else if (pnl < 0) strategyMap[strategy].losses++;
      });
      const strategies = Object.entries(strategyMap).map(([name, data]) => ({
        name,
        pnl: Number(data.totalPnL.toFixed(2)),
        winRate: data.wins + data.losses > 0 
          ? Number(((data.wins / (data.wins + data.losses)) * 100).toFixed(1))
          : 0,
      }));
      setStrategyPerformance(strategies);

      // Exchange Performance
      const exchangeMap: { [key: string]: { wins: number; losses: number; totalPnL: number } } = {};
      trades.forEach((trade) => {
        const exchange = trade.exchange || "Unknown";
        if (!exchangeMap[exchange]) {
          exchangeMap[exchange] = { wins: 0, losses: 0, totalPnL: 0 };
        }
        const pnl = Number(trade.pnl || 0);
        exchangeMap[exchange].totalPnL += pnl;
        if (pnl > 0) exchangeMap[exchange].wins++;
        else if (pnl < 0) exchangeMap[exchange].losses++;
      });
      const exchanges = Object.entries(exchangeMap).map(([name, data]) => ({
        name,
        pnl: Number(data.totalPnL.toFixed(2)),
        winRate: data.wins + data.losses > 0 
          ? Number(((data.wins / (data.wins + data.losses)) * 100).toFixed(1))
          : 0,
      }));
      setExchangePerformance(exchanges);

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
      {/* Insights */}
      {strategyPerformance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-success/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-success">Best Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{strategyPerformance.sort((a, b) => b.pnl - a.pnl)[0]?.name}</div>
              <div className="text-sm text-muted-foreground">
                +${strategyPerformance.sort((a, b) => b.pnl - a.pnl)[0]?.pnl} profit
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive">Worst Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{strategyPerformance.sort((a, b) => a.pnl - b.pnl)[0]?.name}</div>
              <div className="text-sm text-muted-foreground">
                ${strategyPerformance.sort((a, b) => a.pnl - b.pnl)[0]?.pnl} loss
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Strategy Performance */}
        {strategyPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Strategy Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={strategyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="pnl" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Exchange Performance */}
        {exchangePerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Exchange Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exchangePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="pnl" fill="hsl(var(--chart-4))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCharts;
