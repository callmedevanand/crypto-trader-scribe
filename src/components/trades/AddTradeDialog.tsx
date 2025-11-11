import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";
import { Trade } from "@/types/trade";

interface AddTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  editTrade?: Trade | null;
}

const AddTradeDialog = ({ open, onOpenChange, userId, editTrade }: AddTradeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
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
      if (editTrade.image_url) {
        setImagePreview(editTrade.image_url);
      }
    } else {
      setFormData({
        asset_pair: "",
        position: "long",
        result: "win",
        amount: "",
        strategy_tag: "",
        notes: "",
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editTrade, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("trade-images")
      .upload(fileName, imageFile);

    if (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("trade-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = editTrade?.image_url || null;

    // Upload new image if selected
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    } else if (!imagePreview && editTrade?.image_url) {
      // Image was removed
      imageUrl = null;
    }

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
      image_url: imageUrl,
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
      setImageFile(null);
      setImagePreview(null);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">{editTrade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset_pair" className="text-sm">Asset Pair *</Label>
            <Input
              id="asset_pair"
              placeholder="BTC/USDT"
              value={formData.asset_pair}
              onChange={(e) => setFormData({ ...formData, asset_pair: e.target.value })}
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm">Position *</Label>
            <Select
              value={formData.position}
              onValueChange={(value: "long" | "short") =>
                setFormData({ ...formData, position: value })
              }
            >
              <SelectTrigger className="text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="result" className="text-sm">Result *</Label>
            <Select
              value={formData.result}
              onValueChange={(value: "win" | "loss") =>
                setFormData({ ...formData, result: value })
              }
            >
              <SelectTrigger className="text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="win">Win ✓</SelectItem>
                <SelectItem value="loss">Loss ✗</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm">Amount ($) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="100.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy_tag" className="text-sm">Strategy</Label>
            <Input
              id="strategy_tag"
              placeholder="Scalping, Swing..."
              value={formData.strategy_tag}
              onChange={(e) => setFormData({ ...formData, strategy_tag: e.target.value })}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Detailed trade analysis, market conditions, lessons learned..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="text-base resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm">Screenshot/Image (Optional)</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Trade screenshot"
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Max 5MB
                  </span>
                </label>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? (editTrade ? "Updating..." : "Adding...") : (editTrade ? "Update Trade" : "Add Trade")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTradeDialog;
