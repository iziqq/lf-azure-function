import * as v from "valibot";
import { SupportedLanguages } from "../../../../../core/enum/supported-languages.enum";

export const RegisterRequestSchema = v.object({
  email: v.pipe(v.string(), v.email("auth.validation.invalid_email")),
  password: v.pipe(v.string(), v.minLength(6, "auth.validation.short_password")),
  firstName: v.pipe(v.string(), v.minLength(2, "auth.validation.short_firstName")),
  lastName: v.pipe(v.string(), v.minLength(2, "auth.validation.short_lastName")),
  language: v.optional(v.enum(SupportedLanguages), SupportedLanguages.CZ)
});

export type RegisterRequest = v.InferOutput<typeof RegisterRequestSchema>;
