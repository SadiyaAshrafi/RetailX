"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CircleUserRound, Search, ShoppingBag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api, cartId, type ServiceState } from "@/lib/api";

type Health = {
  services: { postgres: ServiceState; kafka: ServiceState; openSearch: ServiceState };
};

export function SiteHeader() {
  const [count, setCount] = useState(0);
  const health = useQuery({ queryKey: ["health"], queryFn: () => api<Health>("/health"), refetchInterval: 15000 });

  useEffect(() => {
    const updateCount = async () => {
      try {
        const cart = await api<{ items: { quantity: number }[] }>(`/cart/${cartId()}`);
        setCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        setCount(0);
      }
    };
    void updateCount();
    window.addEventListener("retailx-cart-changed", updateCount);
    return () => window.removeEventListener("retailx-cart-changed", updateCount);
  }, []);

  const connected = Object.values(health.data?.services ?? {}).filter((state) => state === "connected").length;

  return (
    <>
      <div className="network-bar">
        <span className="network-pulse" />
        <span>RETAILX NETWORK</span>
        <span className="network-separator" />
        <span className="network-copy">{health.isError ? "Service status unavailable" : `${connected}/3 Aiven services connected`}</span>
        <Link href="/admin" className="network-link">System status <ArrowUpRight size={13} /></Link>
      </div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="RetailX home">
          <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
          <span>retail<span className="brand-x">x</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/products">Discover</Link>
          <Link href="/products?sort=popular">Trending</Link>
          <Link href="/assistant">AI assistant <span className="nav-new">NEW</span></Link>
        </nav>
        <div className="header-actions">
          <Link href="/products" className="header-icon search-shortcut" aria-label="Search products"><Search size={19} /></Link>
          <Link href="/admin" className="header-icon account-link" aria-label="Admin dashboard"><CircleUserRound size={19} /></Link>
          <Link href="/cart" className="header-icon bag-link" aria-label={`Shopping bag, ${count} items`}>
            <ShoppingBag size={19} />
            {count > 0 && <span className="bag-count">{count}</span>}
          </Link>
        </div>
      </header>
    </>
  );
}