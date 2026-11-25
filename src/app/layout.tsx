import type { Metadata } from "next";
import "./globals.css";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";

export const metadata: Metadata = {
  title: "FreshMart - Multi-Vendor Grocery Marketplace",
  description: "Hyper-local organic grocery marketplace connecting community farmstands, boutique bakeries, artisanal butchers, and local supermarkets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
        {children}
        {/* Floating persistent role switcher to test and jump across Customer, Vendor, Admin, and Courier roles */}
        <RoleSwitcher />
      </body>
    </html>
  );
}
