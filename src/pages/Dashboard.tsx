import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TrendingUp, LogOut, FileText, Wallet, BarChart3, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import DashboardStats from "@/components/dashboard/DashboardStats";
import TradesList from "@/components/trades/TradesList";
import AddTradeDialog from "@/components/trades/AddTradeDialog";
import PortfolioView from "@/components/portfolio/PortfolioView";
import AnalyticsCharts from "@/components/analytics/AnalyticsCharts";
import CalendarView from "@/components/analytics/CalendarView";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "trades" | "portfolio" | "calendar">("overview");
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">CryptoJournal</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            <Button
              variant={activeTab === "overview" ? "secondary" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === "trades" ? "secondary" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={activeTab === "trades"}
              onClick={() => setActiveTab("trades")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Trades
            </Button>
            <Button
              variant={activeTab === "portfolio" ? "secondary" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={activeTab === "portfolio"}
              onClick={() => setActiveTab("portfolio")}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Portfolio
            </Button>
            <Button
              variant={activeTab === "calendar" ? "secondary" : "ghost"}
              className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
              data-active={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Dashboard Overview</h2>
              <Button onClick={() => setShowAddTrade(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </div>
            <DashboardStats userId={user?.id} />
            <div>
              <h3 className="text-2xl font-bold mb-4">Performance Analytics</h3>
              <AnalyticsCharts userId={user?.id} />
            </div>
          </div>
        )}

        {activeTab === "trades" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Trade Journal</h2>
              <Button onClick={() => setShowAddTrade(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </div>
            <TradesList userId={user?.id} onEditTrade={handleEditTrade} />
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Portfolio</h2>
            <PortfolioView userId={user?.id} />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Trading Calendar</h2>
            <CalendarView userId={user?.id} />
          </div>
        )}
      </main>

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
