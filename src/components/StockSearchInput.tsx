import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, Check, X, Building2 } from 'lucide-react';

export interface BseStockSelection {
  symbol: string;
  companyName: string;
  scripCode: string;
  isin?: string;
  type?: string;
}

interface StockSearchInputProps {
  value?: string;
  placeholder?: string;
  className?: string;
  onSelect: (stock: BseStockSelection) => void;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  usePortal?: boolean;
}

export default function StockSearchInput({
  value = '',
  placeholder = 'Search BSE company or ticker (e.g. TATA, INFY, NAVA, 513023)...',
  className = '',
  onSelect,
  onChange,
  disabled = false,
  autoFocus = false,
  usePortal = false
}: StockSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<BseStockSelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [portalPosition, setPortalPosition] = useState({ top: 0, left: 0, width: 320 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const updatePortalCoords = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPortalPosition({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 360) - 8)),
      width: Math.max(rect.width, 360)
    });
  }, []);

  useEffect(() => {
    if (isOpen && usePortal) {
      updatePortalCoords();
      window.addEventListener('resize', updatePortalCoords);
      window.addEventListener('scroll', updatePortalCoords, true);
      return () => {
        window.removeEventListener('resize', updatePortalCoords);
        window.removeEventListener('scroll', updatePortalCoords, true);
      };
    }
  }, [isOpen, usePortal, updatePortalCoords]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error('Search failed');
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setResults(json.data);
          setActiveIndex(0);
        } else {
          setResults([]);
          setActiveIndex(-1);
        }
      } catch (err) {
        console.error('BSE stock search error:', err);
        setResults([]);
        setActiveIndex(-1);
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (stock: BseStockSelection) => {
    setQuery(stock.symbol);
    if (onChange) onChange(stock.symbol);
    onSelect(stock);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onChange) onChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    const content = (
      <div
        ref={dropdownRef}
        style={usePortal ? {
          position: 'fixed',
          top: `${portalPosition.top}px`,
          left: `${portalPosition.left}px`,
          width: `${portalPosition.width}px`,
          zIndex: 9999
        } : undefined}
        className={usePortal ? 
          "bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl max-h-72 overflow-y-auto divide-y divide-border/40 animate-in fade-in zoom-in-95 duration-100" :
          "absolute z-50 left-0 right-0 mt-1 bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl max-h-72 overflow-y-auto divide-y divide-border/40 animate-in fade-in duration-100"
        }
      >
        {results.length > 0 ? (
          <div>
            <div className="px-3 py-1.5 bg-muted/40 text-[10px] font-mono text-muted-foreground flex items-center justify-between border-b border-border/40">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-primary" /> BSE India Directory ({results.length} results)
              </span>
              <span>Use ↑↓ keys + Enter</span>
            </div>
            {results.map((stock, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <div
                  key={`${stock.scripCode}-${stock.symbol}-${idx}`}
                  onClick={() => handleSelect(stock)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between gap-3 group ${
                    isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-xs text-foreground group-hover:text-primary transition-colors">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                        BSE: {stock.scripCode}
                      </span>
                      {stock.type && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground hidden sm:inline">
                          {stock.type.replace('in ', '')}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {stock.companyName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {stock.isin && (
                      <span className="text-[9px] font-mono text-muted-foreground/80 block">
                        {stock.isin}
                      </span>
                    )}
                    <span className={`text-[10px] font-mono text-primary flex items-center justify-end gap-1 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity`}>
                      <Check className="w-3 h-3" /> Select
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : query.trim().length >= 2 && !isLoading ? (
          <div className="p-3 text-center text-xs font-mono text-muted-foreground">
            No matching BSE listed securities found for &quot;{query}&quot;.
          </div>
        ) : null}
      </div>
    );

    return usePortal ? createPortal(content, document.body) : content;
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setIsOpen(true);
              if (usePortal) updatePortalCoords();
            }
          }}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full bg-card/80 backdrop-blur-xs border border-border rounded-md py-2 pl-9 pr-8 text-xs font-mono font-medium text-foreground placeholder:normal-case placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
        </div>
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground/60 hover:text-foreground cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {renderDropdown()}
    </div>
  );
}
