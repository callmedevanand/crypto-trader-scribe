import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TrendingUp, LogOut, FileText, BarChart3, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import DashboardStats from "@/components/dashboard/DashboardStats";
import TradesList from "@/components/trades/TradesList";
import AddTradeDialog from "@/components/trades/AddTradeDialog";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import CalendarView from "@/components/analytics/CalendarView";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "trades" | "calendar">("overview");
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [editingTrade, setEditingTrade] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const handleEditTrade = (trade: any) => {
    setEditingTrade(trade);
    setShowAddTrade(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setShowAddTrade(open);
    if (!open) {
      setEditingTrade(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <h1 className="text-lg md:text-xl font-bold">CRX J</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline truncate max-w-[120px] md:max-w-none">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-2 md:px-4">
          <nav className="flex gap-0.5 md:gap-1 overflow-x-auto">
            <Button
              variant={activeTab === "overview" ? "secondary" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
              data-active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              size="sm"
            >
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </Button>
            <Button
              variant={activeTab === "trades" ? "secondary" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
              data-active={activeTab === "trades"}
              onClick={() => setActiveTab("trades")}
              size="sm"
            >
              <FileText className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Trades</span>
            </Button>
            <Button
              variant={activeTab === "calendar" ? "secondary" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary whitespace-nowrap text-xs md:text-sm px-3 md:px-4"
              data-active={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
              size="sm"
            >
              <Calendar className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {activeTab === "overview" && (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">Dashboard Overview</h2>
              <Button onClick={() => setShowAddTrade(true)} size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </div>
            <DashboardStats userId={user?.id} />
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-4">Performance Analytics</h3>
              <AnalyticsCharts userId={user?.id} />
            </div>
          </div>
        )}

        {activeTab === "trades" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">Trade Journal</h2>
              <Button onClick={() => setShowAddTrade(true)} size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </div>
            <TradesList userId={user?.id} onEditTrade={handleEditTrade} />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">Trading Calendar</h2>
            <CalendarView userId={user?.id} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold text-foreground">CRX J</span>
            </div>
            <p className="text-sm text-center">
              Created by{" "}
              <a
                href="https://www.instagram.com/wolf_chain_x/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
              >
                Devanand M
              </a>
            </p>
            <span className="text-xs">© 2025 All rights reserved</span>
          </div>
        </div>
      </footer>

      <AddTradeDialog
        open={showAddTrade}
        onOpenChange={handleCloseDialog}
        userId={user?.id}
        editTrade={editingTrade}
      />
    </div>
  );
};

export default Dashboard;
