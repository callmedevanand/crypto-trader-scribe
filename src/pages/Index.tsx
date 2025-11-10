import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, FileText, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(28, 37, 54, 0.85), rgba(28, 37, 54, 0.85)), url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Professional Crypto Trading Journal</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Master Your
              <span className="text-primary"> Crypto Trading</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Track trades, analyze performance, and optimize your strategy with comprehensive analytics and portfolio insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="text-lg px-8 py-6"
                onClick={() => navigate("/auth")}
              >
                Start Trading Journal
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground">Powerful tools for serious crypto traders</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20">
              <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Trade Journal</h3>
              <p className="text-muted-foreground">
                Log every trade with detailed information including entry/exit prices, strategy tags, and personal notes. Build a complete trading history.
              </p>
            </div>

            <div className="group p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20">
              <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Performance Analytics</h3>
              <p className="text-muted-foreground">
                Track win rate, P&L, average profit per trade, and identify which strategies work best. Make data-driven decisions.
              </p>
            </div>

            <div className="group p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20">
              <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your trading data is encrypted and secure. Each user has their own private workspace with complete data isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Level Up Your Trading?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join traders who are mastering their craft with comprehensive journaling and analytics.
            </p>
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
            <span>CryptoJournal © 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
