import * as v from "valibot";

export const LoginRequestSchema = v.object({
  email: v.pipe(v.string(), v.email("Neplatný formát emailu")),
  password: v.pipe(v.string(), v.minLength(6, "Heslo musí mít alespoň 6 znaků"))
});

export type LoginRequest = v.InferOutput<typeof LoginRequestSchema>;
