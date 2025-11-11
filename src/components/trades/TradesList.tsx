import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Trade {
  id: string;
  asset_pair: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  status: string;
  trade_date: string;
  strategy_tag: string | null;
  exchange: string | null;
}

interface TradesListProps {
  userId: string;
  onEditTrade?: (trade: Trade) => void;
}

const TradesList = ({ userId, onEditTrade }: TradesListProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("trade_date", { ascending: false });

      if (error) {
        console.error("Error fetching trades:", error);
      } else {
        setTrades(data || []);
      }
      setLoading(false);
    };

    fetchTrades();

    const channel = supabase
      .channel("trades-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trades",
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
  }, [userId]);

  const handleDeleteClick = (tradeId: string) => {
    setTradeToDelete(tradeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tradeToDelete) return;

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", tradeToDelete);

    if (error) {
      toast.error("Failed to delete trade: " + error.message);
    } else {
      toast.success("Trade deleted successfully");
    }

    setDeleteDialogOpen(false);
    setTradeToDelete(null);
  };

  if (loading) {
    return <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-muted rounded w-full"></div>
          </CardContent>
        </Card>
      ))}
    </div>;
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No trades yet. Add your first trade to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {trades.map((trade) => (
          <Card key={trade.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  {trade.asset_pair}
                  <Badge variant={trade.trade_type === "long" ? "default" : "secondary"}>
                    {trade.trade_type}
                  </Badge>
                  <Badge variant={trade.status === "closed" ? "outline" : "default"}>
                    {trade.status}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {trade.pnl !== null && (
                    <span className={`text-lg font-bold ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {trade.pnl >= 0 ? "+" : ""}${Number(trade.pnl).toFixed(2)}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {onEditTrade && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTrade(trade)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(trade.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entry:</span>
                  <div className="font-medium">${Number(trade.entry_price).toFixed(2)}</div>
                </div>
                {trade.exit_price && (
                  <div>
                    <span className="text-muted-foreground">Exit:</span>
                    <div className="font-medium">${Number(trade.exit_price).toFixed(2)}</div>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <div className="font-medium">{Number(trade.quantity).toFixed(4)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-medium">{format(new Date(trade.trade_date), "MMM dd, yyyy")}</div>
                </div>
                {trade.exchange && (
                  <div>
                    <span className="text-muted-foreground">Exchange:</span>
                    <div className="font-medium">{trade.exchange}</div>
                  </div>
                )}
                {trade.strategy_tag && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Strategy:</span>
                    <div className="font-medium">{trade.strategy_tag}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TradesList;
