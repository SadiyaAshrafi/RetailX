export type CatalogItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  popularity: number;
  imageUrl: string;
  description: string;
  specs?: Record<string, string>;
  highlights?: string[];
  reviews?: { user: string; rating: number; date: string; comment: string; verified: boolean }[];
};

export const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"] as const;

export const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: "rx-bluetooth-earphones",
    name: "Bluetooth Earphones",
    category: "Audio",
    price: 1799,
    rating: 4.6,
    popularity: 780,
    imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1100&q=85",
    description: "Lightweight Bluetooth wireless earphones with clear calls, balanced sound, and all-day comfort.",
    highlights: ["Bluetooth 5.3", "IPX5 Sweat Resistance", "24hr Total Playtime", "Fast USB-C Charging"],
    specs: {
      "Battery Life": "24 Hours (with case)",
      "Connectivity": "Bluetooth 5.3 (10m range)",
      "Drivers": "10mm Dynamic Drivers",
      "Weight": "4.2g per earbud",
      "Microphone": "Dual ENC mic for calls",
    },
    reviews: [
      { user: "Aarav S.", rating: 5, date: "2 days ago", comment: "Incredible value for ₹1,799. Sound quality is surprisingly rich and bass is punchy.", verified: true },
      { user: "Priya M.", rating: 4, date: "1 week ago", comment: "Comfortable for all-day zoom calls. Fits securely while running.", verified: true },
    ],
  },
  {
    id: "rx-soundcore-q30",
    name: "Soundcore Space One",
    category: "Audio",
    price: 7999,
    rating: 4.8,
    popularity: 940,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85",
    description: "Adaptive noise cancelling, a remarkably comfortable fit, and 40 hours of listening for the long way home.",
    highlights: ["Hybrid Active Noise Cancelling", "LDAC Hi-Res Audio", "55hr Battery Life", "Multi-point Pairing"],
    specs: {
      "Battery Life": "40h (ANC on) / 55h (ANC off)",
      "Noise Cancellation": "2x stronger voice reduction",
      "Audio Codecs": "LDAC, AAC, SBC",
      "Drivers": "40mm custom diaphragm",
      "Weight": "265g",
    },
    reviews: [
      { user: "Rohan D.", rating: 5, date: "3 days ago", comment: "Blocks metro and flight hum completely. The ear cushions feel like memory foam clouds.", verified: true },
      { user: "Sneha K.", rating: 5, date: "2 weeks ago", comment: "Best ANC headphones under ₹10k. LDAC mode on Android is mind-blowing.", verified: true },
    ],
  },
  {
    id: "rx-studio-headphones",
    name: "Studio Pro Headphones",
    category: "Audio",
    price: 12999,
    rating: 4.7,
    popularity: 810,
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1100&q=85",
    description: "Balanced studio sound with deep, detailed lows and a lightweight frame made for all-day sessions.",
    highlights: ["Reference Tuning", "Detachable Braided Cable", "Open-Back Soundstage", "Velour Ear Pads"],
    specs: {
      "Frequency Response": "10Hz - 38,000Hz",
      "Impedance": "80 Ohms",
      "Transducer": "Dynamic Open-Back 45mm",
      "Cable": "3m straight + 1.2m coiled",
      "Weight": "280g",
    },
    reviews: [
      { user: "Vikram R.", rating: 5, date: "4 days ago", comment: "Mastering audio on these is a joy. Flat response, no bloated bass.", verified: true },
    ],
  },
  {
    id: "rx-mechanical-keyboard",
    name: "Keychron K2 Wireless",
    category: "Computing",
    price: 8999,
    rating: 4.9,
    popularity: 755,
    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1100&q=85",
    description: "A compact mechanical keyboard with tactile switches, wireless connectivity, and a clean aluminum frame.",
    highlights: ["75% Layout (84 Keys)", "Hot-swappable Gateron G Pro", "Mac & Windows Layouts", "4000mAh Battery"],
    specs: {
      "Switches": "Gateron Brown Tactile (Hot-swap)",
      "Connectivity": "Bluetooth 5.1 & Type-C Wired",
      "Keycaps": "Double-shot PBT OEM profile",
      "Battery": "Up to 240 hours without backlight",
      "Frame": "CNC Aluminum + ABS base",
    },
    reviews: [
      { user: "Tanmay B.", rating: 5, date: "Yesterday", comment: "Typing feel is buttery smooth. Works seamlessly switching between MacBook and PC.", verified: true },
    ],
  },
  {
    id: "rx-gaming-mouse",
    name: "Logitech G Pro X",
    category: "Gaming",
    price: 6499,
    rating: 4.8,
    popularity: 880,
    imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1100&q=85",
    description: "Precision tracking and an ambidextrous shape tuned for competitive play and everyday work.",
    highlights: ["Sub-63g Ultralight", "HERO 25K Sensor", "LIGHTSPEED Wireless", "Zero-Additive PTFE Feet"],
    specs: {
      "Sensor": "HERO 25K (100 - 25,600 DPI)",
      "Polling Rate": "1000Hz (1ms)",
      "Battery Life": "70 hours continuous motion",
      "Weight": "63 grams",
    },
    reviews: [
      { user: "Karan G.", rating: 5, date: "5 days ago", comment: "So lightweight it feels like an extension of your hand. Essential for Valorant.", verified: true },
    ],
  },
  {
    id: "rx-monitor-4k",
    name: "Studio Display 27 4K",
    category: "Computing",
    price: 42999,
    rating: 4.6,
    popularity: 520,
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1100&q=85",
    description: "A crisp 27-inch 4K panel with true-to-life color and an adjustable stand for a better desk setup.",
    highlights: ["4K UHD (3840 x 2160)", "99% sRGB / 95% DCI-P3", "90W USB-C Power Delivery", "Height & Pivot Stand"],
    specs: {
      "Resolution": "3840 x 2160 IPS @ 60Hz",
      "Brightness": "400 nits (HDR400)",
      "Ports": "1x USB-C (90W), 2x HDMI 2.0, 1x DP 1.4",
      "Ergonomics": "Tilt, Swivel, Pivot, Height 150mm",
    },
    reviews: [
      { user: "Aditi P.", rating: 5, date: "1 week ago", comment: "One cable setup with MacBook charges laptop and handles 4K video flawlessly.", verified: true },
    ],
  },
  {
    id: "rx-smartwatch",
    name: "Pixel Watch 3",
    category: "Wearables",
    price: 24999,
    rating: 4.7,
    popularity: 660,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=85",
    description: "A bright, responsive smartwatch with health insights, turn-by-turn directions, and a refined profile.",
    highlights: ["Actua AMOLED 2000 Nits", "Fitbit Advanced Health", "All-day 24h Battery with Fast Charge", "Wear OS 5.0"],
    specs: {
      "Display": "320 ppi AMOLED with Always-on",
      "Sensors": "cEDA, SpO2, ECG, Heart Rate, Skin Temp",
      "Water Resistance": "5 ATM / 50 meters",
      "Material": "100% Recycled Aluminum case",
    },
    reviews: [
      { user: "Nikhil V.", rating: 5, date: "3 days ago", comment: "Sleep tracking and ECG are spot-on. Gorgeous dome glass look.", verified: true },
    ],
  },
  {
    id: "rx-camera",
    name: "Fujifilm X-S20",
    category: "Photography",
    price: 119999,
    rating: 4.9,
    popularity: 415,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85",
    description: "A compact mirrorless camera with dependable autofocus, rich color profiles, and creator-ready video.",
    highlights: ["26.1MP X-Trans CMOS 4", "6.2K/30p & 4K/60p Video", "7.0-Stop In-Body Stabilization", "19 Film Simulation Modes"],
    specs: {
      "Sensor": "APS-C X-Trans CMOS 4 with X-Processor 5",
      "Video": "6.2K 30p 4:2:2 10-bit internal",
      "Battery": "NP-W235 (approx 750 frames)",
      "Autofocus": "AI Subject Detection (Birds, Cars, Animals)",
    },
    reviews: [
      { user: "Arjun N.", rating: 5, date: "2 weeks ago", comment: "The Fujifilm colors straight out of camera mean zero post-processing needed. Perfection.", verified: true },
    ],
  },
  {
    id: "rx-speaker",
    name: "Marshall Emberton II",
    category: "Audio",
    price: 16999,
    rating: 4.8,
    popularity: 690,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1100&q=85",
    description: "Room-filling sound in a durable, travel-friendly speaker with more than 30 hours of battery life.",
    highlights: ["True Stereophonic 360°", "30+ Hours Battery", "IP67 Dust & Waterproof", "Stack Mode Session"],
    specs: {
      "Sound": "2x 10W Class D Amplifiers",
      "Waterproofing": "IP67 Rugged build",
      "Charging": "3 hours full / 20 min gives 4h play",
      "Weight": "0.7 kg",
    },
    reviews: [
      { user: "Zoya F.", rating: 5, date: "1 month ago", comment: "Vintage rock guitar amp look, modern beast sound.", verified: true },
    ],
  },
  {
    id: "rx-desk-lamp",
    name: "Anglepoise Type 75",
    category: "Home",
    price: 15499,
    rating: 4.6,
    popularity: 340,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1100&q=85",
    description: "A precisely balanced task light that brings focused, comfortable illumination to any workspace.",
    highlights: ["Sir Kenneth Grange Design", "Constant Tension Spring Tech", "Cast Iron Base with Aluminum Cover", "Warm 2700K Eye-Care Light"],
    specs: {
      "Reach": "66cm extension",
      "Bulb": "E27 LED Bulb included (warm white)",
      "Base Diameter": "19.5cm weighted stable base",
    },
    reviews: [
      { user: "Dev K.", rating: 5, date: "1 week ago", comment: "Timeless design. You can position it with one finger and it stays put.", verified: true },
    ],
  },
  {
    id: "rx-earbuds",
    name: "Nothing Ear (a)",
    category: "Audio",
    price: 7499,
    rating: 4.5,
    popularity: 915,
    imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1100&q=85",
    description: "Pocket-sized wireless audio with punchy bass, clear calls, and all-day comfort.",
    highlights: ["Transparent Iconic Case", "45dB Smart ANC", "Hi-Res Audio Certified", "ChatGPT Integration"],
    specs: {
      "Drivers": "11mm Custom Dynamic Driver",
      "ANC": "Up to 45 dB with Adaptive Algorithm",
      "Battery": "42.5 hours total playback with case",
    },
    reviews: [
      { user: "Siddharth T.", rating: 5, date: "6 days ago", comment: "The design turns heads everywhere. Sound is punchy and dynamic.", verified: true },
    ],
  },
  {
    id: "rx-controller",
    name: "Xbox Wireless Controller",
    category: "Gaming",
    price: 5999,
    rating: 4.7,
    popularity: 790,
    imageUrl: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1100&q=85",
    description: "A familiar, ergonomic controller with responsive triggers, textured grips, and broad device support.",
    highlights: ["Hybrid D-Pad", "Textured Triggers & Bumpers", "Bluetooth & Xbox Wireless", "Custom Button Mapping"],
    specs: {
      "Compatibility": "Xbox Series X|S, Windows 11, iOS, Android",
      "Battery": "Up to 40 hours with AA batteries",
      "Port": "USB-C & 3.5mm audio jack",
    },
    reviews: [
      { user: "Rajesh S.", rating: 5, date: "3 weeks ago", comment: "Best PC controller bar none. Connects instantly with Bluetooth.", verified: true },
    ],
  },
  {
    id: "rx-laptop-stand",
    name: "Twelve South Curve",
    category: "Computing",
    price: 6999,
    rating: 4.6,
    popularity: 460,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1100&q=85",
    description: "An elevated aluminum laptop stand that improves screen height and clears space on your desk.",
    highlights: ["Ergonomic 6.5-inch Lift", "Matte Black Aluminum Curve", "Maximum Airflow Cooling", "Non-slip Silicone Pads"],
    specs: {
      "Material": "Single-piece Matte Aluminum",
      "Elevates": "Screens up by 6.5 inches (16.5 cm)",
      "Compatibility": "Fits all laptops 11\" to 17\"",
    },
    reviews: [
      { user: "Meera K.", rating: 5, date: "2 weeks ago", comment: "Fixed my neck strain completely. Looks sleek on my walnut desk.", verified: true },
    ],
  },
];
