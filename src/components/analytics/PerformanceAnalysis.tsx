import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Trade } from "@/types/trade";

interface PerformanceAnalysisProps {
  trades: Trade[];
}

type TimePeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const PerformanceAnalysis = ({ trades }: PerformanceAnalysisProps) => {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const getFilteredTrades = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        if (!customStartDate || !customEndDate) return trades;
        return trades.filter(trade => {
          const tradeDate = new Date(trade.trade_date);
          return tradeDate >= customStartDate && tradeDate <= customEndDate;
        });
      default:
        return trades;
    }

    return trades.filter(trade => new Date(trade.trade_date) >= startDate);
  };

  const filteredTrades = getFilteredTrades();
  const totalPnL = filteredTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  const wins = filteredTrades.filter(t => (t.pnl || 0) > 0).length;
  const losses = filteredTrades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";
  const avgWin = wins > 0 ? filteredTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + Number(t.pnl), 0) / wins : 0;
  const avgLoss = losses > 0 ? filteredTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + Number(t.pnl), 0) / losses : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analysis</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={period === "daily" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("daily")}
          >
            Daily
          </Button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{winRate}%</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-2xl font-bold">{filteredTrades.length}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Wins / Losses</p>
            <p className="text-2xl font-bold">
              <span className="text-success">{wins}</span> / <span className="text-destructive">{losses}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Win</p>
            <p className="text-2xl font-bold text-success">${avgWin.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Loss</p>
            <p className="text-2xl font-bold text-destructive">${avgLoss.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Profit Factor</p>
            <p className="text-2xl font-bold">{profitFactor.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Best Trade</p>
            <p className="text-2xl font-bold text-success">
              ${Math.max(...filteredTrades.map(t => Number(t.pnl) || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceAnalysis;
