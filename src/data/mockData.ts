export interface Store {
  id: string;
  name: string;
  slug: string;
  rating: number;
  reviewsCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  distance: string;
  tags: string[];
  logo: string;
  banner: string;
  description: string;
  address: string;
  featured?: boolean;
}

export interface Product {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  unit: string;
  category: string;
  rating: number;
  reviewsCount: number;
  image: string;
  stock: number;
  organic: boolean;
  origin: string;
  description: string;
  nutrition?: {
    calories: string;
    fat: string;
    carbs: string;
    protein: string;
  };
  harvestDate?: string;
  expiryDate?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
  bgColor: string;
  textColor: string;
}

export const CATEGORIES: Category[] = [
  { id: "fruits-veggies", name: "Fruits & Vegetables", icon: "Salad", itemCount: 320, bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
  { id: "dairy-eggs", name: "Dairy & Eggs", icon: "Milk", itemCount: 185, bgColor: "bg-amber-50", textColor: "text-amber-700" },
  { id: "meat-seafood", name: "Meat & Seafood", icon: "Fish", itemCount: 140, bgColor: "bg-rose-50", textColor: "text-rose-700" },
  { id: "bakery", name: "Artisan Bakery", icon: "Croissant", itemCount: 95, bgColor: "bg-orange-50", textColor: "text-orange-700" },
  { id: "beverages", name: "Beverages", icon: "Coffee", itemCount: 210, bgColor: "bg-cyan-50", textColor: "text-cyan-700" },
  { id: "snacks", name: "Healthy Snacks", icon: "Cookie", itemCount: 160, bgColor: "bg-yellow-50", textColor: "text-yellow-700" },
  { id: "household", name: "Household Essentials", icon: "Sparkles", itemCount: 280, bgColor: "bg-indigo-50", textColor: "text-indigo-700" },
  { id: "frozen", name: "Frozen Foods", icon: "Snowflake", itemCount: 115, bgColor: "bg-sky-50", textColor: "text-sky-700" },
  { id: "personal-care", name: "Personal Care", icon: "Heart", itemCount: 130, bgColor: "bg-pink-50", textColor: "text-pink-700" },
];

export const STORES: Store[] = [
  {
    id: "store-1",
    name: "GreenField Organic Market",
    slug: "greenfield-organic",
    rating: 4.9,
    reviewsCount: 1420,
    deliveryTime: "25-35 mins",
    deliveryFee: 1.99,
    minOrder: 15.00,
    distance: "1.2 miles",
    tags: ["100% Certified Organic", "Local Family Farm", "Cold-Chain Verified"],
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuANtb9FUR8SNrfhhh_2zSi3VJBOWmixdSAL5fl70nUfnhJ2nwA1NhPQg6kVhc5Er2mUgiZGnLxz3Z-1_RKaP__ubArECHKYPf5sKV689XqEDKM-aYhDuAYxRs4DNYqutVJ4JdsqvFy_47dz9H1_DAd2pozMmoD5Clq0ki1gskaKuwutB0Crvxiiocj2qT73Rle0DwLqcnYd9zy-kg3_KJtqela3Z6kzG5vubPMnJClG",
    banner: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200",
    description: "Brooklyn's premier regenerative organic farm market, harvesting crisp heirloom produce, microgreens, and stone fruits at dawn daily.",
    address: "742 Atlantic Ave, Brooklyn, NY 11217",
    featured: true,
  },
  {
    id: "store-2",
    name: "SunHarvest Direct",
    slug: "sunharvest-direct",
    rating: 4.8,
    reviewsCount: 890,
    deliveryTime: "20-30 mins",
    deliveryFee: 2.49,
    minOrder: 20.00,
    distance: "0.8 miles",
    tags: ["Pasture-Raised Eggs", "Grass-Fed Dairy", "Non-GMO"],
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBswS68lvoQpNUxFtSWesmhcbT1OnGTdWhSAJbQTBsSxkkeU4APtaC_LbL6KCtl2M78hcrrLlRNw0XVJy1p5nQ6v4E1l215Ge6KId3PYIJuJ_AXzgTFCEc2U1f6Mo8eRJBlPEPRUtjU4QIgHuXEndH95V8R_-Ars3AwJ6Z7QCQIv-CHoPV_ZaooCHljKx5FI8N6TTcYwVHRe8YAdNsQaoywapEFmEirzPZFY_XSF7PT",
    banner: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1200",
    description: "Direct farm cooperative sourcing raw milk, cultured artisan butter, and pasture-raised brown eggs with rich orange yolks.",
    address: "182 Bedford Ave, Williamsburg, NY 11211",
    featured: true,
  },
  {
    id: "store-3",
    name: "Valley Fresh Butcher & Deli",
    slug: "valley-fresh-butcher",
    rating: 4.9,
    reviewsCount: 1104,
    deliveryTime: "30-40 mins",
    deliveryFee: 2.99,
    minOrder: 25.00,
    distance: "1.9 miles",
    tags: ["Wild Caught Seafood", "Dry-Aged Steaks", "Artisan Charcuterie"],
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7E13dHpbUaVKFaIzrnQeKorK39GfEssNzrZELxKKT8PcqnuWy7LnWDJFBqUKkd5tXIL0KHrtE2D5TokjgVEQmergPnGVUubfWldABVJZHYlxjbSuIuf4mc6yCnj55B5TBFOd0_57bgk8Gx92Jl7qfTVLX5otZZ-MXlz-iumB_4UNcZPG0R7-mGhI7fkWWPt3W8p6Qm2hNLiQU0nv1QmvRHBnFYEeeoA5wv9a-4H9U",
    banner: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=1200",
    description: "Old-world craft butcher delivering dry-aged prime cuts, hand-made sausages, and line-caught wild ocean seafood.",
    address: "310 Court St, Cobble Hill, NY 11231",
    featured: true,
  },
  {
    id: "store-4",
    name: "Brooklyn Artisan Bakery",
    slug: "brooklyn-artisan-bakery",
    rating: 4.9,
    reviewsCount: 760,
    deliveryTime: "15-25 mins",
    deliveryFee: 0.99,
    minOrder: 10.00,
    distance: "0.5 miles",
    tags: ["Wild Sourdough", "Stoneground Flours", "Baked Hourly"],
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn7-a_ReTYg4xkzU_cIamwkifjr60cMq0Jlp5SMbTleY8kixq8og1JgZuHz9XMG4St5vknhS47B0Cvexmq2qVvlCE26AELZLwrI-Fhs8S6T34xQVyfABuj8IksaHU2ej8gJ6_RFvypvpeBPgGMuTkhaXlmYx_-kdZP0Z-h7OCssJ3FNToOVuYCjr_3qqn2ac_myo1vZx3f0x18ioK00gd66xQBB5TkAi7hUWF36kFr",
    banner: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200",
    description: "Naturally fermented sourdough breads, French laminated butter croissants, and organic brioche baked fresh every morning.",
    address: "95 5th Ave, Park Slope, NY 11217",
    featured: false,
  }
];

export const PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Organic Hass Avocados",
    storeId: "store-1",
    storeName: "GreenField Organic Market",
    price: 4.99,
    originalPrice: 5.99,
    discountBadge: "Save 15%",
    unit: "4-pack bag",
    category: "fruits-veggies",
    rating: 4.9,
    reviewsCount: 312,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrs-4Cfq5zY4xbrVE5IN4Fuiwggn-rYM1o3NEYgzgqrS-OeegXrpj71ZHDEt6DfhI3MiH4nLZRw4TyizLBHhFoMiXHOfl2r6VKwZvDYGa_DRLhD-b5p3YKyRtg6zcljW_J5GTjPhKSW-dmdc44VfJNsUuNYLYClxttKcHSI0zNxsRHQAT-TpG3OvcRBITiRZ4VeNX1pnTehIuYvQDph3Fs3yZ-2zNHlUhzaNymF8GQ",
    stock: 45,
    organic: true,
    origin: "Michoacán, Mexico (Certified Fair Trade)",
    description: "Creamy, nutrient-rich Haas avocados with pebbled dark green skin, picked at optimal ripeness for immediate guacamole, toast, or salads.",
    nutrition: { calories: "160 kcal", fat: "15g", carbs: "9g", protein: "2g" },
    harvestDate: "Nov 23, 2026",
    expiryDate: "Dec 04, 2026",
  },
  {
    id: "prod-2",
    name: "Pasture-Raised Grade A Large Eggs",
    storeId: "store-2",
    storeName: "SunHarvest Direct",
    price: 5.49,
    originalPrice: 6.29,
    discountBadge: "Pasture Verified",
    unit: "12-count carton",
    category: "dairy-eggs",
    rating: 5.0,
    reviewsCount: 489,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-7ewUGtQtdJAK9p54C3ktlFaYf2TrWoTn9a2EI9__rBYjO61z2bZtGHyQBNFe2VT-IWCcoDsCuBcNx1itbLtgkA1g5afKWDBr_RxaF5KOGrMbzuCCqtqr3hMrF_sq7pm6p7tnv1H_sm4UXjZ4-c9ZfmPgbewll0Po1pSzjxIv3zRbNJO4eGsViPvH9Vp3khBYBdfE1lYfhNY4VkvdkTZUKKXMlL6J2LtqfmdTeHfE",
    stock: 62,
    organic: true,
    origin: "Hudson Valley, NY",
    description: "Laid by free-roaming hens with 108 square feet of fresh green pasture each. Yields vibrant amber yolks high in Omega-3.",
    nutrition: { calories: "70 kcal", fat: "5g", carbs: "0g", protein: "6g" },
    harvestDate: "Nov 24, 2026",
    expiryDate: "Dec 20, 2026",
  },
  {
    id: "prod-3",
    name: "Wild Caught Atlantic Salmon Fillet",
    storeId: "store-3",
    storeName: "Valley Fresh Butcher & Deli",
    price: 14.99,
    originalPrice: 18.00,
    discountBadge: "Wild Caught",
    unit: "1 lb (Skin-on)",
    category: "meat-seafood",
    rating: 4.8,
    reviewsCount: 204,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuADwMvqZGWUtp9lD7oI5DaT3lLxRXZH8WGVjUm7MBKaO8VoNcwTdEjv04yORrRXnxNf5VWkcP-9KQcjFROSMO8XPOH9pwj_BhOiv7nyaJt7eBQl_nO6AmN4rs3P3H3aoIuq_PUHql0Mr6SeJelVcrkmX0lE_7xaAsHUusJUvOYDNTmPBFR8LxCXGkryvGpRaSJ1MxX29KNoO38VIh39J2EC-PU0BD-oWPuBMT87hQM9",
    stock: 28,
    organic: false,
    origin: "Bristol Bay, Alaska",
    description: "Sustainably harvested cold-water wild salmon, rich in natural heart-healthy fats and deep ruby hue.",
    nutrition: { calories: "208 kcal", fat: "13g", carbs: "0g", protein: "22g" },
    harvestDate: "Nov 24, 2026",
    expiryDate: "Nov 28, 2026",
  },
  {
    id: "prod-4",
    name: "Cold-Pressed Extra Virgin Olive Oil",
    storeId: "store-1",
    storeName: "GreenField Organic Market",
    price: 13.50,
    originalPrice: 18.00,
    discountBadge: "25% OFF Flash",
    unit: "500 ml glass bottle",
    category: "household",
    rating: 4.9,
    reviewsCount: 178,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFZwavzxQ5pGrqEEzGPoXjjyg2tv_aFpyLiaJSOXUPVFZXOjnRc241ZS4KvF6bgut8Tw7QuK_YFXnO2YWcmpZXJmqM0mqIEP3SMjmz1qhrknKcvsrdvwwSlPsUcL5RPP3TSiBlrorMvYEGsTsPaI0uci-CvJGuRH_TIFWtc7RLIJQB38ON-2BaYyYwAbVZjeNkf-KcP-6A9gjej_LWTYwda8cSTpRZWppB5yyKcmzJ",
    stock: 35,
    organic: true,
    origin: "Crete, Greece",
    description: "Single-estate unfiltered cold extraction with grassy aroma, peppery finish, and under 0.2% acidity.",
    nutrition: { calories: "120 kcal", fat: "14g", carbs: "0g", protein: "0g" },
  },
  {
    id: "prod-5",
    name: "Sweet Driscoll Farms Strawberries",
    storeId: "store-1",
    storeName: "GreenField Organic Market",
    price: 4.49,
    originalPrice: 8.98,
    discountBadge: "BOGO Free Today",
    unit: "1 lb clamshell",
    category: "fruits-veggies",
    rating: 4.7,
    reviewsCount: 420,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIiFI_H-8e5vYi13cCndkMSgViGwg5i7rjfXLZyhHVJOBmJBYZ0IsaT_VM1NDud2d32xqM5Ke9rOjcW0x0jaltPM-858FltvWtrURzZwL99v_BhxsOzYApZRVx4os_sLvuALqjpUujwbqByIC_Z9kBwqGs0U7v8pBnStCCzFeYeeqdG0ksPospphtfQRzyAJtjHsX_e0TbJeSIOgflGEr_IKRMggcWa5arvZCJ5niF",
    stock: 50,
    organic: true,
    origin: "Watsonville, California",
    description: "Naturally sun-ripened organic strawberries bursting with sweet floral juice and crisp fresh caps.",
    nutrition: { calories: "45 kcal", fat: "0g", carbs: "11g", protein: "1g" },
    harvestDate: "Nov 23, 2026",
    expiryDate: "Nov 29, 2026",
  },
  {
    id: "prod-6",
    name: "Country Artisan Sourdough Boule",
    storeId: "store-4",
    storeName: "Brooklyn Artisan Bakery",
    price: 6.25,
    originalPrice: 7.00,
    discountBadge: "Warm from Oven",
    unit: "750g Boule",
    category: "bakery",
    rating: 4.9,
    reviewsCount: 310,
    image: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&q=80&w=600",
    stock: 18,
    organic: true,
    origin: "Park Slope, Brooklyn",
    description: "36-hour cold fermented wild levain crusty loaf with open custard crumb and deep caramel blistered crust.",
    nutrition: { calories: "180 kcal", fat: "1g", carbs: "36g", protein: "6g" },
    harvestDate: "Nov 25, 2026 (5:00 AM)",
    expiryDate: "Nov 28, 2026",
  },
  {
    id: "prod-7",
    name: "Organic Whole Grass-Fed Milk",
    storeId: "store-2",
    storeName: "SunHarvest Direct",
    price: 4.89,
    unit: "0.5 Gallon Glass Bottle",
    category: "dairy-eggs",
    rating: 4.9,
    reviewsCount: 165,
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600",
    stock: 30,
    organic: true,
    origin: "Lancaster County, PA",
    description: "Non-homogenized cream-top whole milk from 100% grass-fed Jersey cows. Return glass bottle for $2.00 deposit credit.",
    nutrition: { calories: "150 kcal", fat: "8g", carbs: "12g", protein: "8g" },
  },
  {
    id: "prod-8",
    name: "Prime Dry-Aged Ribeye Steak",
    storeId: "store-3",
    storeName: "Valley Fresh Butcher & Deli",
    price: 24.50,
    originalPrice: 28.00,
    discountBadge: "45-Day Aged",
    unit: "14 oz Cut",
    category: "meat-seafood",
    rating: 5.0,
    reviewsCount: 94,
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=600",
    stock: 12,
    organic: false,
    origin: "Black Angus, Iowa",
    description: "45-day Himalayan salt-room dry-aged ribeye steak with intense nuttiness, fork-tender grain, and rich marbling.",
    nutrition: { calories: "320 kcal", fat: "24g", carbs: "0g", protein: "26g" },
  }
];

export interface CartItem {
  product: Product;
  quantity: number;
}

export const INITIAL_CART: CartItem[] = [
  { product: PRODUCTS[0], quantity: 2 }, // 2x Avocados
  { product: PRODUCTS[1], quantity: 1 }, // 1x Eggs
  { product: PRODUCTS[4], quantity: 1 }, // 1x Strawberries
];

export interface Order {
  id: string;
  date: string;
  status: "Processing" | "Out for Delivery" | "Delivered" | "Cancelled";
  itemsCount: number;
  total: number;
  stores: string[];
  trackingNumber: string;
  eta: string;
  courierName: string;
}

export const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-94821",
    date: "Today, 10:14 AM",
    status: "Out for Delivery",
    itemsCount: 4,
    total: 33.95,
    stores: ["GreenField Organic Market"],
    trackingNumber: "FM-TRK-7712",
    eta: "18 mins (Arriving by 10:45 AM)",
    courierName: "Marcus Vance",
  },
  {
    id: "ORD-88219",
    date: "Nov 22, 2026",
    status: "Delivered",
    itemsCount: 7,
    total: 62.40,
    stores: ["GreenField Organic", "SunHarvest Direct"],
    trackingNumber: "FM-TRK-6501",
    eta: "Delivered at 2:15 PM",
    courierName: "Elena Rostova",
  },
  {
    id: "ORD-79104",
    date: "Nov 18, 2026",
    status: "Delivered",
    itemsCount: 3,
    total: 28.15,
    stores: ["Brooklyn Artisan Bakery"],
    trackingNumber: "FM-TRK-5419",
    eta: "Delivered at 9:30 AM",
    courierName: "David Kim",
  }
];
