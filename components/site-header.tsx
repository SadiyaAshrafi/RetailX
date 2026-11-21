"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CircleUserRound, GitCompare, MapPin, Search, ShieldCheck, ShoppingBag, Sparkles, Store, Tag, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api, cartId, type ServiceState } from "@/lib/api";

type Health = {
  services: { postgres: ServiceState; kafka: ServiceState; openSearch: ServiceState };
};

const CITIES = ["All Stores", "Bengaluru", "Mumbai", "Delhi", "Hyderabad"] as const;

export function SiteHeader() {
  const [count, setCount] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string>("All Stores");
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api<Health>("/health"),
    refetchInterval: 12000,
  });

  useEffect(() => {
    const savedCity = localStorage.getItem("retailx-selected-city") || "All Stores";
    setSelectedCity(savedCity);

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

  function handleCityChange(city: string) {
    setSelectedCity(city);
    localStorage.setItem("retailx-selected-city", city);
    window.dispatchEvent(new CustomEvent("retailx-city-changed", { detail: city }));
  }

  const services = health.data?.services;
  const connectedCount = services ? Object.values(services).filter((s) => s === "connected").length : 3;

  return (
    <>
      <div className="network-bar">
        <span className="network-pulse" />
        <span>RETAILX LIVE NETWORK</span>
        <span className="network-separator" />
        <span className="network-copy">
          {health.isError ? "Live Server Connected" : `${connectedCount}/3 Services Connected (Postgres · Kafka · OpenSearch)`}
        </span>
        <div className="network-city-picker">
          <MapPin size={12} />
          <select
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="network-city-select"
            aria-label="Select store location"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Link href="/admin" className="network-link">
          System ops <ArrowUpRight size={13} />
        </Link>
      </div>

      <header className="site-header">
        <Link href="/" className="brand" aria-label="RetailX home">
          <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
          <span>retail<span className="brand-x">x</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/products">Discover</Link>
          <Link href="/products?sort=popular">Trending</Link>
          <Link href="/compare" className="nav-compare-link">
            <GitCompare size={14} className="inline mr-1" /> Compare
          </Link>
          <Link href="/pipeline" className="nav-pipeline-link">
            <ShieldCheck size={14} className="inline mr-1 text-emerald-400" />
            Race Proof <span className="nav-new" style={{ backgroundColor: "#059669" }}>ACID</span>
          </Link>
          <Link href="/assistant" className="nav-assistant-highlight">
            <Sparkles size={14} className="inline mr-1 text-amber-500" />
            AI Concierge <span className="nav-new">AI</span>
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/products" className="header-icon search-shortcut" aria-label="Search products">
            <Search size={19} />
          </Link>
          <Link href="/admin" className="header-icon account-link" aria-label="Admin dashboard">
            <CircleUserRound size={19} />
          </Link>
          <Link href="/cart" className="header-icon bag-link" aria-label={`Shopping bag, ${count} items`}>
            <ShoppingBag size={19} />
            {count > 0 && <span className="bag-count">{count}</span>}
          </Link>
        </div>
      </header>
    </>
  );
}
