# 🥬 FreshMart – Multi-Vendor Grocery Marketplace

> A production-ready, commercial-grade Multi-Vendor Grocery Marketplace web application built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**, completely converted and expanded from Google Stitch MCP designs.

---

## 🌟 Architecture & 4 Core Actors

FreshMart powers a complete 4-sided hyper-local grocery ecosystem:

### 1. 🛒 Customer Grocery Marketplace
- **Homepage (`/`)**: Promotional hero carousel, cold-chain temperature speed hub, popular categories, flash harvest countdown sales, Brooklyn's most loved groceries, featured stores, and customer trust proofs.
- **Marketplace Catalog (`/catalog`)**: Aisle browser with real-time multi-faceted filters (Departments, Organic-only checkbox, Store origin, Price slider), sorting (Featured, Rating, Price), and Grid / List views.
- **Store Directory & Storefronts (`/stores`, `/stores/[slug]`)**: Dedicated merchant storefront for *GreenField Organic Market* with delivery time, ratings, store-specific deals, and aisle inventory.
- **Product Details Page (`/product/[id]`)**: High-res image gallery, certified organic badge, farm origin tracking, harvest and peak freshness countdown dates, nutritional values, package variation selector, customer reviews, and related produce.
- **Shopping Cart (`/cart`)**: Real-time multi-vendor grouped basket, quantity management, subtotal breakdown, promo code support (`FRESH5`), courier partner tip picker, and cold-chain safety notes.
- **Express Checkout (`/checkout`)**: Delivery destination, drop-off notes, delivery time slot selection (30-min express, afternoon eco, evening), payment methods (Visa, Apple Pay), and order confirmation.
- **Customer Account (`/account`)**: Profile management, live active order tracker with 4-stage delivery timeline, saved destinations, and payment methods.
- **Refund & Return Center (`/refunds`)**: 100% Instant Freshness Guarantee claim form, order/item selector, quality reasons, photo evidence upload, and refund ledger.

### 2. 🏬 Vendor Management Portal (`/vendor`)
- **Overview (`/vendor`)**: Total sales ($1,482 today), orders count, low-stock warnings, live incoming fulfillment queue with one-tap **Accept** & **Reject**, top-selling SKUs, and bi-weekly payout calculation.
- **Product Catalog (`/vendor/products`)**: SKU management, pricing, category classification, and interactive **Add New SKU** modal.
- **Stock & Inventory (`/vendor/inventory`)**: Real-time buffer threshold alerts and instant out-of-stock storefront toggles.
- **Batch Harvest & Expiry Countdown (`/vendor/expiry`)**: Perishable produce expiration tracking, automated flash discount triggers to prevent food waste.
- **Orders Fulfillment (`/vendor/orders`)**: Order processing workflow (Accept & Pack -> Hand to Courier -> In Transit -> Delivered).
- **Sales Analytics (`/vendor/analytics`)**: Gross Merchandise Value (GMV), 8% platform fee commission split, net merchant transfer, and 7-day revenue breakdown chart.
- **Produce Reviews (`/vendor/reviews`)**: Customer reviews on produce freshness, ripeness, and packaging.
- **Commission & Payouts (`/vendor/payouts`)**: Automated bi-weekly ACH settlement history into Chase Business Checking.
- **Store Settings (`/vendor/settings`)**: Store operating hours, delivery radius, hero banner configuration.

### 3. 👑 Super-Admin Platform Operations (`/admin`)
- **Platform Overview (`/admin`)**: Total platform GMV ($142,850), commission revenues ($11,428), active store count (45), active delivery fleet (28 couriers), and cold-chain telemetry health.
- **Vendor KYC Approvals (`/admin/vendors`)**: Food safety permits, certified organic accreditations inspection, and one-tap **Approve / Reject Store** audit decisions.
- **Platform Orders (`/admin/orders`)**: Unified order feed across all 45 stores with courier partner telemetry.
- **Refund Claims & Disputes (`/admin/refunds`)**: Quality Guarantee claims inspection, merchant dispute reviews, and one-tap reimbursements.
- **Vendor Payout Settlement (`/admin/payouts`)**: Bi-weekly ACH escrow releases, commission holdbacks, and banking batch transfers.

### 4. 🛵 Courier Partner App (`/courier`)
- **Assigned Deliveries (`/courier`)**: Active shift batch manifest, consolidated multi-stop route distance, and trip payout with customer tips.
- **Turn-by-Turn GPS Navigation (`/courier/live-route`)**: Live route guidance, traffic ETA, one-tap customer calling, cold-box sensor telemetry, and delivery completion confirmation.
- **Batch Manifest & Temperature (`/courier/manifest`)**: Audited packing list with real-time sub-4°C sensor readings.
- **Earnings & Tips (`/courier/earnings`)**: Daily trip earnings, 100% courier tip payouts, and instant free ACH cashout.
- **Profile & Equipment (`/courier/profile`)**: Inspected 40L thermal cold-chain box verification and cargo e-bike credentials.

---

## 🎨 Role Switcher Widget

A persistent floating dock is mounted on the bottom right of every page, allowing you to instantly switch roles between:
- 🛒 **Customer Store** (`/`)
- 🛍️ **Marketplace Catalog** (`/catalog`)
- 🏬 **Vendor Dashboard** (`/vendor`)
- 👑 **Super-Admin Operations** (`/admin`)
- 🛵 **Courier Partner App** (`/courier`)

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4
- **Typography**: Plus Jakarta Sans
- **Icons**: Lucide React
- **Design Source**: Google Stitch MCP

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 📁 Repository Structure

```
├── src/
│   ├── app/
│   │   ├── page.tsx               # Customer Homepage
│   │   ├── catalog/page.tsx       # Marketplace Catalog & Filters
│   │   ├── stores/                # Store directory & storefronts
│   │   ├── product/[id]/page.tsx  # Product Details Page (PDP)
│   │   ├── cart/page.tsx          # Multi-Vendor Cart
│   │   ├── checkout/page.tsx      # Express Checkout
│   │   ├── account/page.tsx       # Customer Account & Tracking
│   │   ├── refunds/page.tsx       # Refund & Return Center
│   │   ├── vendor/                # Vendor Dashboard Suite
│   │   ├── admin/                 # Super-Admin Operations Suite
│   │   └── courier/               # Courier Partner App Suite
│   ├── components/
│   │   ├── layout/                # Headers & Footers
│   │   ├── ui/                    # ProductCard, FlashDeals, Steppers
│   │   └── shared/                # Persistent RoleSwitcher Dock
│   ├── data/                      # Realistic mock data
│   └── lib/                       # Utility functions
├── stitch-designs/                # Original HTML screens from Google Stitch MCP
└── tailwind.config.ts
```

---

## 📄 License
MIT License. Created for the **FreshMart Multi-Vendor Grocery Marketplace** project.
