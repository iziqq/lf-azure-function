import * as v from "valibot";

export const AuthSessionSchema = v.object({
  id: v.string(),
  userId: v.string(),
  email: v.pipe(v.string(), v.email()),
  code2fa: v.string(),
  attempts: v.number(),
  blockedUntil: v.optional(v.string()),
  isActive: v.boolean(),
  token: v.optional(v.string()),
  createdAt: v.string(),
  expiresAt: v.string()
});

export type AuthSession = v.InferOutput<typeof AuthSessionSchema>;
