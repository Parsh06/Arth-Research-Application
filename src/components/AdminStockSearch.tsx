import StockSearchInput, { type BseStockSelection } from './StockSearchInput';

export interface AdminStockSearchResult {
  symbol: string;
  companyName: string;
  scripCode?: string;
  isin?: string;
}

interface AdminStockSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (stock: AdminStockSearchResult) => void;
  placeholder?: string;
}

export default function AdminStockSearch({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Type BSE stock ticker or name (e.g. NAVA, RELIANCE, 513023)...'
}: AdminStockSearchProps) {
  const handleSelect = (stock: BseStockSelection) => {
    if (onSelect) {
      onSelect({
        symbol: stock.symbol,
        companyName: stock.companyName,
        scripCode: stock.scripCode,
        isin: stock.isin
      });
    }
  };

  return (
    <StockSearchInput
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      placeholder={placeholder}
    />
  );
}
