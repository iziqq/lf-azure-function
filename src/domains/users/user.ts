import * as v from "valibot";
import { SupportedLanguages } from "../../core/enum/supported-languages.enum";

export enum UserRole {
  ADMIN = "Admin",
  CUSTOMER = "Customer"
}

export const UserSchema = v.object({
  id: v.string(),
  email: v.pipe(v.string(), v.email()),
  firstName: v.string(),
  lastName: v.string(),
  passwordHash: v.string(), // Zahashované heslo pomocí bcrypt
  language: v.enum(SupportedLanguages),
  role: v.enum(UserRole),
  isVerified: v.boolean(),
  createdAt: v.string(),
  updatedAt: v.string()
});

export type User = v.InferOutput<typeof UserSchema>;
