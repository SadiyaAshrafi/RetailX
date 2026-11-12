"use client";

import { Search, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type Product } from "@/lib/api";

export function SearchBox({ large = false, initialValue = "" }: { large?: boolean; initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = window.setTimeout(() => {
      void api<{ suggestions: Product[] }>(`/suggest?q=${encodeURIComponent(value.trim())}`)
        .then((result) => setSuggestions(result.suggestions))
        .catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [value]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form className={`search-box${large ? " search-box-large" : ""}`} onSubmit={submit} role="search">
      <Search size={large ? 21 : 18} className="search-box-icon" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 130)}
        placeholder={large ? "Try “bluetoth” or “gaming under ₹5,000”" : "Search products"}
        aria-label="Search products"
      />
      {large && <kbd>↵</kbd>}
      {open && suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map((item) => (
            <button type="button" key={item.productId} onMouseDown={() => router.push(`/products/${item.productId}`)}>
              <span>{item.name}</span>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      )}
    </form>
  );
}