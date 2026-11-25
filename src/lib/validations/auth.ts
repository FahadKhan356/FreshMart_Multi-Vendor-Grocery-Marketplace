import { z } from "zod";

export const UserRoleSchema = z.enum(["customer", "vendor", "admin", "courier"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SignUpSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: UserRoleSchema.default("customer"),
  phone: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
