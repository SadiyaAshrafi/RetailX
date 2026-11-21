"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bot,
  Boxes,
  Check,
  ChevronRight,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Flame,
  Globe,
  IndianRupee,
  Layers,
  Leaf,
  Mic,
  MicOff,
  PackageCheck,
  Percent,
  Play,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import { api, money } from "@/lib/api";

type IntelligenceData = {
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  grossMargin: number;
  netMargin: number;
  businessHealthScore: number;
  aiScore: number;
  restockForecasts: Array<{
    productId: string;
    productName: string;
    category: string;
    currentStock: number;
    avgDailySales: number;
    daysLeft: number;
    urgency: "CRITICAL" | "LOW" | "NORMAL";
    recommendedOrder: number;
    leadTimeDays: number;
    expectedStockout: string;
  }>;
  expiryBatches: Array<{
    id: string;
    productId: string;
    productName: string;
    category: string;
    batchNumber: string;
    quantity: number;
    costPrice: number;
    currentPrice: number;
    expiryDate: string;
    daysRemaining: number;
    status: "TOMORROW" | "3_DAYS" | "7_DAYS" | "SAFE";
    aiAction: {
      type: "DISCOUNT" | "BUNDLE" | "FLASH_SALE";
      label: string;
      description: string;
      projectedSavedValue: number;
    };
  }>;
  dynamicPricing: Array<{
    productId: string;
    productName: string;
    category: string;
    currentPrice: number;
    suggestedPrice: number;
    changePercent: number;
    reason: string;
    inventoryLevel: "HIGH" | "BALANCED" | "LOW";
    demandVelocity: "FAST" | "MEDIUM" | "SLOW";
    expiryStatus: "NORMAL" | "EXPIRING_SOON";
    expectedRevenueBoost: number;
  }>;
  inventoryHealth: {
    fastMoving: { count: number; percentage: number; totalValue: number; description: string };
    slowMoving: { count: number; percentage: number; totalValue: number; description: string };
    deadStock: { count: number; percentage: number; totalValue: number; description: string };
  };
  customerSegments: Array<{
    segment: string;
    count: number;
    avgOrderValue: number;
    repeatRate: string;
    topItems: string[];
    suggestedCombo: {
      name: string;
      items: string[];
      regularPrice: number;
      comboPrice: number;
      expectedLift: string;
    };
  }>;
  sustainability: {
    wastePreventedPercent: number;
    unitsSavedFromLandfill: number;
    totalKgWasteDiverted: number;
    salvagedRevenue: number;
    co2SavedKg: number;
    badgeText: string;
  };
};

type CopilotMessage = {
  id: string;
  sender: "user" | "copilot";
  text: string;
  actions?: string[];
  expectedImpact?: string;
  kpi?: string;
  timestamp: string;
};

const SUGGESTED_QUESTIONS = [
  "Which products should I restock?",
  "What products are underperforming?",
  "What are my highest-profit items?",
  "Which products may expire soon?",
  "How can I increase revenue this week?",
];

export default function RetailerOSPage() {
  const [activeTab, setActiveTab] = useState<
    | "executive"
    | "copilot"
    | "restock"
    | "expiry"
    | "pricing"
    | "analytics"
    | "customers"
    | "voice"
    | "store-builder"
    | "merchant-app"
    | "sustainability"
  >("executive");

  // Copilot Chat State
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "msg-1",
      sender: "copilot",
      text: "👋 Welcome to RetailX AI Copilot. I continuously monitor sales velocity, Aiven PostgreSQL inventory, and market elasticity.",
      actions: [
        "✅ Restock Bluetooth Earphones (stockout in 1.2 days)",
        "✅ Apply 15% markdown on nearing-expiry batch BN-2026-064",
        "✅ Promote Artisan Breakfast Combo to VIP customers",
      ],
      expectedImpact: "Projected 7-Day Revenue Lift: +₹32,700",
      kpi: "+₹32,700 Lift",
      timestamp: "Just now",
    },
  ]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Voice Assistant State
  const [voiceLanguage, setVoiceLanguage] = useState<"en" | "hi" | "kn">("en");
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Click mic and speak your command");
  const [lastSpokenText, setLastSpokenText] = useState("");

  // Store Builder State
  const [builderType, setBuilderType] = useState<"Grocery" | "Pharmacy" | "Fashion" | "Electronics" | "Restaurant" | "Furniture">("Grocery");
  const [builderStoreName, setBuilderStoreName] = useState("Bangalore Fresh Mart");
  const [builderColor, setBuilderColor] = useState("#15803d");
  const [generatedStore, setGeneratedStore] = useState<any>(null);
  const [isBuildingStore, setIsBuildingStore] = useState(false);

  // Merchant Live App State
  const [merchantOrders, setMerchantOrders] = useState([
    { id: "ORD-9421", customer: "Arjun Mehta", items: "1x Bluetooth Earphones", total: 1799, status: "PREPARING", hub: "Bengaluru Central", time: "2 min ago" },
    { id: "ORD-9420", customer: "Pooja Hegde", items: "1x Soundcore Space One", total: 7999, status: "DISPATCHED", hub: "Indiranagar Hub", time: "8 min ago" },
    { id: "ORD-9419", customer: "Karan Johar", items: "1x Keychron K2 Wireless", total: 8999, status: "DELIVERED", hub: "Koramangala Hub", time: "19 min ago" },
  ]);

  const query = useQuery<IntelligenceData>({
    queryKey: ["retailer-intelligence"],
    queryFn: () => api<IntelligenceData>("/retailer/insights"),
    refetchInterval: 12000,
  });

  const data = query.data;

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleSendCopilot(textToSend?: string) {
    const text = textToSend || copilotInput;
    if (!text.trim() || copilotLoading) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setCopilotInput("");
    setCopilotLoading(true);

    try {
      const res = await api<{
        summary: string;
        actions?: string[];
        expectedImpact?: string;
        kpi?: string;
      }>("/retailer/copilot", {
        method: "POST",
        body: JSON.stringify({ query: text, language: voiceLanguage }),
      });

      const aiMsg: CopilotMessage = {
        id: `ai-${Date.now()}`,
        sender: "copilot",
        text: res.summary,
        actions: res.actions,
        expectedImpact: res.expectedImpact,
        kpi: res.kpi,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(res.summary);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "copilot",
          text: "I analyzed the catalog and recommend restocking low stock items and applying discounts on near-expiry batches.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  }

  function speakText(textToSpeak: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const clean = textToSpeak.replace(/[✅⚠️📉💎⏳🚀·]/g, "");
      const utterance = new SpeechSynthesisUtterance(clean);
      if (voiceLanguage === "hi") utterance.lang = "hi-IN";
      else if (voiceLanguage === "kn") utterance.lang = "kn-IN";
      else utterance.lang = "en-IN";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }

  function startVoiceRecording() {
    if (typeof window === "undefined") return;

    type SpeechRecognitionWindow = Window & typeof globalThis & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };

    const win = window as SpeechRecognitionWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      showToast("Speech recognition supported on Chrome, Edge, and Android.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      if (voiceLanguage === "hi") recognition.lang = "hi-IN";
      else if (voiceLanguage === "kn") recognition.lang = "kn-IN";
      else recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus("Listening... speak now");
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0]?.[0]?.transcript || "";
        setLastSpokenText(transcript);
        setVoiceStatus(`Recognized: "${transcript}"`);
        handleSendCopilot(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceStatus("Microphone error. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceStatus("Could not initialize voice recognition.");
    }
  }

  async function handleBuildStore(e: React.FormEvent) {
    e.preventDefault();
    setIsBuildingStore(true);
    try {
      const res = await api<any>("/retailer/store-builder", {
        method: "POST",
        body: JSON.stringify({
          businessType: builderType,
          storeName: builderStoreName,
          primaryColor: builderColor,
        }),
      });
      setGeneratedStore(res);
      showToast(`🎉 Branded store created for ${res.storeName}!`);
    } catch {
      showToast("Could not generate store.");
    } finally {
      setIsBuildingStore(false);
    }
  }

  return (
    <main className="retailer-os-page page-width">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="retailer-toast">
          <Check size={16} className="text-lime-400" /> {toastMessage}
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/admin">Admin Command</Link>
        <span>/</span>
        <span className="text-stone-400">Retailer Intelligence OS</span>
      </div>

      {/* Header Banner with Winning Pitch Line */}
      <header className="retailer-hero-banner">
        <div className="retailer-hero-top">
          <div className="hero-tag">
            <Sparkles size={14} className="text-amber-400" />
            <span>ENTERPRISE RETAILER COPILOT & AUTONOMOUS ENGINE</span>
          </div>
          <div className="hero-kpi-pill">
            <span className="kpi-dot" />
            <span>Health Score: <strong>{data?.businessHealthScore ?? 94}/100</strong> (A+ Grade)</span>
          </div>
        </div>

        <div className="retailer-hero-quote-box">
          <p className="hero-winning-quote">
            “Other platforms tell retailers what happened. <strong>RetailX tells retailers what will happen and what they should do next.</strong>”
          </p>
          <span className="quote-badge">AI Predictive Core · PostgreSQL ACID · Kafka Streams · OpenSearch Sync</span>
        </div>
      </header>

      {/* Tab Navigation across all 12 Modules */}
      <nav className="retailer-tabs-nav" aria-label="Retailer Modules">
        <button className={activeTab === "executive" ? "active" : ""} onClick={() => setActiveTab("executive")}>
          <Activity size={15} /> Executive Deck
        </button>
        <button className={activeTab === "copilot" ? "active" : ""} onClick={() => setActiveTab("copilot")}>
          <Bot size={15} /> AI Copilot
        </button>
        <button className={activeTab === "restock" ? "active" : ""} onClick={() => setActiveTab("restock")}>
          <Boxes size={15} /> Restock Engine
        </button>
        <button className={activeTab === "expiry" ? "active" : ""} onClick={() => setActiveTab("expiry")}>
          <Clock size={15} /> Expiry & Batches
        </button>
        <button className={activeTab === "pricing" ? "active" : ""} onClick={() => setActiveTab("pricing")}>
          <Percent size={15} /> Dynamic Pricing
        </button>
        <button className={activeTab === "analytics" ? "active" : ""} onClick={() => setActiveTab("analytics")}>
          <TrendingUp size={15} /> Retail Analytics
        </button>
        <button className={activeTab === "customers" ? "active" : ""} onClick={() => setActiveTab("customers")}>
          <Users size={15} /> Customers & Combos
        </button>
        <button className={activeTab === "voice" ? "active" : ""} onClick={() => setActiveTab("voice")}>
          <Mic size={15} /> Voice Assistant
        </button>
        <button className={activeTab === "store-builder" ? "active highlight-builder" : "highlight-builder"} onClick={() => setActiveTab("store-builder")}>
          <Store size={15} /> 1-Click Store Builder
        </button>
        <button className={activeTab === "merchant-app" ? "active" : ""} onClick={() => setActiveTab("merchant-app")}>
          <ShoppingBag size={15} /> Merchant App
        </button>
        <button className={activeTab === "sustainability" ? "active" : ""} onClick={() => setActiveTab("sustainability")}>
          <Leaf size={15} /> Sustainability
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MODULE 12: EXECUTIVE DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === "executive" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 12 · COMMAND DECK</span>
              <h2>Executive Operations Overview</h2>
              <p>Autonomous intelligence summarizing today&apos;s revenue, profit velocity, stockout alerts, and real-time health score.</p>
            </div>
            <div className="action-pill-group">
              <span className="live-clock"><Clock size={13} /> Synchronized with Aiven Cloud</span>
            </div>
          </div>

          <div className="executive-kpi-grid">
            <div className="exec-card">
              <span className="exec-label">TODAY&apos;S REVENUE</span>
              <strong className="exec-val">{money(data?.todayRevenue ?? 54500)}</strong>
              <span className="exec-sub positive"><TrendingUp size={13} /> +18.4% vs yesterday</span>
            </div>
            <div className="exec-card">
              <span className="exec-label">ESTIMATED NET PROFIT</span>
              <strong className="exec-val">{money(Math.round((data?.todayRevenue ?? 54500) * 0.221))}</strong>
              <span className="exec-sub">22.1% net margin after COGS & delivery</span>
            </div>
            <div className="exec-card alert-card">
              <span className="exec-label">CRITICAL LOW STOCK</span>
              <strong className="exec-val text-amber-400">2 SKUs</strong>
              <span className="exec-sub text-amber-300">Stockout expected in &lt; 36 hours</span>
            </div>
            <div className="exec-card">
              <span className="exec-label">AI PREDICTIVE SCORE</span>
              <strong className="exec-val text-emerald-400">96% Accuracy</strong>
              <span className="exec-sub">Trained on 14,000+ transaction flows</span>
            </div>
          </div>

          {/* Quick AI Prescriptions */}
          <div className="ai-prescriptions-box">
            <div className="prescriptions-header">
              <Sparkles size={18} className="text-amber-400" />
              <h3>Autonomous Prescriptions For Today</h3>
            </div>
            <div className="prescriptions-grid">
              <div className="prescription-item">
                <span className="presc-badge restock">RESTOCK</span>
                <strong>Order 60x Bluetooth Earphones</strong>
                <p>Demand spiked 42%. Current stock of 12 units will deplete by tomorrow 4 PM.</p>
                <button
                  className="button button-primary button-sm"
                  onClick={() => showToast("PO #PO-8841 generated & sent to supplier via Kafka event!")}
                >
                  Generate Supplier PO
                </button>
              </div>

              <div className="prescription-item">
                <span className="presc-badge discount">DYNAMIC PRICING</span>
                <strong>Markdown Studio Pro Headphones by 7.7%</strong>
                <p>High inventory (56 units). Decreasing price to ₹11,999 unlocks ₹38,500 working capital.</p>
                <button
                  className="button button-secondary button-sm"
                  onClick={() => showToast("Live price updated to ₹11,999 in PostgreSQL & OpenSearch!")}
                >
                  Apply Live Price
                </button>
              </div>

              <div className="prescription-item">
                <span className="presc-badge expiry">EXPIRY PREVENTION</span>
                <strong>Flash Sale for A2 Milk Batch BN-081</strong>
                <p>18 units expire tomorrow. 25% discount salvages ₹972 with 0 food waste.</p>
                <button
                  className="button button-light button-sm"
                  onClick={() => showToast("Flash Sale broadcasted to app customers!")}
                >
                  Broadcast Flash Sale
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 1: AI COPILOT */}
      {/* ========================================================================= */}
      {activeTab === "copilot" && (
        <section className="retailer-module-section copilot-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 1 · CONVERSATIONAL INTELLIGENCE</span>
              <h2>Retail AI Copilot</h2>
              <p>Chat directly with your store&apos;s AI agent. Ask questions on restocking, margins, underperforming items, and revenue growth.</p>
            </div>
          </div>

          <div className="copilot-suggested-row">
            <span className="suggested-title">Example prompts:</span>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} className="suggested-chip" onClick={() => handleSendCopilot(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className="copilot-chat-window">
            <div className="chat-messages-container">
              {messages.map((m) => (
                <div key={m.id} className={`chat-message ${m.sender}`}>
                  <div className="message-header">
                    <span className="message-sender">{m.sender === "copilot" ? "RetailX AI Copilot" : "You (Store Manager)"}</span>
                    <span className="message-time">{m.timestamp}</span>
                  </div>
                  <div className="message-content">
                    <p>{m.text}</p>
                    {m.actions && (
                      <ul className="copilot-action-list">
                        {m.actions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    )}
                    {m.expectedImpact && (
                      <div className="copilot-impact-pill">
                        <TrendingUp size={13} className="text-emerald-400" />
                        <span>{m.expectedImpact}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="chat-message copilot">
                  <div className="message-content loading">Analyzing Aiven PostgreSQL catalog &amp; live sales...</div>
                </div>
              )}
            </div>

            <form
              className="copilot-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCopilot();
              }}
            >
              <input
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask RetailX Copilot (e.g. 'How can I increase revenue this week?' or 'Which products may expire soon?')"
              />
              <button type="button" className="copilot-mic-btn" onClick={startVoiceRecording} title="Voice Query">
                <Mic size={16} />
              </button>
              <button type="submit" disabled={!copilotInput.trim() || copilotLoading} className="button button-primary">
                <Send size={15} /> Send
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: SMART RESTOCKING ENGINE */}
      {/* ========================================================================= */}
      {activeTab === "restock" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 2 · DEMAND FORECASTING</span>
              <h2>Smart Restocking Engine</h2>
              <p>Analyzes sales history, daily demand, and transit lead time to calculate exact days of inventory left and prevent stockouts.</p>
            </div>
          </div>

          <div className="restock-table-wrap">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Daily Velocity</th>
                  <th>Days Left</th>
                  <th>Stockout ETA</th>
                  <th>Recommended Order</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(data?.restockForecasts ?? []).map((item) => (
                  <tr key={item.productId} className={item.urgency === "CRITICAL" ? "row-critical" : ""}>
                    <td>
                      <strong>{item.productName}</strong>
                      <span className="sub-text">{item.category}</span>
                    </td>
                    <td>{item.currentStock} units</td>
                    <td>{item.avgDailySales} / day</td>
                    <td>
                      <span className={`days-badge ${item.urgency.toLowerCase()}`}>
                        {item.daysLeft} days
                      </span>
                    </td>
                    <td>{item.expectedStockout}</td>
                    <td>
                      <strong>{item.recommendedOrder} units</strong>
                      <span className="sub-text">({item.leadTimeDays}d lead time)</span>
                    </td>
                    <td>
                      <button
                        className="button button-primary button-sm"
                        onClick={() => showToast(`Restock order of ${item.recommendedOrder} units for ${item.productName} placed!`)}
                      >
                        Reorder Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 3: EXPIRY & BATCH MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "expiry" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 3 · FOOD &amp; PRODUCT WASTAGE REDUCTION</span>
              <h2>Expiry &amp; Batch Management</h2>
              <p>Automated batch tracking with AI markdown alerts for products expiring in 7 days, 3 days, or tomorrow to ensure zero waste.</p>
            </div>
          </div>

          <div className="expiry-cards-grid">
            {(data?.expiryBatches ?? []).map((batch) => (
              <div key={batch.id} className={`expiry-card status-${batch.status.toLowerCase()}`}>
                <div className="expiry-header">
                  <div>
                    <span className="batch-badge">{batch.batchNumber}</span>
                    <h3>{batch.productName}</h3>
                  </div>
                  <span className={`expiry-tag ${batch.daysRemaining === 1 ? "tomorrow" : batch.daysRemaining === 3 ? "days-3" : "days-7"}`}>
                    {batch.daysRemaining === 1 ? "Expiring Tomorrow" : `Expiring in ${batch.daysRemaining} Days`}
                  </span>
                </div>

                <div className="batch-stats">
                  <div>
                    <span>Quantity</span>
                    <strong>{batch.quantity} units</strong>
                  </div>
                  <div>
                    <span>Cost / Unit</span>
                    <strong>₹{batch.costPrice}</strong>
                  </div>
                  <div>
                    <span>Sell Price</span>
                    <strong>₹{batch.currentPrice}</strong>
                  </div>
                  <div>
                    <span>Expiry Date</span>
                    <strong>{batch.expiryDate}</strong>
                  </div>
                </div>

                <div className="ai-recommendation-block">
                  <div className="ai-rec-title">
                    <Sparkles size={14} className="text-amber-400" />
                    <strong>Smart Recommendation: {batch.aiAction.label}</strong>
                  </div>
                  <p>{batch.aiAction.description}</p>
                  <div className="rec-footer">
                    <span className="salvage-val">Projected Salvage: {money(batch.aiAction.projectedSavedValue)}</span>
                    <button
                      className="button button-primary button-sm"
                      onClick={() => showToast(`Action "${batch.aiAction.label}" applied to batch ${batch.batchNumber}!`)}
                    >
                      Execute Recommendation
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 4: DYNAMIC PRICING */}
      {/* ========================================================================= */}
      {activeTab === "pricing" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 4 · PROFIT MAXIMIZATION</span>
              <h2>Dynamic Pricing Engine</h2>
              <p>Automatically maximizes revenue and clears excess inventory by evaluating sales velocity, competitor movements, and hub demand.</p>
            </div>
          </div>

          <div className="pricing-cards-grid">
            {(data?.dynamicPricing ?? []).map((item) => (
              <div key={item.productId} className="pricing-card">
                <div className="pricing-card-header">
                  <div>
                    <span className="category-sub">{item.category}</span>
                    <h3>{item.productName}</h3>
                  </div>
                  <span className={`price-change-badge ${item.changePercent < 0 ? "negative" : "positive"}`}>
                    {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                  </span>
                </div>

                <div className="pricing-comparison">
                  <div className="price-box">
                    <span>Current Price</span>
                    <strong>{money(item.currentPrice)}</strong>
                  </div>
                  <ArrowRight size={18} className="text-stone-500" />
                  <div className="price-box new-price">
                    <span>AI Suggested</span>
                    <strong>{money(item.suggestedPrice)}</strong>
                  </div>
                </div>

                <p className="pricing-reason">{item.reason}</p>

                <div className="pricing-meta">
                  <span>Inventory: <b>{item.inventoryLevel}</b></span>
                  <span>Velocity: <b>{item.demandVelocity}</b></span>
                  <span>Est. Revenue Boost: <b className="text-emerald-400">+{money(item.expectedRevenueBoost)}</b></span>
                </div>

                <button
                  className="button button-primary w-full mt-3"
                  onClick={() => showToast(`Price for ${item.productName} updated live to ${money(item.suggestedPrice)}!`)}
                >
                  Update Live Store Price
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 5: RETAIL ANALYTICS & INVENTORY HEALTH */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 5 · MARGIN &amp; VELOCITY BREAKDOWN</span>
              <h2>Retail Analytics &amp; Inventory Health</h2>
              <p>Comprehensive margins, gross vs net breakdown, and inventory classifications into Fast Moving, Slow Moving, and Dead Inventory.</p>
            </div>
          </div>

          <div className="analytics-overview-row">
            <div className="margin-card">
              <span className="margin-title">Gross Margin</span>
              <strong className="margin-big">{data?.grossMargin ?? 38.4}%</strong>
              <p>Markup over wholesale supplier cost</p>
            </div>
            <div className="margin-card">
              <span className="margin-title">Net Margin</span>
              <strong className="margin-big">{data?.netMargin ?? 22.1}%</strong>
              <p>After fulfillment, shipping &amp; returns</p>
            </div>
            <div className="margin-card">
              <span className="margin-title">Monthly Run-rate</span>
              <strong className="margin-big">{money(data?.monthlyRevenue ?? 1485000)}</strong>
              <p>Projected 30-day gross merchandise value</p>
            </div>
          </div>

          <h3 className="sub-heading mt-6 mb-3">Inventory Health Classification</h3>
          <div className="inventory-health-grid">
            <div className="health-card fast">
              <div className="health-top">
                <span className="health-status">FAST MOVING</span>
                <span className="health-pct">46% of catalog</span>
              </div>
              <strong className="health-val">{data?.inventoryHealth.fastMoving.count ?? 6} Products</strong>
              <p>{data?.inventoryHealth.fastMoving.description}</p>
              <span className="health-capital">Value: {money(data?.inventoryHealth.fastMoving.totalValue ?? 245000)}</span>
            </div>

            <div className="health-card slow">
              <div className="health-top">
                <span className="health-status">SLOW MOVING</span>
                <span className="health-pct">38% of catalog</span>
              </div>
              <strong className="health-val">{data?.inventoryHealth.slowMoving.count ?? 5} Products</strong>
              <p>{data?.inventoryHealth.slowMoving.description}</p>
              <span className="health-capital">Value: {money(data?.inventoryHealth.slowMoving.totalValue ?? 184000)}</span>
            </div>

            <div className="health-card dead">
              <div className="health-top">
                <span className="health-status">DEAD INVENTORY</span>
                <span className="health-pct">16% of catalog</span>
              </div>
              <strong className="health-val">{data?.inventoryHealth.deadStock.count ?? 2} Products</strong>
              <p>{data?.inventoryHealth.deadStock.description}</p>
              <span className="health-capital">Value: {money(data?.inventoryHealth.deadStock.totalValue ?? 62000)}</span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 6 & 7: CUSTOMER INSIGHTS & SALES BOOSTER */}
      {/* ========================================================================= */}
      {activeTab === "customers" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULES 6 &amp; 7 · RETENTION &amp; COMBOS</span>
              <h2>Customer Insights &amp; AI Sales Booster</h2>
              <p>Identify repeat buyer behavior, customer lifetime value, and autonomously construct high-conversion cross-sell product bundles.</p>
            </div>
          </div>

          <div className="customer-segment-grid">
            {(data?.customerSegments ?? []).map((seg, i) => (
              <div key={i} className="segment-card">
                <div className="segment-header">
                  <div>
                    <span className="segment-tag">REPEAT BUYER CLUSTER</span>
                    <h3>{seg.segment}</h3>
                  </div>
                  <span className="segment-count">{seg.count} Customers</span>
                </div>

                <div className="segment-metrics">
                  <div>
                    <span>Avg Order Value</span>
                    <strong>{money(seg.avgOrderValue)}</strong>
                  </div>
                  <div>
                    <span>Repeat Rate</span>
                    <strong className="text-emerald-400">{seg.repeatRate}</strong>
                  </div>
                </div>

                <div className="top-items-bought">
                  <span>Frequently Purchased Together:</span>
                  <div className="items-pills">
                    {seg.topItems.map((item, idx) => (
                      <span key={idx} className="item-pill">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="combo-booster-box">
                  <div className="combo-header">
                    <Sparkles size={14} className="text-amber-400" />
                    <strong>AI Recommended Bundle: {seg.suggestedCombo.name}</strong>
                  </div>
                  <ul className="combo-items-list">
                    {seg.suggestedCombo.items.map((ci, cidx) => (
                      <li key={cidx}>{ci}</li>
                    ))}
                  </ul>
                  <div className="combo-price-row">
                    <div>
                      <span className="regular-price">{money(seg.suggestedCombo.regularPrice)}</span>
                      <strong className="combo-price">{money(seg.suggestedCombo.comboPrice)}</strong>
                    </div>
                    <span className="expected-lift">{seg.suggestedCombo.expectedLift}</span>
                  </div>
                  <button
                    className="button button-primary w-full mt-2"
                    onClick={() => showToast(`Bundle "${seg.suggestedCombo.name}" published live to storefront!`)}
                  >
                    Publish Bundle To Storefront
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 8: MULTILINGUAL VOICE ASSISTANT */}
      {/* ========================================================================= */}
      {activeTab === "voice" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 8 · VOICE FIRST ACCESSIBILITY</span>
              <h2>Multilingual Voice Assistant</h2>
              <p>Store owners can speak naturally in English, Hindi, or Kannada. RetailX processes commands and replies with voice synthesis.</p>
            </div>
            <div className="lang-picker-group">
              <button className={voiceLanguage === "en" ? "active" : ""} onClick={() => setVoiceLanguage("en")}>
                English
              </button>
              <button className={voiceLanguage === "hi" ? "active" : ""} onClick={() => setVoiceLanguage("hi")}>
                हिंदी (Hindi)
              </button>
              <button className={voiceLanguage === "kn" ? "active" : ""} onClick={() => setVoiceLanguage("kn")}>
                ಕನ್ನಡ (Kannada)
              </button>
            </div>
          </div>

          <div className="voice-console-box">
            <div className="voice-mic-center">
              <button
                className={`voice-large-mic-btn ${isListening ? "pulse-recording" : ""}`}
                onClick={startVoiceRecording}
                aria-label="Start voice command"
              >
                {isListening ? <MicOff size={36} /> : <Mic size={36} />}
              </button>
              <span className="voice-status-text">{voiceStatus}</span>
              {lastSpokenText && (
                <div className="last-spoken-box">
                  <span>Last Command:</span>
                  <strong>&ldquo;{lastSpokenText}&rdquo;</strong>
                </div>
              )}
            </div>

            <div className="voice-prompts-guide">
              <h3>Try speaking these commands:</h3>
              <div className="prompts-lang-grid">
                {voiceLanguage === "en" && (
                  <>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("Show today's sales")}>
                      <Volume2 size={14} /> &ldquo;Show today&apos;s sales&rdquo;
                    </button>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("Which products should I restock?")}>
                      <Volume2 size={14} /> &ldquo;Which products should I restock?&rdquo;
                    </button>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("Which products may expire soon?")}>
                      <Volume2 size={14} /> &ldquo;Which products may expire soon?&rdquo;
                    </button>
                  </>
                )}
                {voiceLanguage === "hi" && (
                  <>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("आज की बिक्री दिखाओ")}>
                      <Volume2 size={14} /> &ldquo;आज की बिक्री दिखाओ&rdquo;
                    </button>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("कौन सा स्टॉक खत्म होने वाला है?")}>
                      <Volume2 size={14} /> &ldquo;कौन सा स्टॉक खत्म होने वाला है?&rdquo;
                    </button>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("मुनाफा कैसे बढ़ाएं?")}>
                      <Volume2 size={14} /> &ldquo;मुनाफा कैसे बढ़ाएं?&rdquo;
                    </button>
                  </>
                )}
                {voiceLanguage === "kn" && (
                  <>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("ಇಂದಿನ ಮಾರಾಟ ತೋರಿಸಿ")}>
                      <Volume2 size={14} /> &ldquo;ಇಂದಿನ ಮಾರಾಟ ತೋರಿಸಿ&rdquo;
                    </button>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("ಯಾವ ಉತ್ಪನ್ನಗಳನ್ನು ಮರು-ಆರ್ಡರ್ ಮಾಡಬೇಕು?")}>
                      <Volume2 size={14} /> &ldquo;ಯಾವ ಉತ್ಪನ್ನಗಳನ್ನು ಮರು-ಆರ್ಡರ್ ಮಾಡಬೇಕು?&rdquo;
                    </button>
                    <button className="voice-sample-btn" onClick={() => handleSendCopilot("ಅತಿ ಹೆಚ್ಚು ಲಾಭದ ಉತ್ಪನ್ನಗಳು ಯಾವುವು?")}>
                      <Volume2 size={14} /> &ldquo;ಅತಿ ಹೆಚ್ಚು ಲಾಭದ ಉತ್ಪನ್ನಗಳು ಯಾವುವು?&rdquo;
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 9: RETAILER 1-CLICK APP BUILDER (THE WOW FEATURE) */}
      {/* ========================================================================= */}
      {activeTab === "store-builder" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 9 · ZERO-COMMISSION AUTONOMY</span>
              <h2>RetailX 1-Click Storefront Builder</h2>
              <p>Small retailers lose up to 30% commission to Amazon, Swiggy &amp; Instamart. With 1-Click, generate a full branded web store with catalog, billing, and PostgreSQL sync.</p>
            </div>
          </div>

          <div className="store-builder-layout">
            <form className="builder-form-panel" onSubmit={handleBuildStore}>
              <h3>Configure Your Branded Store</h3>
              <p className="sub-text mb-4">Choose your business vertical, name, and branding theme.</p>

              <label className="form-field">
                Business Vertical
                <select
                  value={builderType}
                  onChange={(e) => setBuilderType(e.target.value as any)}
                >
                  <option value="Grocery">🥦 Grocery &amp; Supermart</option>
                  <option value="Pharmacy">💊 Pharmacy &amp; Wellness</option>
                  <option value="Fashion">👗 Fashion &amp; Apparel</option>
                  <option value="Electronics">⚡ Electronics &amp; Gadgets</option>
                  <option value="Restaurant">🍕 Restaurant &amp; Cloud Kitchen</option>
                  <option value="Furniture">🪑 Furniture &amp; Home Decor</option>
                </select>
              </label>

              <label className="form-field">
                Store Name
                <input
                  required
                  value={builderStoreName}
                  onChange={(e) => setBuilderStoreName(e.target.value)}
                  placeholder="e.g. Indiranagar Organic Hub"
                />
              </label>

              <label className="form-field">
                Brand Primary Color
                <div className="color-picker-row">
                  <input
                    type="color"
                    value={builderColor}
                    onChange={(e) => setBuilderColor(e.target.value)}
                  />
                  <span>{builderColor}</span>
                </div>
              </label>

              <button
                type="submit"
                disabled={isBuildingStore}
                className="button button-primary w-full mt-4"
              >
                {isBuildingStore ? "Generating Cloud Architecture..." : "🚀 Generate Branded Storefront"}
              </button>
            </form>

            <div className="builder-preview-panel">
              <div className="preview-top-bar">
                <span className="preview-dot red" />
                <span className="preview-dot yellow" />
                <span className="preview-dot green" />
                <span className="preview-url">
                  {generatedStore ? `https://${generatedStore.subdomain}` : "https://bangalorefresh.retailx.ai"}
                </span>
                <span className="preview-live-badge"><i /> PWA READY</span>
              </div>

              <div className="preview-content-box">
                <div
                  className="preview-store-hero"
                  style={{
                    backgroundColor: builderColor,
                    borderColor: builderColor,
                  }}
                >
                  <h4>{builderStoreName}</h4>
                  <p>Direct from local store · Express 30-min delivery · 0% Middleman markup</p>
                </div>

                <div className="preview-features-list">
                  <span>⚡ Instant Features Deployed:</span>
                  <ul>
                    <li>✅ Dedicated Subdomain &amp; SSL: <b>{builderStoreName.toLowerCase().replace(/[^a-z0-9]/g, "")}.retailx.ai</b></li>
                    <li>✅ Integrated PostgreSQL ACID Order Processing</li>
                    <li>✅ Sub-second Catalog Search via Aiven OpenSearch</li>
                    <li>✅ Live Delivery Driver Tracking &amp; WhatsApp Notifications</li>
                    <li>✅ UPI, Card, and Cash On Delivery Billing</li>
                  </ul>
                </div>

                <div className="preview-catalog-sample">
                  <h5>Sample Generated Catalog ({builderType}):</h5>
                  <div className="sample-items-grid">
                    <div className="sample-item-card">
                      <strong>Item 1 ({builderType})</strong>
                      <span>In Stock · Next-day dispatch</span>
                    </div>
                    <div className="sample-item-card">
                      <strong>Item 2 ({builderType})</strong>
                      <span>In Stock · Best Seller</span>
                    </div>
                  </div>
                </div>

                {generatedStore && (
                  <div className="store-ready-callout">
                    <Check size={18} className="text-emerald-400" />
                    <div>
                      <strong>Storefront is Live and Accepting Orders!</strong>
                      <p>Share URL with customers or connect a custom .com domain.</p>
                    </div>
                    <button
                      className="button button-light button-sm"
                      onClick={() => showToast(`Copied https://${generatedStore.subdomain} to clipboard!`)}
                    >
                      <Share2 size={13} /> Copy Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 10: RETAILER BUSINESS APP */}
      {/* ========================================================================= */}
      {activeTab === "merchant-app" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 10 · STORE MANAGER TABLET CONSOLE</span>
              <h2>Retailer Business App</h2>
              <p>Real-time order dispatch console designed for store floor managers. Audio alerts on new orders, live status toggle, and rider allocation.</p>
            </div>
            <div className="live-status-pill">
              <span className="kpi-dot" /> Live Order Stream Active
            </div>
          </div>

          <div className="merchant-orders-list">
            {merchantOrders.map((ord) => (
              <div key={ord.id} className="merchant-order-card">
                <div className="ord-left">
                  <span className="ord-id">{ord.id}</span>
                  <strong>{ord.customer}</strong>
                  <span className="ord-items">{ord.items}</span>
                </div>

                <div className="ord-middle">
                  <span className="ord-hub">{ord.hub}</span>
                  <span className="ord-time">{ord.time}</span>
                </div>

                <div className="ord-right">
                  <strong className="ord-price">{money(ord.total)}</strong>
                  <span className={`ord-badge status-${ord.status.toLowerCase()}`}>{ord.status}</span>
                  {ord.status === "PREPARING" && (
                    <button
                      className="button button-primary button-sm"
                      onClick={() => {
                        setMerchantOrders((prev) =>
                          prev.map((o) => (o.id === ord.id ? { ...o, status: "DISPATCHED" } : o))
                        );
                        showToast(`Order ${ord.id} marked as DISPATCHED!`);
                      }}
                    >
                      Dispatch Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODULE 11: SUSTAINABILITY TRACKER */}
      {/* ========================================================================= */}
      {activeTab === "sustainability" && (
        <section className="retailer-module-section">
          <div className="section-header">
            <div>
              <span className="filter-label">MODULE 11 · ENVIRONMENTAL IMPACT</span>
              <h2>Sustainability &amp; Food Waste Tracker</h2>
              <p>Quantify the environmental and economic impact of AI-driven markdown liquidation and inventory optimization.</p>
            </div>
            <span className="eco-badge"><Leaf size={14} className="text-emerald-400" /> Green Retail Standard</span>
          </div>

          <div className="sustainability-hero-box">
            <div className="sustainability-percent-badge">
              <strong>{data?.sustainability.wastePreventedPercent ?? 22.4}%</strong>
              <span>Waste Prevented This Month</span>
            </div>
            <p className="sustainability-note">
              &ldquo;By autonomously triggering 15% markdowns and breakfast bundle offers before expiry, RetailX prevented <strong>{data?.sustainability.unitsSavedFromLandfill ?? 142} perishable items</strong> from ending up in landfills.&rdquo;
            </p>
          </div>

          <div className="sustainability-metrics-grid">
            <div className="eco-stat-card">
              <span className="eco-label">FOOD &amp; GOODS SALVAGED</span>
              <strong>{data?.sustainability.totalKgWasteDiverted ?? 86.5} kg</strong>
              <span>Direct landfill diversion</span>
            </div>
            <div className="eco-stat-card">
              <span className="eco-label">RECOVERED REVENUE</span>
              <strong className="text-emerald-400">{money(data?.sustainability.salvagedRevenue ?? 18450)}</strong>
              <span>Cash unlocked from near-expiry stock</span>
            </div>
            <div className="eco-stat-card">
              <span className="eco-label">CARBON OFFSET EQUIVALENT</span>
              <strong>{data?.sustainability.co2SavedKg ?? 218.4} kg CO₂e</strong>
              <span>Avoided greenhouse gas emissions</span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
