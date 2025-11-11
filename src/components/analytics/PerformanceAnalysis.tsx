import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, parseISO } from "date-fns";
import { Trade } from "@/types/trade";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PerformanceAnalysisProps {
  trades: Trade[];
}

type TimePeriod = "weekly" | "monthly" | "yearly" | "custom";

const PerformanceAnalysis = ({ trades }: PerformanceAnalysisProps) => {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const getFilteredTrades = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (period) {
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case "custom":
        if (!customStartDate || !customEndDate) return [];
        const customStart = new Date(customStartDate);
        customStart.setHours(0, 0, 0, 0);
        const customEnd = new Date(customEndDate);
        customEnd.setHours(23, 59, 59, 999);
        return trades.filter(trade => {
          const tradeDate = new Date(trade.trade_date);
          return tradeDate >= customStart && tradeDate <= customEnd;
        });
      default:
        return trades;
    }

    return trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      return tradeDate >= startDate && tradeDate <= endDate;
    });
  };

  const filteredTrades = getFilteredTrades();
  const totalPnL = filteredTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const wins = filteredTrades.filter(t => (t.pnl || 0) > 0).length;
  const losses = filteredTrades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";
  const avgWin = wins > 0 ? filteredTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + Number(t.pnl), 0) / wins : 0;
  const avgLoss = losses > 0 ? filteredTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + Number(t.pnl), 0) / losses : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  // Generate equity curve data
  const getEquityCurve = () => {
    if (filteredTrades.length === 0) {
      return [{ date: "No data", pnl: 0 }];
    }

    let cumulativePnL = 0;
    const sortedTrades = [...filteredTrades].sort((a, b) => 
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    return sortedTrades.map((trade) => {
      cumulativePnL += Number(trade.pnl || 0);
      const dateFormat = period === "yearly" ? "MMM yyyy" : period === "monthly" ? "MMM dd" : "MMM dd";
      return {
        date: format(new Date(trade.trade_date), dateFormat),
        pnl: Number(cumulativePnL.toFixed(2)),
      };
    });
  };

  const equityCurve = getEquityCurve();

  // Win/Loss distribution data - filter out zero values
  const winLossData = [
    { name: "Wins", value: wins, color: "hsl(var(--success))" },
    { name: "Losses", value: losses, color: "hsl(var(--destructive))" },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analysis</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={period === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </Button>
          <Button
            variant={period === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={period === "yearly" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("yearly")}
          >
            Yearly
          </Button>
          <Button
            variant={period === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("custom")}
          >
            Custom
          </Button>
        </div>

        {period === "custom" && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {customStartDate ? format(customStartDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {customEndDate ? format(customEndDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Total P&L</p>
            <p className={`text-lg md:text-2xl font-bold ${totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Win Rate</p>
            <p className="text-lg md:text-2xl font-bold">{winRate}%</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Total Trades</p>
            <p className="text-lg md:text-2xl font-bold">{filteredTrades.length}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Wins / Losses</p>
            <p className="text-lg md:text-2xl font-bold">
              <span className="text-success">{wins}</span> / <span className="text-destructive">{losses}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Avg Win</p>
            <p className="text-lg md:text-2xl font-bold text-success">${avgWin.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Avg Loss</p>
            <p className="text-lg md:text-2xl font-bold text-destructive">${avgLoss.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Profit Factor</p>
            <p className="text-lg md:text-2xl font-bold">{profitFactor.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground">Best Trade</p>
            <p className="text-lg md:text-2xl font-bold text-success">
              ${filteredTrades.length > 0 ? Math.max(...filteredTrades.map(t => Number(t.pnl) || 0), 0).toFixed(2) : "0.00"}
            </p>
          </div>
        </div>

        {filteredTrades.length === 0 ? (
          <div className="mt-6 text-center py-12 text-muted-foreground">
            No trades found for the selected period
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Equity Curve */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Win/Loss Distribution */}
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4">Win/Loss Distribution</h3>
            {winLossData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
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
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No trades to display
              </div>
            )}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceAnalysis;
