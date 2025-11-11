import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

interface ExportPDFProps {
  userId: string;
  trades: any[];
  chartsRef?: React.RefObject<HTMLDivElement>;
}

const ExportPDF = ({ trades, chartsRef }: ExportPDFProps) => {
  const handleExport = async () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text("Trading P&L Report", 14, 20);
      
      // Summary stats
      const totalPnL = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
      const wins = trades.filter(t => (t.pnl || 0) > 0).length;
      const losses = trades.filter(t => (t.pnl || 0) < 0).length;
      const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0";
      
      doc.setFontSize(12);
      doc.text(`Total P&L: $${totalPnL.toFixed(2)}`, 14, 35);
      doc.text(`Total Trades: ${trades.length}`, 14, 42);
      doc.text(`Win Rate: ${winRate}%`, 14, 49);
      doc.text(`Wins: ${wins} | Losses: ${losses}`, 14, 56);
      
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
        startY: 65,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
      });

      // Add charts if reference is provided
      if (chartsRef?.current) {
        const charts = chartsRef.current;
        const canvas = await html2canvas(charts, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add new page for charts
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Performance Analytics", 14, 15);
        doc.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);
      }
      
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
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
};

export default ExportPDF;
