import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  notes: string | null;
}

interface AddTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editTrade?: Trade | null;
}

const AddTradeDialog = ({ open, onOpenChange, userId, editTrade }: AddTradeDialogProps) => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    asset_pair: "",
    position: "long" as "long" | "short",
    result: "win" as "win" | "loss",
    amount: "",
    strategy_tag: "",
    notes: "",
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (editTrade) {
      const pnl = editTrade.pnl || 0;
      setFormData({
        asset_pair: editTrade.asset_pair,
        position: editTrade.trade_type as "long" | "short",
        result: pnl >= 0 ? "win" : "loss",
        amount: Math.abs(pnl).toString(),
        strategy_tag: editTrade.strategy_tag || "",
        notes: editTrade.notes || "",
      });
    } else {
      setFormData({
        asset_pair: "",
        position: "long",
        result: "win",
        amount: "",
        strategy_tag: "",
        notes: "",
      });
    }
  }, [editTrade, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(formData.amount);
    const pnl = formData.result === "win" ? amount : -amount;
    
    // Use dummy values for entry/exit
    const entryPrice = 100;
    const exitPrice = formData.result === "win" ? entryPrice + amount : entryPrice - amount;

    const tradeData = {
      user_id: userId,
      asset_pair: formData.asset_pair,
      trade_type: formData.position,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity: 1,
      fees: 0,
      exchange: null,
      notes: formData.notes || null,
      strategy_tag: formData.strategy_tag || null,
      status: "closed",
      pnl: pnl,
    };

    let error;
    if (editTrade) {
      // Update existing trade
      const { error: updateError } = await supabase
        .from("trades")
        .update(tradeData)
        .eq("id", editTrade.id);
      error = updateError;
    } else {
      // Insert new trade
      const { error: insertError } = await supabase.from("trades").insert(tradeData);
      error = insertError;
    }

    if (error) {
      toast.error(`Failed to ${editTrade ? "update" : "add"} trade: ` + error.message);
    } else {
      toast.success(`Trade ${editTrade ? "updated" : "added"} successfully!`);
      onOpenChange(false);
      setFormData({
        asset_pair: "",
        position: "long",
        result: "win",
        amount: "",
        strategy_tag: "",
        notes: "",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTrade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset_pair">Asset Pair *</Label>
            <Input
              id="asset_pair"
              placeholder="BTC/USDT"
              value={formData.asset_pair}
              onChange={(e) => setFormData({ ...formData, asset_pair: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Select
              value={formData.position}
              onValueChange={(value: "long" | "short") =>
                setFormData({ ...formData, position: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="result">Result *</Label>
            <Select
              value={formData.result}
              onValueChange={(value: "win" | "loss") =>
                setFormData({ ...formData, result: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="win">Win ✓</SelectItem>
                <SelectItem value="loss">Loss ✗</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="100.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy_tag">Strategy</Label>
            <Input
              id="strategy_tag"
              placeholder="Scalping, Swing..."
              value={formData.strategy_tag}
              onChange={(e) => setFormData({ ...formData, strategy_tag: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Trade notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (editTrade ? "Updating..." : "Adding...") : (editTrade ? "Update Trade" : "Add Trade")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTradeDialog;
