import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/validations/auth";

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile || null;
  } catch (error) {
    return null;
  }
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    throw new Error(`Unauthorized. Requires one of: ${allowedRoles.join(", ")}`);
  }
  return user;
}
