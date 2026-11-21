# ☁️ Aiven Cloud Live Connections & Judge Demo Guide

This guide is for the team member in charge of the **Aiven Cloud Console** (`https://console.aiven.io`).  
It covers **exact setup steps**, **how to verify live connections**, and **how to show live proof to judges** during the hackathon presentation.

---

## 🎯 1. Overview of the 3 Aiven Services

Your app connects to 3 managed Aiven services in your Aiven Project (`ashrafilohar816-0e63`):

| Service | Type | Role in RetailX | Main Tab to Show Judges |
| :--- | :--- | :--- | :--- |
| **`pg-10219e0d`** | Aiven for PostgreSQL | Source of truth (Products, Carts, Orders, Inventory, Event Logs) | **Current queries**, **Databases & Tables** |
| **`kafka-1cbf9a15`** | Aiven for Apache Kafka | Event bus for real-time order processing and search sync | **Topics** (`order-created`), **Messages** |
| **`os-3a531f7c`** | Aiven for OpenSearch | Sub-15ms fuzzy product search & autocomplete engine | **Indexes** (`products`), **OpenSearch Dashboards** |

---

## 🛠️ 2. Exact Setup Checklist in Aiven Console

### 🐘 Service 1: Aiven for PostgreSQL (`pg-10219e0d`)
1. Log in to **[Aiven Console](https://console.aiven.io)**.
2. Select your project and click on the **PostgreSQL** service (`pg-10219e0d`).
3. **Connection Information:**
   - Database name: `defaultdb`
   - User: `avnadmin`
   - SSL Mode: `require`
4. **Push Schema & Seed Data (if not already done):**
   In terminal on your project:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
5. **What to verify in Aiven Console:**
   - Go to **Databases & Tables** tab -> open `defaultdb`.
   - You should see the models:
     - `Product` (13 products)
     - `Inventory` (52 records: 13 products × 4 cities)
     - `Order` & `OrderItem`
     - `Cart` & `CartItem`
     - `OutboxEvent` & `EventLog`
   - Go to **Metrics** or **Current queries** to verify active client connections from Vercel / Next.js.

---

### 📨 Service 2: Aiven for Apache Kafka (`kafka-1cbf9a15`)
1. In Aiven Console, click on the **Kafka** service (`kafka-1cbf9a15`).
2. **Check/Create Required Topics:**
   Go to the **Topics** tab. Make sure these **3 topics** are created (create them if missing):
   
   | Topic Name | Partitions | Replication | Cleanup Policy |
   | :--- | :--- | :--- | :--- |
   | `order-created` | 1 | 1 | `delete` |
   | `inventory-updated` | 1 | 1 | `delete` |
   | `search-sync` | 1 | 1 | `delete` |

3. **Enable Kafka REST / Schema Registry (Optional but Recommended):**
   - In Kafka **Overview** -> under *Service integrations* or *Advanced configuration*, ensure **Apache Kafka REST** is enabled if you want to inspect messages directly in the web UI.
4. **How to view Live Messages in Aiven Console:**
   - Click on the topic: **`order-created`**
   - Click the **Messages** tab.
   - Click **Fetch Messages** (Format: *JSON* or *Text*).
   - Whenever an order is checked out on RetailX, a new event record appears here instantly!

---

### 🔍 Service 3: Aiven for OpenSearch (`os-3a531f7c`)
1. In Aiven Console, click on the **OpenSearch** service (`os-3a531f7c`).
2. **Check the Index:**
   - Go to the **Indexes** tab.
   - You should see the index: **`products`**.
   - Health should be **Green**, with docs count around **13**.
3. **OpenSearch Dashboards:**
   - In the service overview, find the **OpenSearch Dashboards** connection link.
   - Click the link, sign in with `avnadmin` and your OpenSearch password.
   - Open **Dev Tools** (wrench icon in left menu).
   - Run:
     ```json
     GET products/_search
     {
       "query": { "match_all": {} }
     }
     ```
   - This proves to the judges that the products are directly indexed in Aiven OpenSearch.

---

## ⚡ 3. The Killer Live Presentation Script (Show Judges Live Proof!)

> **Tip:** Split duties! Teammate A controls the **RetailX Website**, while Teammate B has the **Aiven Cloud Console** open on a shared screen.

### Step-by-Step Proof Flow:

#### 1. Prove All 3 Services Are Connected
- Open the live health endpoint in the browser:  
  `https://retail-x-nine.vercel.app/api/health`
- Show the judges the JSON response:
  ```json
  {
    "services": {
      "postgres": "connected",
      "kafka": "connected",
      "openSearch": "connected"
    },
    "searchIndex": "products",
    "live": true
  }
  ```
- **Say:** *"Here is our real-time health probe verifying live handshakes with all 3 Aiven cloud clusters."*

#### 2. Show Live OpenSearch Fuzzy Search
- Go to the RetailX store.
- In the search bar, deliberately type a typo: `bluetoth earphones`.
- Hit search. The results return in **under 15 milliseconds**.
- Switch to Aiven Console -> OpenSearch -> Show the `products` index statistics.
- **Say:** *"We use Aiven OpenSearch with an edge-ngram autocomplete analyzer and fuzzy matching. Typos are tolerated and search queries never hit a heavy relational scan."*

#### 3. The Big Moment: Live Order -> Kafka Event Stream -> Postgres Outbox
- On the website, add **Soundcore Space One** to cart and proceed to Checkout (`/checkout`).
- Apply coupon `HACKATHON2026` (20% off) and submit the order.
- Order confirmed! Copy the **Order ID** (e.g. `rx-ord-xxxx`).
- **Immediately switch to Aiven Console -> Kafka:**
  1. Open topic: `order-created`
  2. Click **Messages** -> **Fetch Messages**
  3. Show the judges the live message that arrived with:
     ```json
     {
       "orderId": "rx-ord-xxxx",
       "totalAmount": 6399,
       "occurredAt": "2026-11-21T..."
     }
     ```
- **Switch to Aiven Console -> PostgreSQL:**
  1. Show the `Order` table count incremented by 1.
  2. Show the `EventLog` table with the processed record.
- **Say:** *"Notice how this is truly event-driven: the checkout transaction creates the order in PostgreSQL and asynchronously emits an `ORDER_CREATED` event onto Aiven Kafka. Downstream inventory services and OpenSearch sync listeners consume it in real time."*

#### 4. Show Admin Event Simulator
- In RetailX, navigate to `/admin` (Key: `202006`).
- Under the **Simulate Event Toolbar**, click **"Simulate ORDER_CREATED"** or **"Simulate INVENTORY_UPDATED"**.
- Show the live event ticker update immediately in the UI.
- Refresh the Aiven Kafka topic messages to show the simulated event landed in the topic.

---

## 🔑 4. Environment Variables Mapping (Reference)

If you need to verify or update the keys in Vercel or `.env`:

```env
# 1. AIVEN POSTGRESQL
DATABASE_URL="postgres://avnadmin:[PASSWORD]@pg-10219e0d-ashrafilohar816-0e63.k.aivencloud.com:10541/defaultdb?sslmode=require"

# 2. AIVEN KAFKA
KAFKA_BROKERS="kafka-1cbf9a15-ashrafilohar816-0e63.f.aivencloud.com:10554"
KAFKA_USERNAME="avnadmin"
KAFKA_PASSWORD="[KAFKA_PASSWORD]"
KAFKA_SASL_MECHANISM="SCRAM-SHA-256"
KAFKA_SSL="true"

# 3. AIVEN OPENSEARCH
OPENSEARCH_NODE="https://avnadmin:[OPENSEARCH_PASSWORD]@os-3a531f7c-ashrafilohar816-0e63.j.aivencloud.com:10541"
OPENSEARCH_USERNAME="avnadmin"
OPENSEARCH_PASSWORD="[OPENSEARCH_PASSWORD]"
OPENSEARCH_INDEX="products"
OPENSEARCH_TLS_REJECT_UNAUTHORIZED="true"
```

---

## 🛡️ 5. What If WiFi or Cloud Network Delays Happen?
RetailX is architected with a **3-tier graceful fallback**:
`Aiven OpenSearch` ➡️ `Aiven PostgreSQL` ➡️ `In-Memory Zero-Downtime Store`.  
Even if external cloud network latency spikes, the frontend **never crashes** and will always seamlessly display products and place orders. You can even brag about this to the judges as high-availability fault tolerance!
