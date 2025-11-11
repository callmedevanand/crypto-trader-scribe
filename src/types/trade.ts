export interface Trade {
  id: string;
  user_id: string;
  asset_pair: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  strategy_tag: string | null;
  exchange: string | null;
  notes: string | null;
  fees: number | null;
  trade_date: string;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
