import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const AddTradeDialog = ({ open, onOpenChange, userId }: AddTradeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  
  // Simple mode data
  const [simpleData, setSimpleData] = useState({
    asset_pair: "",
    result: "win" as "win" | "loss",
    amount: "",
    exchange: "",
    strategy_tag: "",
  });

  // Advanced mode data
  const [formData, setFormData] = useState({
    asset_pair: "",
    trade_type: "long" as "long" | "short",
    entry_price: "",
    exit_price: "",
    quantity: "",
    fees: "0",
    exchange: "",
    notes: "",
    strategy_tag: "",
    status: "open" as "open" | "closed",
  });

  const handleSimpleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(simpleData.amount);
    const pnl = simpleData.result === "win" ? amount : -amount;
    
    // For simple mode, we'll use dummy values for entry/exit
    const entryPrice = 100;
    const exitPrice = simpleData.result === "win" ? entryPrice + amount : entryPrice - amount;

    const { error } = await supabase.from("trades").insert({
      user_id: userId,
      asset_pair: simpleData.asset_pair,
      trade_type: "long",
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity: 1,
      fees: 0,
      exchange: simpleData.exchange || null,
      notes: null,
      strategy_tag: simpleData.strategy_tag || null,
      status: "closed",
      pnl: pnl,
    });

    if (error) {
      toast.error("Failed to add trade: " + error.message);
    } else {
      toast.success("Trade added successfully!");
      onOpenChange(false);
      setSimpleData({
        asset_pair: "",
        result: "win",
        amount: "",
        exchange: "",
        strategy_tag: "",
      });
    }

    setLoading(false);
  };

  const handleAdvancedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const entryPrice = parseFloat(formData.entry_price);
    const exitPrice = formData.exit_price ? parseFloat(formData.exit_price) : null;
    const quantity = parseFloat(formData.quantity);
    const fees = parseFloat(formData.fees);

    let pnl = null;
    if (exitPrice && formData.status === "closed") {
      if (formData.trade_type === "long") {
        pnl = (exitPrice - entryPrice) * quantity - fees;
      } else {
        pnl = (entryPrice - exitPrice) * quantity - fees;
      }
    }

    const { error } = await supabase.from("trades").insert({
      user_id: userId,
      asset_pair: formData.asset_pair,
      trade_type: formData.trade_type,
      entry_price: entryPrice,
      exit_price: exitPrice,
      quantity: quantity,
      fees: fees,
      exchange: formData.exchange || null,
      notes: formData.notes || null,
      strategy_tag: formData.strategy_tag || null,
      status: formData.status,
      pnl: pnl,
    });

    if (error) {
      toast.error("Failed to add trade: " + error.message);
    } else {
      toast.success("Trade added successfully!");
      onOpenChange(false);
      setFormData({
        asset_pair: "",
        trade_type: "long",
        entry_price: "",
        exit_price: "",
        quantity: "",
        fees: "0",
        exchange: "",
        notes: "",
        strategy_tag: "",
        status: "open",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Trade</DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "simple" | "advanced")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Quick Add</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Simple Mode */}
          <TabsContent value="simple">
            <form onSubmit={handleSimpleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="simple-asset">Asset Pair *</Label>
                <Input
                  id="simple-asset"
                  placeholder="BTC/USDT"
                  value={simpleData.asset_pair}
                  onChange={(e) => setSimpleData({ ...simpleData, asset_pair: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="result">Result *</Label>
                <Select
                  value={simpleData.result}
                  onValueChange={(value: "win" | "loss") =>
                    setSimpleData({ ...simpleData, result: value })
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
                  value={simpleData.amount}
                  onChange={(e) => setSimpleData({ ...simpleData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="simple-exchange">Exchange</Label>
                  <Input
                    id="simple-exchange"
                    placeholder="Binance, Coinbase..."
                    value={simpleData.exchange}
                    onChange={(e) => setSimpleData({ ...simpleData, exchange: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="simple-strategy">Strategy</Label>
                  <Input
                    id="simple-strategy"
                    placeholder="Scalping, Swing..."
                    value={simpleData.strategy_tag}
                    onChange={(e) => setSimpleData({ ...simpleData, strategy_tag: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding Trade..." : "Add Trade"}
              </Button>
            </form>
          </TabsContent>

          {/* Advanced Mode */}
          <TabsContent value="advanced">
            <form onSubmit={handleAdvancedSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="trade_type">Type *</Label>
              <Select
                value={formData.trade_type}
                onValueChange={(value: "long" | "short") =>
                  setFormData({ ...formData, trade_type: value })
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_price">Entry Price *</Label>
              <Input
                id="entry_price"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.entry_price}
                onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exit_price">Exit Price</Label>
              <Input
                id="exit_price"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.exit_price}
                onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fees">Fees</Label>
              <Input
                id="fees"
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "open" | "closed") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exchange">Exchange</Label>
              <Input
                id="exchange"
                placeholder="Binance, Coinbase, etc."
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strategy_tag">Strategy Tag</Label>
              <Input
                id="strategy_tag"
                placeholder="Trend Following, Mean Reversion, etc."
                value={formData.strategy_tag}
                onChange={(e) => setFormData({ ...formData, strategy_tag: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Trade notes, entry reasoning, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding Trade..." : "Add Trade"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddTradeDialog;
