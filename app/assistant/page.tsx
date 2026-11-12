"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, MapPin, Search, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { api, type SearchResult } from "@/lib/api";

const prompts = ["Best Bluetooth earphones under ₹2,000", "Show gaming gear in Bengaluru", "A keyboard for a small desk"];
const locations = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"];

function parsePrompt(prompt: string) {
  const params = new URLSearchParams();
  const price = prompt.match(/(?:under|below|less than)\s*(?:₹|rs\.?\s*)?([\d,]+)/i);
  const city = locations.find((location) => prompt.toLowerCase().includes(location.toLowerCase()));
  const category = /gaming|game|controller/i.test(prompt) ? "Gaming" : /keyboard|laptop|computer|desk/i.test(prompt) ? "Computing" : /headphone|earphone|audio|bluetooth/i.test(prompt) ? "Audio" : "";
  const query = prompt
    .replace(/(?:under|below|less than)\s*(?:₹|rs\.?\s*)?[\d,]+/ig, " ")
    .replace(/\b(?:best|show|find|suggest|recommend|available|in|for|me|some|a|the|products?|gear|under|below)\b/ig, " ")
    .replace(new RegExp(locations.join("|"), "ig"), " ")
    .replace(/[₹\d,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (query) params.set("q", query);
  if (price?.[1]) params.set("maxPrice", price[1].replace(/,/g, ""));
  if (city) params.set("city", city);
  if (category) params.set("category", category);
  params.set("sort", "popular");
  params.set("limit", "6");
  return params.toString();
}

export default function AssistantPage() {
  const [prompt, setPrompt] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setSubmitted(prompt.trim());
    setError("");
    setLoading(true);
    try {
      setResult(await api<SearchResult>(`/products?${parsePrompt(prompt.trim())}`));
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : "Unable to search the live catalog.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="assistant-page page-width">
      <div className="assistant-intro"><div className="assistant-large-icon"><Sparkles size={24} /></div><div className="eyebrow"><span className="eyebrow-line" /> THE RETAILX ASSISTANT</div><h1>Tell us what<br /><em>you’re looking for.</em></h1><p>Describe the thing, the budget, or the city. We’ll search what’s actually in stock.</p></div>
      <form className="assistant-prompt-form" onSubmit={search}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void search(event); } }} rows={2} placeholder="A quiet mechanical keyboard under ₹10,000…" aria-label="Describe what you are looking for" /><button className="assistant-send" aria-label="Search the catalog" disabled={loading || !prompt.trim()}>{loading ? <span className="loading-dots">···</span> : <ArrowRight size={18} />}</button></form>
      <div className="assistant-prompts"><span>TRY ASKING</span>{prompts.map((suggestion) => <button key={suggestion} onClick={() => setPrompt(suggestion)}>{suggestion}</button>)}</div>
      {error && <div className="assistant-error"><Search size={16} /><span>{error}. Product recommendations run through Aiven OpenSearch.</span><Link href="/admin">Check services <ArrowUpRight size={14} /></Link></div>}
      {result && <section className="assistant-results"><div className="assistant-answer"><span className="assistant-answer-mark"><Sparkles size={15} /></span><div><span className="filter-label">A GOOD PLACE TO START</span><p>{result.total ? `Found ${result.total} ${result.total === 1 ? "match" : "matches"} for “${submitted}”. These are available in the live catalog.` : `No exact matches for “${submitted}”. Try a broader description or a different budget.`}</p><small><MapPin size={12} /> Search results from {result.source}</small></div></div>{result.products.length > 0 && <div className="product-grid">{result.products.map((product, index) => <ProductCard key={product.productId} product={product} index={index} />)}</div>}</section>}
    </main>
  );
}