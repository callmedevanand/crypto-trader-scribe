import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Trade } from "@/types/trade";

interface CalendarViewProps {
  userId: string;
}

const CalendarView = ({ userId }: CalendarViewProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTrades();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, currentDate, view]);

  const fetchTrades = async () => {
    setLoading(true);
    const start = view === "month" 
      ? startOfMonth(currentDate)
      : startOfWeek(currentDate);
    const end = view === "month"
      ? endOfMonth(currentDate)
      : endOfWeek(currentDate);

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .gte("trade_date", start.toISOString())
      .lte("trade_date", end.toISOString());

    if (!error) {
      setTrades(data || []);
    }
    setLoading(false);
  };

  const getDaysInView = () => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const getTradesForDay = (day: Date) => {
    return trades.filter(trade => 
      isSameDay(new Date(trade.trade_date), day)
    );
  };

  const getDayPnL = (day: Date) => {
    const dayTrades = getTradesForDay(day);
    return dayTrades.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);
  };

  const handlePrevious = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const days = getDaysInView();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-lg md:text-xl">Trading Calendar</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("month")}
              className="flex-1 sm:flex-none"
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("week")}
              className="flex-1 sm:flex-none"
            >
              Week
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm md:text-lg font-semibold text-center">
            {format(currentDate, view === "month" ? "MMMM yyyy" : "'Week of' MMM dd, yyyy")}
          </h3>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-xs md:text-sm text-muted-foreground py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((day, index) => {
              const dayTrades = getTradesForDay(day);
              const dayPnL = getDayPnL(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-16 md:min-h-24 p-1 md:p-2 border rounded transition-colors
                    ${isCurrentMonth ? "bg-card" : "bg-muted/30"}
                    ${isToday ? "border-primary border-2 shadow-sm" : "border-border"}
                    ${dayTrades.length > 0 ? "cursor-pointer hover:border-primary/50" : ""}
                  `}
                >
                  <div className="text-xs md:text-sm font-medium mb-1">
                    {format(day, "d")}
                  </div>
                  {dayTrades.length > 0 && (
                    <div className="space-y-0.5 md:space-y-1">
                      <div className={`text-[10px] md:text-xs font-semibold ${dayPnL >= 0 ? "text-success" : "text-destructive"}`}>
                        {dayPnL >= 0 ? "+" : ""}${Math.abs(dayPnL).toFixed(0)}
                      </div>
                      <div className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                        {dayTrades.length} trade{dayTrades.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarView;
