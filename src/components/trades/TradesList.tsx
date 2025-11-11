import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Pencil, Trash2, FileText, Image } from "lucide-react";
import { toast } from "sonner";
import { Trade } from "@/types/trade";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TradesListProps {
  userId: string;
  onEditTrade?: (trade: Trade) => void;
}

const TradesList = ({ userId, onEditTrade }: TradesListProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

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

  const showDetails = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return <div className="space-y-3 md:space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-5 md:h-6 bg-muted rounded w-32 md:w-48"></div>
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
          <p className="text-sm md:text-base text-muted-foreground">No trades yet. Add your first trade to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 md:space-y-4">
        {trades.map((trade) => (
          <Card key={trade.id} className="hover:border-primary/50 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base md:text-lg font-semibold flex flex-wrap items-center gap-2">
                  <span className="text-primary">{trade.asset_pair}</span>
                  <Badge variant={trade.trade_type === "long" ? "default" : "secondary"} className="text-xs">
                    {trade.trade_type.toUpperCase()}
                  </Badge>
                  <Badge variant={trade.status === "closed" ? "outline" : "default"} className="text-xs">
                    {trade.status}
                  </Badge>
                </CardTitle>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  {trade.pnl !== null && (
                    <span className={`text-lg md:text-xl font-bold ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {trade.pnl >= 0 ? "+" : ""}${Number(trade.pnl).toFixed(2)}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {onEditTrade && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTrade(trade)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(trade.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
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
                {trade.strategy_tag && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Strategy:</span>
                    <div className="font-medium">{trade.strategy_tag}</div>
                  </div>
                )}
              </div>
              
              {(trade.notes || trade.image_url) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {trade.notes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showDetails(trade)}
                      className="text-xs"
                    >
                      <FileText className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      View Notes
                    </Button>
                  )}
                  {trade.image_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showDetails(trade)}
                      className="text-xs"
                    >
                      <Image className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                      View Screenshot
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trade Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTrade?.asset_pair} - Trade Details</DialogTitle>
          </DialogHeader>
          
          {selectedTrade && (
            <div className="space-y-4">
              {selectedTrade.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes:</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {selectedTrade.notes}
                  </p>
                </div>
              )}
              
              {selectedTrade.image_url && (
                <div>
                  <h3 className="font-semibold mb-2">Screenshot:</h3>
                  <img
                    src={selectedTrade.image_url}
                    alt="Trade screenshot"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
