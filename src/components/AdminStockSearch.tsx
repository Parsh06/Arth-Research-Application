import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface StockResult {
  symbol: string;
  shortname: string;
  exchDisp: string;
  typeDisp: string;
  exchange?: string;
}

interface AdminStockSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (stock: { symbol: string; companyName: string }) => void;
}

export default function AdminStockSearch({ value = '', onChange, onSelect }: AdminStockSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<StockResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStocks = async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data && data.quotes) {
          const filtered = data.quotes.filter((q: any) => 
            q.exchange === 'BSE' || q.exchange === 'NSI' || 
            (q.symbol && (q.symbol.endsWith('.BO') || q.symbol.endsWith('.NS')))
          );
          setResults(filtered.slice(0, 10));
        }
      } catch (error) {
        console.error("Error fetching stocks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchStocks();
    }, 400);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    if (onChange) onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (stock: StockResult) => {
    const finalSymbol = stock.symbol; 
    setQuery(finalSymbol);
    if (onChange) onChange(finalSymbol);
    if (onSelect) {
      onSelect({ symbol: finalSymbol, companyName: stock.shortname || stock.symbol });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Type NSE stock ticker (e.g. RELIANCE, INFY)..."
          className="w-full bg-card border border-border rounded-md py-2 pl-9 pr-3 text-xs font-mono font-medium text-foreground uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-xl max-h-60 overflow-y-auto divide-y divide-border">
          {results.map((stock, i) => (
            <div
              key={`${stock.symbol}-${i}`}
              onClick={() => handleSelect(stock)}
              className="p-2.5 hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold font-mono text-xs text-foreground">{stock.symbol}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {stock.exchDisp || stock.exchange}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                {stock.shortname || 'Listed Entity'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md p-3 text-center text-xs font-mono text-muted-foreground shadow-xl">
          No matching Indian equities found.
        </div>
      )}
    </div>
  );
}
