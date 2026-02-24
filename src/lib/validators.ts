import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  surname: z.string().min(1, "Surname is required").max(50, "Surname is too long"),
  
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(32, "Password must be less than 32 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),

  password: z.string().min(1, "Password is required"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
