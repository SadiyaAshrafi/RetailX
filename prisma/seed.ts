import "dotenv/config";
import { ensureProductIndex, prisma, searchClient } from "../server/services/aiven";
import { indexProduct } from "../server/services/search";

const cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"];

const catalog = [
  { id: "rx-bluetooth-earphones", name: "Bluetooth Earphones", category: "Audio", price: 1799, rating: 4.6, popularity: 780, imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1100&q=85", description: "Lightweight Bluetooth wireless earphones with clear calls, balanced sound, and all-day comfort." },
  { id: "rx-soundcore-q30", name: "Soundcore Space One", category: "Audio", price: 7999, rating: 4.8, popularity: 940, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=85", description: "Adaptive noise cancelling, a remarkably comfortable fit, and 40 hours of listening for the long way home." },
  { id: "rx-studio-headphones", name: "Studio Pro Headphones", category: "Audio", price: 12999, rating: 4.7, popularity: 810, imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1100&q=85", description: "Balanced studio sound with deep, detailed lows and a lightweight frame made for all-day sessions." },
  { id: "rx-mechanical-keyboard", name: "Keychron K2 Wireless", category: "Computing", price: 8999, rating: 4.9, popularity: 755, imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1100&q=85", description: "A compact mechanical keyboard with tactile switches, wireless connectivity, and a clean aluminum frame." },
  { id: "rx-gaming-mouse", name: "Logitech G Pro X", category: "Gaming", price: 6499, rating: 4.8, popularity: 880, imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1100&q=85", description: "Precision tracking and an ambidextrous shape tuned for competitive play and everyday work." },
  { id: "rx-monitor-4k", name: "Studio Display 27 4K", category: "Computing", price: 42999, rating: 4.6, popularity: 520, imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1100&q=85", description: "A crisp 27-inch 4K panel with true-to-life color and an adjustable stand for a better desk setup." },
  { id: "rx-smartwatch", name: "Pixel Watch 3", category: "Wearables", price: 24999, rating: 4.7, popularity: 660, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=85", description: "A bright, responsive smartwatch with health insights, turn-by-turn directions, and a refined profile." },
  { id: "rx-camera", name: "Fujifilm X-S20", category: "Photography", price: 119999, rating: 4.9, popularity: 415, imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1100&q=85", description: "A compact mirrorless camera with dependable autofocus, rich color profiles, and creator-ready video." },
  { id: "rx-speaker", name: "Marshall Emberton II", category: "Audio", price: 16999, rating: 4.8, popularity: 690, imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1100&q=85", description: "Room-filling sound in a durable, travel-friendly speaker with more than 30 hours of battery life." },
  { id: "rx-desk-lamp", name: "Anglepoise Type 75", category: "Home", price: 15499, rating: 4.6, popularity: 340, imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1100&q=85", description: "A precisely balanced task light that brings focused, comfortable illumination to any workspace." },
  { id: "rx-earbuds", name: "Nothing Ear (a)", category: "Audio", price: 7499, rating: 4.5, popularity: 915, imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1100&q=85", description: "Pocket-sized wireless audio with punchy bass, clear calls, and all-day comfort." },
  { id: "rx-controller", name: "Xbox Wireless Controller", category: "Gaming", price: 5999, rating: 4.7, popularity: 790, imageUrl: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1100&q=85", description: "A familiar, ergonomic controller with responsive triggers, textured grips, and broad device support." },
  { id: "rx-laptop-stand", name: "Twelve South Curve", category: "Computing", price: 6999, rating: 4.6, popularity: 460, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1100&q=85", description: "An elevated aluminum laptop stand that improves screen height and clears space on your desk." },
];

async function seed() {
  if (!process.env.DATABASE_URL || !searchClient) {
    throw new Error("Set Aiven PostgreSQL and Aiven OpenSearch credentials before seeding. No local services are used.");
  }
  await ensureProductIndex();
  for (const [position, item] of catalog.entries()) {
    const product = await prisma.product.upsert({
      where: { id: item.id },
      create: item,
      update: item,
    });
    for (const [cityIndex, city] of cities.entries()) {
      await prisma.inventory.upsert({
        where: { productId_city: { productId: product.id, city } },
        create: { productId: product.id, city, stockCount: Math.max(0, 6 + ((position * 7 + cityIndex * 5) % 18)) },
        update: {},
      });
    }
    await indexProduct(product.id);
  }
  console.log(`Seeded ${catalog.length} products and indexed them in Aiven OpenSearch.`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());