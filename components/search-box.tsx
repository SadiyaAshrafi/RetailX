"use client";

import { Search, ArrowUpRight, Mic, MicOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { api, type Product } from "@/lib/api";

export function SearchBox({ large = false, initialValue = "" }: { large?: boolean; initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const recognitionRef = useRef<unknown>(null);

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

  function startVoiceSearch() {
    if (typeof window === "undefined") return;

    type SpeechRecognitionWindow = Window & typeof globalThis & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };

    const win = window as SpeechRecognitionWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Voice search is supported in Chrome, Edge, and modern browsers.");
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
          setValue(transcript);
          router.push(`/products?q=${encodeURIComponent(transcript.trim())}`);
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
        onBlur={() => window.setTimeout(() => setOpen(false), 140)}
        placeholder={large ? "Search anything, try “bluetoth” or click mic..." : "Search products"}
        aria-label="Search products"
      />
      <button
        type="button"
        onClick={startVoiceSearch}
        className={`voice-search-btn ${isListening ? "listening" : ""}`}
        title="Voice search"
        aria-label="Voice search"
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
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
