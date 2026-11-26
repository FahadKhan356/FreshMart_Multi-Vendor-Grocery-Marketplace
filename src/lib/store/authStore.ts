import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserRole } from "@/lib/validations/auth";

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  storeId?: string;
  storeName?: string;
}

export const DEMO_ROLE_USERS: Record<UserRole, AuthUser> = {
  customer: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "customer@freshmart.local",
    fullName: "Sarah Jenkins",
    role: "customer",
    phone: "(555) 234-8901",
  },
  vendor: {
    id: "11111111-1111-1111-1111-111111111111",
    email: "vendor1@freshmart.local",
    fullName: "GreenField Organic Market",
    role: "vendor",
    phone: "(555) 441-9920",
    storeId: "a1111111-1111-1111-1111-111111111111",
    storeName: "GreenField Organic Market",
  },
  admin: {
    id: "33333333-3333-3333-3333-333333333333",
    email: "admin@freshmart.local",
    fullName: "Super Admin",
    role: "admin",
    phone: "(555) 100-0001",
  },
  courier: {
    id: "44444444-4444-4444-4444-444444444444",
    email: "courier@freshmart.local",
    fullName: "Marcus Vance",
    role: "courier",
    phone: "(555) 782-3490",
  },
};

interface AuthStore {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

function setRoleCookies(user: AuthUser | null) {
  if (typeof document === "undefined") return;
  if (!user) {
    document.cookie = "freshmart_role=; path=/; max-age=0";
    document.cookie = "freshmart_uid=; path=/; max-age=0";
  } else {
    document.cookie = `freshmart_role=${user.role}; path=/; max-age=604800`;
    document.cookie = `freshmart_uid=${user.id}; path=/; max-age=604800`;
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: DEMO_ROLE_USERS.customer,

      setUser: (user) => {
        setRoleCookies(user);
        set({ user });
      },

      switchRole: (role) => {
        const targetUser = DEMO_ROLE_USERS[role];
        setRoleCookies(targetUser);
        set({ user: targetUser });
      },

      logout: () => {
        setRoleCookies(null);
        set({ user: null });
      },
    }),
    {
      name: "freshmart_auth_session_v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => null,
              removeItem: () => null,
            }
      ),
    }
  )
);
