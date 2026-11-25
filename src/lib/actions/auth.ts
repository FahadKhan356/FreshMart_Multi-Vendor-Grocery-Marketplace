"use server";

import { createClient } from "@/lib/supabase/server";
import { SignUpSchema, SignInSchema, UserRole } from "@/lib/validations/auth";

export async function signUpUser(formData: {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}) {
  const validated = SignUpSchema.parse(formData);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      data: {
        full_name: validated.fullName,
        role: validated.role,
        phone: validated.phone,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Insert profile row
  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      role: validated.role,
      full_name: validated.fullName,
      email: validated.email,
      phone: validated.phone,
    });
  }

  return { success: true, user: data.user };
}

export async function signInUser(formData: { email: string; password: string }) {
  const validated = SignInSchema.parse(formData);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data.session, user: data.user };
}

export async function signOutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}
