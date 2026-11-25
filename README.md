# 🥬 FreshMart - Multi-Vendor Grocery Marketplace

> A modern, hyper-local multi-vendor grocery and organic food delivery platform UI built with Tailwind CSS, Plus Jakarta Sans, and Google Material Symbols. Designed and exported via Google Stitch MCP.

---

## 🌟 Overview & Architecture

**FreshMart** connects local organic family farms, boutique bakeries, artisanal butchers, and specialty markets with local urban neighborhoods. It offers a complete 4-role marketplace ecosystem:

1. **Customer Marketplace**: Hyper-local organic grocery shopping, flash harvest sales, multi-vendor cart, express 30-min delivery, and instant freshness guarantee refunds.
2. **Vendor Management Portal (Merchant Dashboard)**: Real-time stock levels, automated perishable batch/expiry countdowns, sales analytics, store branding, and order fulfillment.
3. **Courier Partner App**: Multi-stop hyper-local route navigation, cold-chain temperature monitoring, batch order picking manifests, and driver earnings/tips tracking.
4. **Super-Admin Platform Operations**: Platform-wide GMV analytics, organic farm vendor onboarding & KYC verification, commission split configurations, and merchant payouts.

---

## 🚀 Interactive Screen Directory (`portal.html`)

To explore and test all screens in one interactive hub, open **[`portal.html`](./portal.html)** in any browser.

### 📱 Screen Catalog Breakdown (22 Production-Ready Screens)

#### 🛒 1. Customer Grocery Marketplace
- **[`index.html`](./index.html)**: Main Marketplace Homepage (Hero cold-chain speed hub, category carousel, flash harvest deals, product cards with quantity stepper).
- **[`catalog.html`](./catalog.html)**: Marketplace & Aisle Catalog (Multi-faceted filters: Organic, Non-GMO, Local Farms, Price Range, Dietary tags).
- **[`store-details.html`](./store-details.html)**: Storefront View for *GreenField Organic Market* (Store banner, delivery ETA, reviews, vendor aisle inventory).
- **[`product-details.html`](./product-details.html)**: Product Detail Page (*Organic Hass Avocados* with farm origin, nutritional breakdown, freshness warranty).
- **[`checkout.html`](./checkout.html)**: Shopping Cart & Checkout (Multi-vendor split checkout, courier tip selector, express delivery windows).
- **[`customer-orders.html`](./customer-orders.html)**: Customer Account & Orders (Live order tracking status, historical invoices, re-order shortcuts).
- **[`refund-center.html`](./refund-center.html)**: Refund & Return Center (100% Instant Freshness Guarantee claims with photo upload).

#### 🏬 2. Vendor Management Portal (`/vendor`)
- **[`vendor/dashboard.html`](./vendor/dashboard.html)**: Merchant Overview (Real-time order throughput, daily sales volume, active dispatch queues).
- **[`vendor/inventory.html`](./vendor/inventory.html)**: Stock & Inventory Management (Real-time SKU thresholds, low-stock alerts, out-of-stock toggles).
- **[`vendor/batch-expiry.html`](./vendor/batch-expiry.html)**: Perishable Batch & Expiry Tracker (Dynamic harvest countdown, near-expiry automated flash discounts).
- **[`vendor/analytics.html`](./vendor/analytics.html)**: Sales Analytics & Revenue Reports (GMV, platform commission deductions, net merchant payouts).
- **[`vendor/reviews.html`](./vendor/reviews.html)**: Customer Reviews & Ratings (Produce quality ratings, verified buyer feedback, merchant replies).
- **[`vendor/settings.html`](./vendor/settings.html)**: Store Settings (Operating hours, delivery radius, minimum order limits, dispatch rules).
- **[`vendor/profile.html`](./vendor/profile.html)**: Store Profile & Branding (Merchant bio, organic certifications, storefront banner preview).
- **[`vendor/banner-upload.html`](./vendor/banner-upload.html)**: Store Profile & Banner Upload Modal (Interactive high-res banner crop and upload modal).

#### 🛵 3. Courier & Driver Partner App (`/courier`)
- **[`courier/live-route.html`](./courier/live-route.html)**: Live Turn-by-Turn Route & Navigation (Active deliveries, traffic ETA, one-tap customer call).
- **[`courier/manifest.html`](./courier/manifest.html)**: Assigned Orders & Batch Manifest (Order picking verification, insulated cold-box temperature logs).
- **[`courier/earnings.html`](./courier/earnings.html)**: Driver Earnings & Payout History (Trip pay, surge bonuses, customer tips, instant cashout).
- **[`courier/profile.html`](./courier/profile.html)**: Driver Profile & Equipment (Vehicle inspection records, thermal insulation bag validation).

#### 👑 4. Super-Admin Platform Operations (`/admin`)
- **[`admin/overview.html`](./admin/overview.html)**: Platform Control Center (Live GMV ticker, platform commission revenues, courier heatmaps).
- **[`admin/vendor-approvals.html`](./admin/vendor-approvals.html)**: Vendor KYC & Licensing Approvals (Organic farm certification audits, document inspection).
- **[`admin/vendor-payouts.html`](./admin/vendor-payouts.html)**: Vendor Payouts & Escrow Settlement (Automated batch payout cycles, banking transfers).

---

## 🛠️ Tech Stack & Design System

- **Framework**: Semantic HTML5 with modern component architecture
- **CSS Engine**: [Tailwind CSS](https://tailwindcss.com/) (CDN utility-first styling)
- **Typography**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [Inter](https://fonts.google.com/specimen/Inter)
- **Iconography**: [Google Material Symbols Outlined](https://fonts.google.com/icons)
- **Primary Color**: `#006b2c` / `#16a34a` (Fresh Organic Green)
- **Secondary Color**: `#2e6a41` (Deep Forest)
- **Accent/Alert Color**: `#825100` / `#f59e0b` (Warm Harvest Amber)

---

## 💻 How to Run Locally

You can open any HTML file directly in your browser, or start a local static server:

```bash
# Using Python 3 built-in server
python3 -m http.server 3000

# Open in browser:
# http://localhost:3000/portal.html (Screen Hub)
# http://localhost:3000/index.html  (Main Store)
```

Or using Node `npx serve`:
```bash
npx serve .
```

---

## 📦 Git & GitHub Workflow

Pushing updates to GitHub:

```bash
git add .
git commit -m "Add full FreshMart UI suite: Customer, Vendor, Courier & Admin portals"
git push -u origin main
```

---

## 📄 License
MIT License. Created for the **FreshMart Multi-Vendor Grocery Marketplace** project.
