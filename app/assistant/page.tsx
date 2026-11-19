"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowUpRight, Check, MapPin, Mic, MicOff, Search, ShoppingBag, Sparkles, User, Zap } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { api, cartId, money, notifyCartChanged, type Product, type SearchResult } from "@/lib/api";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  products?: Product[];
  bundle?: {
    title: string;
    savings: string;
    items: Product[];
    bundlePrice: number;
  } | null;
  timestamp: string;
};

const SUGGESTED_PROMPTS = [
  "Best Bluetooth earphones under ₹2,000",
  "Show gaming gear in Bengaluru",
  "A quiet mechanical keyboard for coding",
  "Noise cancelling headphones for travel under ₹10,000",
  "Recommend a monitor for creative work",
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      text: "Hello! I’m the RetailX AI Commerce Concierge. I have live access to our PostgreSQL catalog, OpenSearch semantic engine, and city-by-city warehouse inventory.\n\nTell me what gear you need, your budget, or your city, and I'll find the best options in stock right now.",
      timestamp: "Just now",
    },
  ]);
  const [bundleAdded, setBundleAdded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function startVoiceInput() {
    if (typeof window === "undefined") return;

    type SpeechRecognitionWindow = Window & typeof globalThis & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };

    const win = window as SpeechRecognitionWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Voice input is supported in modern Chrome and Edge browsers.");
      return;
    }

    if (isListening && recognitionRef.current) {
      (recognitionRef.current as any).stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        if (transcript) {
          setInput(transcript);
          void handleSend(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  async function handleSend(textToSend?: string) {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api<{
        answer: string;
        products: Product[];
        bundle?: Message["bundle"];
      }>("/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: queryText }),
      });

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: res.answer,
        products: res.products,
        bundle: res.bundle,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      const errorMessage: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "assistant",
        text: "I encountered a hiccup connecting to the search service. Please try asking again or check our catalog directly.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function addBundleToBag(bundle: NonNullable<Message["bundle"]>) {
    try {
      for (const item of bundle.items) {
        await api(`/cart/${cartId()}/items`, {
          method: "POST",
          body: JSON.stringify({ productId: item.productId, quantity: 1 }),
        });
      }
      notifyCartChanged();
      setBundleAdded(true);
      window.setTimeout(() => setBundleAdded(false), 2000);
    } catch {
      alert("Could not add bundle items to bag.");
    }
  }

  return (
    <main className="assistant-page page-width">
      <div className="assistant-intro">
        <div className="assistant-large-icon"><Sparkles size={24} /></div>
        <div className="eyebrow"><span className="eyebrow-line" /> THE RETAILX AI CONCIERGE</div>
        <h1>Your personal shopper.<br /><em>Powered by live data.</em></h1>
        <p>Ask in natural speech or text. I evaluate inventory, pricing, and specs in real time.</p>
      </div>

      {/* Suggested prompts */}
      <div className="assistant-prompts">
        <span>TRY ASKING</span>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button key={prompt} onClick={() => void handleSend(prompt)} disabled={loading}>
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="assistant-chat-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.sender}`}>
            <div className="message-avatar">
              {msg.sender === "assistant" ? <Sparkles size={16} /> : <User size={16} />}
            </div>
            <div className="message-bubble">
              <div className="message-header">
                <strong>{msg.sender === "assistant" ? "RetailX AI" : "You"}</strong>
                <span className="message-time">{msg.timestamp}</span>
              </div>
              <div className="message-text">
                {msg.text.split("\n\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              {/* Recommended Bundle Card */}
              {msg.bundle && (
                <div className="assistant-bundle-card">
                  <div className="bundle-badge">
                    <Zap size={13} /> {msg.bundle.savings}
                  </div>
                  <h4>{msg.bundle.title}</h4>
                  <div className="bundle-items-row">
                    {msg.bundle.items.map((item) => (
                      <div key={item.productId} className="bundle-mini-item">
                        <img src={item.imageUrl} alt={item.name} />
                        <div>
                          <strong>{item.name}</strong>
                          <span>{money(item.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bundle-action-row">
                    <div className="bundle-price-wrap">
                      <span>Bundle Price</span>
                      <strong>{money(msg.bundle.bundlePrice)}</strong>
                    </div>
                    <button
                      onClick={() => addBundleToBag(msg.bundle!)}
                      className={`button button-primary bundle-btn ${bundleAdded ? "added" : ""}`}
                    >
                      {bundleAdded ? <><Check size={14} /> Added to bag</> : <><ShoppingBag size={14} /> Add Bundle to Bag</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Matched Product Grid */}
              {msg.products && msg.products.length > 0 && (
                <div className="assistant-matched-grid">
                  <div className="matched-grid-header">
                    <span className="filter-label">LIVE MATCHES FROM AIVEN OPENSEARCH</span>
                  </div>
                  <div className="product-grid">
                    {msg.products.map((product, index) => (
                      <ProductCard key={product.productId} product={product} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="message-avatar"><Sparkles size={16} /></div>
            <div className="message-bubble thinking-bubble">
              <span className="ai-thinking-pulse" /> Scanning live catalog and querying OpenSearch index...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        className="assistant-prompt-form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          rows={2}
          placeholder="Ask for anything, e.g. “Best wireless headphones under ₹8,000 for long meetings”..."
          aria-label="Describe what you are looking for"
        />
        <button
          type="button"
          onClick={startVoiceInput}
          className={`assistant-mic-btn ${isListening ? "listening" : ""}`}
          title="Speak your request"
          aria-label="Voice input"
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button
          type="submit"
          className="assistant-send"
          aria-label="Send query"
          disabled={loading || !input.trim()}
        >
          {loading ? <span className="loading-dots">···</span> : <ArrowRight size={18} />}
        </button>
      </form>
    </main>
  );
}
