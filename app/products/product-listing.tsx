"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Filter, GitCompare, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { api, type SearchResult } from "@/lib/api";

const categories = ["Audio", "Computing", "Gaming", "Wearables", "Photography", "Home"];
const cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"];

export function ProductListing({ initialQuery, initialCategory }: { initialQuery: string; initialCategory: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("newest");
  const [available, setAvailable] = useState(false);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [compareCount, setCompareCount] = useState(0);

  useEffect(() => {
    const savedCity = localStorage.getItem("retailx-selected-city");
    if (savedCity && savedCity !== "All Stores") {
      setCity(savedCity);
    }

    const handleCity = (e: Event) => {
      const customCity = (e as CustomEvent<string>).detail;
      setCity(customCity === "All Stores" ? "" : customCity);
      setPage(1);
    };

    const handleCompare = () => {
      const list = JSON.parse(localStorage.getItem("retailx-compare-list") || "[]");
      setCompareCount(list.length);
    };

    handleCompare();
    window.addEventListener("retailx-city-changed", handleCity);
    window.addEventListener("retailx-compare-changed", handleCompare);

    return () => {
      window.removeEventListener("retailx-city-changed", handleCity);
      window.removeEventListener("retailx-compare-changed", handleCompare);
    };
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);

  useEffect(() => {
    setCategory(initialCategory);
    setPage(1);
  }, [initialCategory]);

  const queryString = new URLSearchParams({
    ...(query ? { q: query } : {}),
    ...(category ? { category } : {}),
    ...(city ? { city } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    ...(available ? { available: "true" } : {}),
    sort,
    page: String(page),
    limit: "12",
  }).toString();

  const products = useQuery({
    queryKey: ["catalog", queryString],
    queryFn: () => api<SearchResult>(`/products?${queryString}`),
    placeholderData: (previous) => previous,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const handleStockChanged = () => {
      void products.refetch();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "retailx-stock-sync") {
        void products.refetch();
      }
    };
    window.addEventListener("retailx-stock-changed", handleStockChanged);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("retailx-stock-changed", handleStockChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [products]);

  const activeFilters = Number(Boolean(category)) + Number(Boolean(city)) + Number(available) + Number(Boolean(minPrice || maxPrice));

  function updateFilter(update: () => void) {
    update();
    setPage(1);
  }

  return (
    <main className="catalog-page page-width">
      <div className="breadcrumb">
        <Link href="/">Home</Link><span>/</span><span>Discover</span>
      </div>

      <div className="catalog-intro">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> THE RETAILX EDIT</div>
          <h1>{query ? <>Results for <em>“{query}”</em></> : "Find your next favorite."}</h1>
          <p>Considered essentials, with live availability from store warehouses across India.</p>

          {/* Quick Category Pills */}
          <div className="catalog-quick-categories">
            <button
              onClick={() => updateFilter(() => setCategory(""))}
              className={`cat-pill ${!category ? "active" : ""}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => updateFilter(() => setCategory(category === cat ? "" : cat))}
                className={`cat-pill ${category === cat ? "active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="catalog-search">
          <SearchBox initialValue={initialQuery} />
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-count">
          <span className="live-source"><i /> OPEN SEARCH</span>
          <span>{products.data ? `${products.data.total} products available` : "Live catalog"}</span>
          {city && <span className="active-city-chip">in {city}</span>}
        </div>

        <div className="catalog-controls">
          {compareCount > 0 && (
            <Link href="/compare" className="compare-floating-pill">
              <GitCompare size={14} /> Compare ({compareCount})
            </Link>
          )}

          <button className={`filter-toggle${filtersOpen ? " selected" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)}>
            <Filter size={15} /> Filters{activeFilters > 0 && <span>{activeFilters}</span>}
          </button>

          <label className="sort-select">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => updateFilter(() => setSort(event.target.value))}>
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>

      <div className={`catalog-layout${filtersOpen ? " filters-visible" : ""}`}>
        <aside className="filter-panel">
          <div className="filter-panel-heading">
            <strong>Refine your search</strong>
            <button
              onClick={() => {
                setCategory("");
                setCity("");
                setAvailable(false);
                setMinPrice("");
                setMaxPrice("");
              }}
              title="Clear filters"
            >
              <X size={15} />
            </button>
          </div>

          <div className="filter-group">
            <span className="filter-label">Category</span>
            {categories.map((item) => (
              <label className="check-option" key={item}>
                <input
                  type="radio"
                  name="category"
                  checked={category === item}
                  onChange={() => updateFilter(() => setCategory(category === item ? "" : item))}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-label">Store location</span>
            <select className="filter-select" value={city} onChange={(event) => updateFilter(() => setCity(event.target.value))}>
              <option value="">All cities</option>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Price range</span>
            <div className="price-inputs">
              <label>₹<input type="number" min="0" value={minPrice} onChange={(event) => updateFilter(() => setMinPrice(event.target.value))} placeholder="Min" /></label>
              <span>to</span>
              <label>₹<input type="number" min="0" value={maxPrice} onChange={(event) => updateFilter(() => setMaxPrice(event.target.value))} placeholder="Max" /></label>
            </div>
          </div>

          <label className="availability-option">
            <input type="checkbox" checked={available} onChange={(event) => updateFilter(() => setAvailable(event.target.checked))} />
            <span>In stock only</span>
          </label>
        </aside>

        <section className="catalog-results" aria-live="polite">
          {products.isLoading ? (
            <div className="product-grid">{[0, 1, 2, 3].map((item) => <div className="product-skeleton" key={item} />)}</div>
          ) : products.data?.products.length ? (
            <div className="product-grid">
              {products.data.products.map((product, index) => (
                <ProductCard key={product.productId} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <Search size={22} />
              <strong>No matches found.</strong>
              <p>Try loosening your price filter or select another city.</p>
            </div>
          )}

          {products.data && products.data.total > 0 && (
            <div className="pagination">
              <span>Page {page} of {Math.max(1, Math.ceil(products.data.total / products.data.pageSize))}</span>
              <div>
                <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
                  <ArrowLeft size={15} />
                </button>
                <button
                  disabled={page * products.data.pageSize >= products.data.total}
                  onClick={() => setPage(page + 1)}
                  aria-label="Next page"
                >
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
