import { z } from "zod";

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  address: z.string().min(5, "Street address is required"),
  apartment: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(4, "ZIP / Postal code is required"),
});

export const CheckoutOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["card", "cod"]).default("card"),
  deliveryFeeOverride: z.number().min(0).optional(),
  shippingAddress: ShippingAddressSchema,
  deliveryWindow: z.string().default("Today, 4:00 PM – 6:00 PM"),
  deliveryInstructions: z.string().optional(),
  tipAmount: z.number().min(0).default(0),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
      unit: z.string(),
      storeId: z.string(),
      storeName: z.string(),
      image: z.string().optional(),
    })
  ).min(1, "Cart cannot be empty"),
});

export const RefundRequestSchema = z.object({
  customerId: z.string().uuid().optional(),
  orderId: z.string(),
  vendorOrderId: z.string().optional(),
  storeId: z.string(),
  reason: z.enum([
    "damaged_goods",
    "wrong_item",
    "missing_item",
    "expired_product",
    "poor_quality",
    "order_not_delivered",
    "other",
  ]),
  additionalDetails: z.string().min(10, "Please provide at least 10 characters explaining the issue"),
  imageUrl: z.string().optional(),
  items: z.array(
    z.object({
      orderItemId: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      amount: z.number().positive(),
    })
  ).min(1, "At least one item must be selected for refund"),
});

export const UpdateOrderStatusSchema = z.object({
  vendorOrderId: z.string(),
  status: z.enum([
    "pending",
    "accepted",
    "preparing",
    "ready",
    "dispatched",
    "completed",
    "rejected",
    "cancelled",
  ]),
});

export type ShippingAddress = z.infer<typeof ShippingAddressSchema>;
export type CheckoutOrderInput = z.infer<typeof CheckoutOrderSchema>;
export type RefundRequestInput = z.infer<typeof RefundRequestSchema>;
