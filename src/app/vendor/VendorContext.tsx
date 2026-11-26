"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import {
  VendorStore,
  VendorNotificationRow,
  getVendorStores,
  getVendorStoreById,
  getVendorSidebarBadges,
  getVendorNotifications,
} from "@/lib/data/vendorData";
import { markVendorNotificationsRead } from "@/lib/actions/vendor";

interface VendorContextValue {
  userId: string;
  userRole: string;
  stores: VendorStore[];
  store: VendorStore | null;
  storeId: string | null;
  loading: boolean;
  nearExpiryCount: number;
  newOrdersCount: number;
  notifications: VendorNotificationRow[];
  unreadCount: number;
  switchStore: (storeId: string) => void;
  refreshStore: () => Promise<void>;
  refreshBadges: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [store, setStore] = useState<VendorStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearExpiryCount, setNearExpiryCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [notifications, setNotifications] = useState<VendorNotificationRow[]>([]);

  const userId = user?.id || "";
  const userRole = user?.role || "vendor";

  const loadInitial = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fetchedStores, fetchedNotifs] = await Promise.all([
        getVendorStores(userId, userRole),
        getVendorNotifications(userId),
      ]);
      setStores(fetchedStores);
      setNotifications(fetchedNotifs);

      const preferredId =
        (user?.storeId && fetchedStores.some((s) => s.id === user.storeId) ? user.storeId : null) ||
        fetchedStores[0]?.id ||
        null;

      setActiveStoreId(preferredId);
      const selected = fetchedStores.find((s) => s.id === preferredId) || null;
      setStore(selected);

      if (preferredId) {
        const badges = await getVendorSidebarBadges(preferredId);
        setNearExpiryCount(badges.nearExpiryCount);
        setNewOrdersCount(badges.newOrdersCount);
      }
    } catch (err) {
      console.error("Failed to initialize vendor context:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole, user?.storeId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const switchStore = useCallback(
    async (newStoreId: string) => {
      setActiveStoreId(newStoreId);
      const found = stores.find((s) => s.id === newStoreId) || (await getVendorStoreById(newStoreId));
      setStore(found);
      if (newStoreId) {
        const badges = await getVendorSidebarBadges(newStoreId);
        setNearExpiryCount(badges.nearExpiryCount);
        setNewOrdersCount(badges.newOrdersCount);
      }
    },
    [stores]
  );

  const refreshStore = useCallback(async () => {
    if (!activeStoreId) return;
    const fresh = await getVendorStoreById(activeStoreId);
    if (fresh) {
      setStore(fresh);
      setStores((prev) => prev.map((s) => (s.id === fresh.id ? fresh : s)));
    }
  }, [activeStoreId]);

  const refreshBadges = useCallback(async () => {
    if (!activeStoreId) return;
    const [badges, notifs] = await Promise.all([
      getVendorSidebarBadges(activeStoreId),
      userId ? getVendorNotifications(userId) : Promise.resolve([]),
    ]);
    setNearExpiryCount(badges.nearExpiryCount);
    setNewOrdersCount(badges.newOrdersCount);
    setNotifications(notifs);
  }, [activeStoreId, userId]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!userId) return;
    await markVendorNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <VendorContext.Provider
      value={{
        userId,
        userRole,
        stores,
        store,
        storeId: activeStoreId,
        loading,
        nearExpiryCount,
        newOrdersCount,
        notifications,
        unreadCount,
        switchStore,
        refreshStore,
        refreshBadges,
        markAllNotificationsRead,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) {
    throw new Error("useVendor must be used within VendorProvider");
  }
  return ctx;
}
