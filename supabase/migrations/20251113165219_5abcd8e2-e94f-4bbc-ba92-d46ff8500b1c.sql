-- Add length constraints and validation checks to trades table
-- Note: exit_price can be negative as it's used to store P&L calculation in the current implementation
ALTER TABLE public.trades
ADD CONSTRAINT check_asset_pair_length CHECK (char_length(asset_pair) <= 50 AND char_length(asset_pair) >= 3),
ADD CONSTRAINT check_asset_pair_format CHECK (asset_pair ~ '^[A-Z0-9]+/[A-Z0-9]+$'),
ADD CONSTRAINT check_strategy_tag_length CHECK (strategy_tag IS NULL OR char_length(strategy_tag) <= 100),
ADD CONSTRAINT check_notes_length CHECK (notes IS NULL OR char_length(notes) <= 10000),
ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT check_entry_price_positive CHECK (entry_price > 0),
ADD CONSTRAINT check_fees_non_negative CHECK (fees IS NULL OR fees >= 0);