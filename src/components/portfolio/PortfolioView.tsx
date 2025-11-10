import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Portfolio {
  id: string;
  asset: string;
  quantity: number;
  avg_entry_price: number;
}

interface PortfolioViewProps {
  userId: string;
}

const PortfolioView = ({ userId }: PortfolioViewProps) => {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from("portfolio")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching portfolio:", error);
      } else {
        setPortfolio(data || []);
      }
      setLoading(false);
    };

    fetchPortfolio();

    const channel = supabase
      .channel("portfolio-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "portfolio",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchPortfolio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No portfolio holdings yet. Your holdings will appear here once you add trades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {portfolio.map((holding) => (
        <Card key={holding.id} className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{holding.asset}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <span className="font-medium">{Number(holding.quantity).toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Entry:</span>
              <span className="font-medium">${Number(holding.avg_entry_price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Total Cost:</span>
              <span className="font-bold">
                ${(Number(holding.quantity) * Number(holding.avg_entry_price)).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PortfolioView;
