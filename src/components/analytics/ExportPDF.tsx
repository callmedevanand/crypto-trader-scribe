import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Trade } from "@/types/trade";

interface ExportPDFProps {
  userId: string;
  trades: Trade[];
  period: "total" | "custom";
  customStartDate?: Date;
  customEndDate?: Date;
}

const ExportPDF = ({ trades, period, customStartDate, customEndDate }: ExportPDFProps) => {
  const handleExport = async () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("Trading P&L Report", 14, 20);
      
      // Website link
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.textWithLink("https://crypto-trader-scribe.lovable.app", 14, 28, { url: "https://crypto-trader-scribe.lovable.app" });
      doc.setTextColor(0, 0, 0);
      
      // Period info
      let periodText = "Period: All Trades (Total)";
      if (period === "custom" && customStartDate && customEndDate) {
        periodText = `Period: ${customStartDate.toLocaleDateString()} - ${customEndDate.toLocaleDateString()}`;
      }
      doc.setFontSize(11);
      doc.text(periodText, 14, 38);
      
      // Summary stats
      const totalPnL = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
      const wins = trades.filter(t => (t.pnl || 0) > 0).length;
      const losses = trades.filter(t => (t.pnl || 0) < 0).length;
      const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";
      
      doc.setFontSize(12);
      doc.text(`Total P&L: $${totalPnL.toFixed(2)}`, 14, 48);
      doc.text(`Total Trades: ${trades.length}`, 14, 55);
      doc.text(`Win Rate: ${winRate}%`, 14, 62);
      doc.text(`Wins: ${wins} | Losses: ${losses}`, 14, 69);
      
      // Trade details table
      const tableData = trades.map(trade => [
        trade.asset_pair,
        trade.trade_type,
        `$${Number(trade.entry_price).toFixed(2)}`,
        trade.exit_price ? `$${Number(trade.exit_price).toFixed(2)}` : "-",
        trade.pnl ? `$${Number(trade.pnl).toFixed(2)}` : "-",
        trade.strategy_tag || "-",
        new Date(trade.trade_date).toLocaleDateString(),
      ]);
      
      autoTable(doc, {
        head: [["Asset", "Type", "Entry", "Exit", "P&L", "Strategy", "Date"]],
        body: tableData,
        startY: 78,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
      });
      
      // Save PDF
      doc.save(`trading-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <FileDown className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
};

export default ExportPDF;
