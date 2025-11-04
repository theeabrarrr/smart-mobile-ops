import { z } from 'zod';

// Authentication Validation
export const authSignUpSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be less than 72 characters")
});

export const authSignInSchema = z.object({
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(1, "Password is required")
    .max(72, "Password must be less than 72 characters")
});

// Customer Validation
export const customerSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Phone can only contain numbers, +, -, spaces and parentheses")
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal('')),
  address: z.string()
    .trim()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal(''))
});

// Mobile/Inventory Validation
export const mobileSchema = z.object({
  brand: z.string()
    .trim()
    .min(1, "Brand is required")
    .max(50, "Brand must be less than 50 characters"),
  model: z.string()
    .trim()
    .min(1, "Model is required")
    .max(100, "Model must be less than 100 characters"),
  imei: z.string()
    .trim()
    .regex(/^[0-9]*$/, "IMEI can only contain numbers")
    .max(15, "IMEI must be 15 digits or less")
    .optional()
    .or(z.literal('')),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  purchase_price: z.string()
    .optional()
    .refine((val) => !val || !isNaN(parseFloat(val)), "Purchase price must be a valid number")
    .refine((val) => !val || parseFloat(val) >= 0, "Purchase price cannot be negative")
    .refine((val) => !val || parseFloat(val) <= 10000000, "Purchase price must be less than 10,000,000"),
  selling_price: z.string()
    .optional()
    .refine((val) => !val || !isNaN(parseFloat(val)), "Selling price must be a valid number")
    .refine((val) => !val || parseFloat(val) >= 0, "Selling price cannot be negative")
    .refine((val) => !val || parseFloat(val) <= 10000000, "Selling price must be less than 10,000,000"),
  purchase_date: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
  supplier_name: z.string()
    .trim()
    .max(100, "Supplier name must be less than 100 characters")
    .optional()
    .or(z.literal('')),
  seller_cnic: z.string()
    .trim()
    .regex(/^[0-9\-]*$/, "CNIC can only contain numbers and dashes")
    .max(15, "CNIC must be 15 characters or less")
    .optional()
    .or(z.literal('')),
  seller_phone: z.string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Phone can only contain numbers, +, -, spaces and parentheses")
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal(''))
});

// Purchase Validation
export const purchaseSchema = z.object({
  brand: z.string()
    .trim()
    .min(1, "Brand is required")
    .max(50, "Brand must be less than 50 characters"),
  model: z.string()
    .trim()
    .min(1, "Model is required")
    .max(100, "Model must be less than 100 characters"),
  purchase_price: z.string()
    .min(1, "Purchase price is required")
    .refine((val) => !isNaN(parseFloat(val)), "Purchase price must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Purchase price must be greater than 0")
    .refine((val) => parseFloat(val) <= 10000000, "Purchase price must be less than 10,000,000"),
  purchase_date: z.string()
    .min(1, "Purchase date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  supplier_name: z.string()
    .trim()
    .min(1, "Supplier name is required")
    .max(100, "Supplier name must be less than 100 characters"),
  seller_cnic: z.string()
    .trim()
    .regex(/^[0-9\-]*$/, "CNIC can only contain numbers and dashes")
    .max(15, "CNIC must be 15 characters or less")
    .optional()
    .or(z.literal('')),
  seller_phone: z.string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Phone can only contain numbers, +, -, spaces and parentheses")
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal(''))
});

// Sale Validation
export const saleSchema = z.object({
  mobile_id: z.string()
    .min(1, "Mobile selection is required"),
  customer_name: z.string()
    .trim()
    .max(100, "Customer name must be less than 100 characters")
    .optional()
    .or(z.literal('')),
  sale_price: z.string()
    .min(1, "Sale price is required")
    .refine((val) => !isNaN(parseFloat(val)), "Sale price must be a valid number")
    .refine((val) => parseFloat(val) > 0, "Sale price must be greater than 0")
    .refine((val) => parseFloat(val) <= 10000000, "Sale price must be less than 10,000,000"),
  sale_date: z.string()
    .min(1, "Sale date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  payment_status: z.enum(['pending', 'paid', 'partial', 'cancelled']),
  notes: z.string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal(''))
});

// Profile Validation
export const profileSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be less than 100 characters"),
  business_name: z.string()
    .trim()
    .max(100, "Business name must be less than 100 characters")
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Phone can only contain numbers, +, -, spaces and parentheses")
    .max(20, "Phone must be less than 20 characters")
    .optional()
    .or(z.literal('')),
  address: z.string()
    .trim()
    .max(500, "Address must be less than 500 characters")
    .optional()
    .or(z.literal(''))
});
